
import React, { useState, useEffect } from 'react';
import { Cloud, AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

export const AWSStatusIndicator = ({ config }) => {
  const [status, setStatus] = useState('loading');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const checkAWSStatus = async () => {
      try {
        // Try to get AWS health
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus('connected');
          setDetails(data);
        } else {
          setStatus('disconnected');
          setDetails(null);
        }
      } catch (error) {
        console.error('AWS status check failed:', error);
        setStatus('disconnected');
        setDetails(null);
      }
    };

    checkAWSStatus();
    // Check every 5 minutes
    const interval = setInterval(checkAWSStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = status === 'connected';
  const bgColor = isConnected ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isConnected ? 'border-green-200' : 'border-red-200';
  const textColor = isConnected ? 'text-green-700' : 'text-red-700';
  const iconColor = isConnected ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`relative group cursor-help`}>
      {/* Status Icon */}
      <div className="flex items-center space-x-2">
        {isConnected ? (
          <CheckCircle className={`${iconColor}`} size={20} />
        ) : (
          <AlertCircle className={`${iconColor} animate-pulse`} size={20} />
        )}
        <span className={`text-xs font-semibold ${textColor}`}>
          {isConnected ? 'AWS' : 'AWS Offline'}
        </span>
      </div>

      {/* Tooltip on Hover */}
      <div className={`absolute right-0 top-full mt-2 w-72 p-4 rounded-lg shadow-lg border ${bgColor} ${borderColor} hidden group-hover:block z-50`}>
        <div className="space-y-2 text-sm">
          <div className="font-semibold flex items-center space-x-2">
            <Cloud size={16} />
            <span>AWS Connection Status</span>
          </div>
          
          {isConnected && details ? (
            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="text-green-600 font-semibold">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Account ID:</span>
                <span className="font-mono text-xs">{details.accountId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ARN:</span>
                <span className="font-mono text-xs break-all">{details.arn}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Region:</span>
                <span className="font-mono text-xs">{config?.awsRegion || 'ca-central-1'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">S3 Raw Bucket:</span>
                <span className="font-mono text-xs break-all">{config?.awsS3BucketRaw || 'N/A'}</span>
              </div>
              <div className="pt-2 border-t border-green-200 text-xs text-slate-500">
                Last checked: {details.lastChecked}
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="text-red-600 font-semibold">Disconnected</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                AWS credentials have expired. Please reauthenticate:
              </p>
              <code className="bg-slate-100 p-2 rounded text-xs block mt-2">
                aws sso login
              </code>
              <p className="text-xs text-slate-500 mt-2">
                Then restart the backend server.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

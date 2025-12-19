import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { handleOAuthCallback } from '../services/auth';

export default function Callback({ onAuth }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the authorization code from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorParam = params.get('error');

        if (errorParam) {
          setError(`Authentication failed: ${params.get('error_description') || errorParam}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setLoading(false);
          return;
        }

        // Prevent double execution by checking if we've already processed this code
        const processedKey = `oauth_processed_${code}`;
        if (sessionStorage.getItem(processedKey)) {
          // Already processed this code, skip
          return;
        }
        
        // Mark this code as being processed
        sessionStorage.setItem(processedKey, 'true');

        // Exchange code for tokens
        const result = await handleOAuthCallback(code);
        
        // Call onAuth with the result
        onAuth(result);
        
        // Clean up the processed flag after successful auth
        sessionStorage.removeItem(processedKey);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Failed to complete authentication');
        setLoading(false);
      }
    };

    processCallback();
  }, [onAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="p-3 bg-gradient-to-br from-indigo-700 to-slate-900 rounded-full text-white shadow-lg mb-4 inline-block">
            <Shield size={32} />
          </div>
          
          {loading && (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Completing Sign In...
              </h2>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            </>
          )}

          {error && (
            <>
              <h2 className="text-xl font-bold text-red-600 mb-2">
                Authentication Error
              </h2>
              <p className="text-slate-600 mb-4">{error}</p>
              <a
                href="/"
                className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Return to Login
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

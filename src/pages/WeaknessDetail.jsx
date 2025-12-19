import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Calendar, Shield, FileText } from 'lucide-react';
import { getWeaknessDetail } from '../services/auth';

export default function WeaknessDetail({ weaknessId, onBack }) {
  const [weakness, setWeakness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadWeaknessDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getWeaknessDetail(weaknessId);
        setWeakness(data);
      } catch (err) {
        console.error('Error loading weakness detail:', err);
        setError(err.message || 'Erreur lors du chargement du détail');
        // Mock data for demo
        setWeakness({
          riskId: weaknessId,
          category: 'Anomalies',
          model: 'GoldenTicket',
          source: 'pingcastle',
          lastUpdated: '2025-12-18T14:32:25.687Z',
          evidence: [
            {
              evidenceId: '5bfd1bd7-066b-4265-88fd-6ca29d10bbdb',
              points: '30',
              rationale: 'Last change of the Kerberos password: 956 day(s) ago',
              timestamp: '2025-12-18T14:32:25.687Z',
              s3Key: 'raw/pingcastle/scan/date=2025-12-18/04b628b2-03ff-42da-bdc8-1205f79e99a9.xml',
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadWeaknessDetail();
  }, [weaknessId]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !weakness) {
    return (
      <div className="p-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-red-900 mb-1">Erreur</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category) => {
    const colors = {
      Anomalies: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      PrivilegedAccounts: 'bg-red-100 text-red-800 border-red-300',
      StaleObjects: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour à la liste
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold">{weakness.riskId}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full border bg-white ${getCategoryColor(
                weakness.category
              )}`}
            >
              {weakness.category}
            </span>
            <span className="text-blue-100">
              Modèle: <span className="font-medium text-white">{weakness.model}</span>
            </span>
            <span className="text-blue-100">
              Source: <span className="font-medium text-white">{weakness.source}</span>
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Dernière mise à jour:{' '}
              <span className="font-medium text-gray-900">
                {new Date(weakness.lastUpdated).toLocaleString('fr-FR')}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium text-gray-900">
                {weakness.evidence?.length || 0} évidence{weakness.evidence?.length > 1 ? 's' : ''}
              </span>
            </span>
          </div>
        </div>

        {/* Evidence */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Évidences</h2>
          {weakness.evidence && weakness.evidence.length > 0 ? (
            <div className="space-y-4">
              {weakness.evidence.map((ev) => (
                <div
                  key={ev.evidenceId}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-xs font-mono text-gray-500">
                        {ev.evidenceId}
                      </span>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                      {ev.points} points
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mb-3 font-medium">{ev.rationale}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ev.timestamp).toLocaleString('fr-FR')}
                    </span>
                    <span className="font-mono truncate max-w-md" title={ev.s3Key}>
                      {ev.s3Key}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune évidence disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

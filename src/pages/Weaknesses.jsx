import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { getWeaknesses } from '../services/auth';

export default function Weaknesses({ onSelectWeakness }) {
  const [weaknesses, setWeaknesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWeaknesses();
  }, []);

  const loadWeaknesses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getWeaknesses();
      setWeaknesses(data.weaknesses || data || []);
    } catch (err) {
      console.error('Error loading weaknesses:', err);
      setError(err.message || 'Erreur lors du chargement des weaknesses');
      // Mock data for demo if API not ready
      setWeaknesses([
        {
          riskId: 'A-Krbtgt',
          category: 'Anomalies',
          model: 'GoldenTicket',
          lastUpdated: '2025-12-18T14:32:25.687Z',
          evidenceCount: 1,
        },
        {
          riskId: 'P-AdminLogin',
          category: 'PrivilegedAccounts',
          model: 'AdminControl',
          lastUpdated: '2025-12-18T14:32:25.687Z',
          evidenceCount: 1,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Anomalies: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      PrivilegedAccounts: 'bg-red-100 text-red-800 border-red-300',
      StaleObjects: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Weaknesses</h1>
        <p className="text-gray-600">
          Liste des faiblesses détectées dans votre Active Directory
        </p>
      </div>

      {error && !weaknesses.length && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                API non disponible
              </h3>
              <p className="text-sm text-yellow-700">
                {error} - Affichage de données de démonstration.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {weaknesses.length} weakness{weaknesses.length > 1 ? 'es' : ''} détectée{weaknesses.length > 1 ? 's' : ''}
            </h2>
            <button
              onClick={loadWeaknesses}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Actualiser
            </button>
          </div>
        </div>

        {weaknesses.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Aucune weakness détectée</p>
            <p className="text-sm">
              Uploadez un scan PingCastle pour commencer l'analyse
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {weaknesses.map((weakness) => (
              <div
                key={weakness.riskId}
                onClick={() => onSelectWeakness && onSelectWeakness(weakness)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {weakness.riskId}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getCategoryColor(
                          weakness.category
                        )}`}
                      >
                        {weakness.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {weakness.model}
                      </span>
                      {weakness.evidenceCount && (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          {weakness.evidenceCount} évidence{weakness.evidenceCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {weakness.lastUpdated && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(weakness.lastUpdated).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                      Voir détails →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

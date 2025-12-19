import React from 'react';
import { Card } from '../components';
import { Brain, CheckCircle, Play, RefreshCw } from 'lucide-react';
import { AI_WEIGHTS } from '../utils/constants';

export default function MLView({ ctx }) {
  const { isSimulating, adaptiveMode, runSimulation } = ctx;
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Centre d'Apprentissage Machine</h2>
          <p className="text-slate-500 text-sm">Calibration du modèle de risque basé sur les données historiques.</p>
        </div>
        <button onClick={runSimulation} disabled={isSimulating || adaptiveMode} className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg flex items-center space-x-2 transition-all ${adaptiveMode ? 'bg-green-600 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {isSimulating ? <RefreshCw className="animate-spin" /> : adaptiveMode ? <CheckCircle /> : <Play fill="white" size={18} />}
          <span>{isSimulating ? 'Entraînement en cours...' : adaptiveMode ? 'Modèle Optimisé Actif' : 'Lancer l\'Optimisation du Modèle'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <h3 className="font-bold text-slate-700 mb-4">Pondération des Caractéristiques</h3>
          <div className="space-y-4">
            {AI_WEIGHTS.map((w, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{w.feature}</span>
                  <div className="flex space-x-2">
                    <span className={`text-xs font-bold ${adaptiveMode ? (w.change.includes('+') ? 'text-green-600' : 'text-red-500') : 'hidden'}`}>{w.change}</span>
                    <span className="font-mono text-slate-500">{(w.weight * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${adaptiveMode ? 'bg-indigo-500' : 'bg-slate-400'}`} style={{ width: `${adaptiveMode ? (w.weight * 100) + (parseInt(w.change)) : w.weight * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-slate-900 text-white flex flex-col justify-center items-center text-center p-8">
          <div className="relative mb-6">
            <div className={`absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full ${adaptiveMode ? 'animate-pulse' : ''}`}></div>
            <Brain size={64} className="relative z-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold">Précision du Modèle</h3>
          <div className="text-4xl font-bold my-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{adaptiveMode ? '94.2%' : '81.5%'}</div>
        </Card>
      </div>
    </div>
  );
}

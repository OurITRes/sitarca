import { ChevronRight } from 'lucide-react';
import { AWSStatusIndicator } from './AWSStatusIndicator';

export const NavigationHeader = ({ activeView, config }) => (
  <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-10">
    <div>
      <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
        <span>Opérations</span>
        <ChevronRight size={14} />
        <span className="text-slate-800 font-medium capitalize">
          {activeView === 'ml' ? 'Intelligence Artificielle' :
           activeView === 'settings' ? 'Configuration' :
           activeView}
        </span>
      </div>
      <h2 className="text-xl font-bold text-slate-800">
         {activeView === 'dashboard' && 'Vue d\'Ensemble de la Posture'}
         {activeView === 'details' && 'Investigation & Graphe'}
         {activeView === 'ml' && 'Configuration du Modèle Adaptatif'}
         {activeView === 'remediation' && 'Plan d\'Amélioration Continue'}
         {activeView === 'settings' && 'Connecteurs'}
      </h2>
    </div>
    <div className="flex items-center space-x-4">
      <AWSStatusIndicator config={config} />
    </div>
  </header>
);

// Gestion de l'État (Hook React)
// Pour ne pas alourdir les composants, on crée un Hook personnalisé qui va gérer la logique de filtrage.

import { useState, useMemo } from 'react';
import { UnifiedFinding, SecurityFramework } from '../types/compliance';

export const useComplianceEngine = (allFindings: UnifiedFinding[]) => {
  
  // Fonction pour calculer le score d'une catégorie (ex: NIST Protect)
  const calculateCategoryRisk = (categoryIds: string[], frameworkKey: 'nist_csf' | 'cis_v8') => {
    const relevantFindings = allFindings.filter(f => 
      f.complianceReferences?.some(ref => ref.framework === frameworkKey && categoryIds.includes(ref.controlId))
    );

    // Logique de Scoring "Intelligent" (Recommendation B)
    // Si on a du CRITICAL, le score explose
    const hasCritical = relevantFindings.some(f => f.severity === 'CRITICAL');
    if (hasCritical) return 100;

    const count = relevantFindings.length;
    return Math.min(count * 10, 90); // Formule simplifiée pour l'exemple
  };

  return {
    calculateCategoryRisk,
    // Tu pourras ajouter ici des fonctions comme "getTopRiskFindings()"
  };
};
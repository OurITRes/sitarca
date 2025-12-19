/**
 * FindingsEnricher.js
 * Intelligence croisée pour enrichir les findings avec priorités et contexte
 */

/**
 * Enrichit les findings avec du contexte croisé (confirmations multiples sources, priorisation)
 * @param {Array} findings - Liste de findings normalisés
 * @returns {Array} - Findings enrichis avec métadonnées de priorisation
 */
export function enrichFindingsWithContext(findings) {
  if (!Array.isArray(findings) || findings.length === 0) {
    return findings;
  }

  // Grouper par asset/chemin pour détecter les confirmations croisées
  const assetMap = {};
  findings.forEach((finding) => {
    const key = finding.asset || finding.path || finding.id;
    if (!assetMap[key]) {
      assetMap[key] = [];
    }
    assetMap[key].push(finding);
  });

  // Enrichir chaque finding
  return findings.map((finding) => {
    const key = finding.asset || finding.path || finding.id;
    const relatedFindings = assetMap[key] || [];
    
    // Détection de confirmation croisée (ex: PC + BH sur même asset)
    const sources = new Set(relatedFindings.map((f) => f.source));
    const isCrossConfirmed = sources.size > 1;
    
    // Boost de priorité si confirmation croisée
    let priorityBoost = 0;
    if (isCrossConfirmed) {
      priorityBoost = 10;
    }
    
    // Calcul d'un score de priorité enrichi
    const basePriority = finding.priority || 0;
    const enrichedPriority = basePriority + priorityBoost;
    
    return {
      ...finding,
      enrichedPriority,
      isCrossConfirmed,
      relatedSourcesCount: sources.size,
      enrichedAt: new Date().toISOString(),
    };
  });
}

export default {
  enrichFindingsWithContext,
};

// Le Moteur de Normalisation (Service)
// On crée une fonction qui prend les données brutes (XML PingCastle parsé ou JSON BloodHound) 
// et les convertit en UnifiedFinding.

import { UnifiedFinding, SeverityLevel } from '../types/compliance';
import { COMPLIANCE_DICTIONARY } from '../data/ComplianceMapping';

// Helper pour convertir le score PingCastle (0-100) en Sévérité
const mapScoreToSeverity = (score: number): SeverityLevel => {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
};

export const normalizePingCastleFindings = (rawXmlData: any): UnifiedFinding[] => {
  // Supposons que rawXmlData est déjà converti de XML en JSON via 'fast-xml-parser'
  if (!rawXmlData?.risks) return [];

  return rawXmlData.risks.map((risk: any) => {
    const mapping = COMPLIANCE_DICTIONARY[risk.id] || {};

    return {
      id: `PC-${risk.id}`,
      source: 'PingCastle',
      originalId: risk.id,
      title: risk.ruleName,
      description: risk.overview,
      affectedAssets: [], // À extraire du XML si dispo
      severity: mapScoreToSeverity(Number(risk.score)),
      
      complianceTags: {
        nist_csf: mapping.nist || [],
        cis_v8: mapping.cis || [],
        iso_27001: mapping.iso || [],
        mitre_attack: mapping.mitre || []
      },
      
      remediation: {
        effort: 'MEDIUM', // Valeur par défaut pour l'instant
        action: risk.remediation || "Consulter la documentation PingCastle"
      }
    };
  });
};

// Ajouter ici la fonction normalizeBloodHoundFindings()...
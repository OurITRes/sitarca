/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { normalizePingCastleFindings } from '../services/NormalizationService'; // (Ton service existant)
import { enrichFindingsWithContext } from '../services/FindingsEnricher'; // (L'intelligence croisée)

const UnifiedDataContext = createContext();

export const useUnifiedData = () => useContext(UnifiedDataContext);

// POC Mock Findings for testing
const MOCK_FINDINGS = [
  {
    id: 'MOCK-001',
    source: 'PingCastle',
    originalId: 'P-001',
    title: 'Administrator accounts with empty password',
    severity: 'CRITICAL',
    description: 'Local accounts with empty passwords pose a critical security risk',
    complianceTags: ['NIST:PROTECT', 'CIS:IG1', 'MITRE:T1078'],
    affectedAssets: ['CN=ADMIN_ACCOUNT,OU=Users,DC=corp,DC=com'],
    remediation: { status: 'OPEN', effort: 'LOW' }
  },
  {
    id: 'MOCK-002',
    source: 'BloodHound',
    originalId: 'BH-CUSTOM-01',
    title: 'Domain Users can Reset Password',
    severity: 'HIGH',
    description: 'Domain Users group has the ability to reset passwords on sensitive accounts',
    complianceTags: ['NIST:IDENTIFY', 'CIS:IG2', 'MITRE:T1098'],
    affectedAssets: ['CN=TIER0_ADMINS,OU=Groups,DC=corp,DC=com'],
    remediation: { status: 'OPEN', effort: 'MEDIUM' }
  },
  {
    id: 'MOCK-003',
    source: 'PingCastle',
    originalId: 'P-063',
    title: 'Spooler Service Running on Domain Controllers',
    severity: 'HIGH',
    description: 'PrintNightmare vulnerability vector (CVE-2021-34527)',
    complianceTags: ['NIST:PROTECT', 'CIS:IG1', 'MITRE:T1210'],
    affectedAssets: ['DC01.corp.com', 'DC02.corp.com'],
    remediation: { status: 'IN_PROGRESS', effort: 'MEDIUM' }
  },
  {
    id: 'MOCK-004',
    source: 'BloodHound',
    originalId: 'BH-CUSTOM-02',
    title: 'Kerberoasting Target Detected',
    severity: 'MEDIUM',
    description: 'Service accounts with weak passwords detected as Kerberoasting targets',
    complianceTags: ['NIST:DETECT', 'CIS:IG2', 'MITRE:T1558'],
    affectedAssets: ['CN=SVC_APP,OU=Service Accounts,DC=corp,DC=com'],
    remediation: { status: 'OPEN', effort: 'LOW' }
  },
  {
    id: 'MOCK-005',
    source: 'PingCastle',
    originalId: 'P-016',
    title: 'AdminCount attribute not properly maintained',
    severity: 'MEDIUM',
    description: 'Accounts with lingering AdminCount attribute may retain privileges',
    complianceTags: ['NIST:IDENTIFY', 'CIS:IG1', 'MITRE:T1098'],
    affectedAssets: ['Various user accounts', '5+ objects detected'],
    remediation: { status: 'OPEN', effort: 'MEDIUM' }
  },
  {
    id: 'MOCK-006',
    source: 'BloodHound',
    originalId: 'BH-CUSTOM-03',
    title: 'GenericWrite on Domain Users',
    severity: 'HIGH',
    description: 'Non-privileged accounts have write permissions to critical objects',
    complianceTags: ['NIST:PROTECT', 'CIS:IG2', 'MITRE:T1098'],
    affectedAssets: ['CN=Domain Admins,OU=Groups,DC=corp,DC=com'],
    remediation: { status: 'OPEN', effort: 'HIGH' }
  },
  {
    id: 'MOCK-007',
    source: 'PingCastle',
    originalId: 'P-065',
    title: 'LDAP signing not enabled',
    severity: 'MEDIUM',
    description: 'LDAP traffic can be intercepted for credential harvesting',
    complianceTags: ['NIST:PROTECT', 'CIS:IG1', 'MITRE:T1040'],
    affectedAssets: ['All domain controllers', '2 DCs affected'],
    remediation: { status: 'OPEN', effort: 'MEDIUM' }
  },
  {
    id: 'MOCK-008',
    source: 'BloodHound',
    originalId: 'BH-CUSTOM-04',
    title: 'Constrained Delegation Chain Found',
    severity: 'HIGH',
    description: 'Improperly configured delegation allows service impersonation',
    complianceTags: ['NIST:DETECT', 'CIS:IG2', 'MITRE:T1558'],
    affectedAssets: ['SVC_WEBAPP01', 'SVC_MSSQL'],
    remediation: { status: 'OPEN', effort: 'HIGH' }
  },
];

export const UnifiedDataProvider = ({ children }) => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load POC mock data on mount
  useEffect(() => {
    setLoading(true);
    // Simulate async load with small delay
    setTimeout(() => {
      const enriched = enrichFindingsWithContext(MOCK_FINDINGS);
      setFindings(enriched);
      setLoading(false);
    }, 200);
  }, []);

  // 1. Ingestion de données (PingCastle XML ou BHE API)
  const ingestData = async (sourceType, rawData) => {
    setLoading(true);
    let newFindings = [];

    try {
      if (sourceType === 'PingCastle') {
        // Appelle ton service de normalisation
        newFindings = normalizePingCastleFindings(rawData);
      } else if (sourceType === 'BloodHound') {
        // newFindings = normalizeBloodHoundFindings(rawData);
        // Mock pour le test si tu n'as pas l'API BHE branchée
        newFindings = rawData; 
      }

      // 2. Fusion et Enrichissement (L'IA de priorisation)
      setFindings(prev => {
        const merged = [...prev, ...newFindings];
        // On re-calcule les priorités (ex: Si BH confirme PC)
        return enrichFindingsWithContext(merged);
      });
      
    } catch (error) {
      console.error("Erreur d'ingestion:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Mise à jour manuelle (Pierre de Rosette)
  const updateFindingMapping = (findingId, newTags) => {
    setFindings(prev => prev.map(f => 
      f.id === findingId ? { ...f, complianceTags: newTags } : f
    ));
  };

  return (
    <UnifiedDataContext.Provider value={{ 
      findings, 
      ingestData, 
      updateFindingMapping,
      loading 
    }}>
      {children}
    </UnifiedDataContext.Provider>
  );
};
import { useState, useEffect } from 'react';
import { INITIAL_REMEDIATION_PLAN } from '../utils/constants';

export const useAppState = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [complianceScore, setComplianceScore] = useState(68);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [remediationValidated, setRemediationValidated] = useState(false);
  const [remediationPlan, setRemediationPlan] = useState(INITIAL_REMEDIATION_PLAN);
  const [remediationViewMode, setRemediationViewMode] = useState('list');

  useEffect(() => {
    if (adaptiveMode) {
      const interval = setInterval(() => {
        setComplianceScore(prev => prev < 82 ? prev + 0.1 : 82);
      }, 100);
      return () => {
        clearInterval(interval);
        setComplianceScore(68);
      };
    }
  }, [adaptiveMode]);

  return {
    activeView,
    setActiveView,
    adaptiveMode,
    setAdaptiveMode,
    complianceScore,
    setComplianceScore,
    selectedRisk,
    setSelectedRisk,
    remediationValidated,
    setRemediationValidated,
    remediationPlan,
    setRemediationPlan,
    remediationViewMode,
    setRemediationViewMode,
  };
};

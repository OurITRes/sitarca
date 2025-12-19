export const useRemediationActions = (remediationPlan, setRemediationPlan) => {
  const updateRemediationItem = (id, field, value) => {
    setRemediationPlan(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  return {
    updateRemediationItem,
  };
};

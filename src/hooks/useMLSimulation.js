import { useState } from 'react';

export const useMLSimulation = () => {
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = (setAdaptiveMode) => {
    setIsSimulating(true);
    setTimeout(() => {
      setAdaptiveMode(true);
      setIsSimulating(false);
    }, 1500);
  };

  return {
    isSimulating,
    runSimulation,
  };
};

import { useState } from 'react';

export const useMLSimulation = (setAdaptiveMode) => {
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = () => {
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

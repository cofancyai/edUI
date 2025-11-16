import { useState, useEffect } from 'react';

export const useApiAvailability = () => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setIsAvailable(true);
  }, []);

  return { isAvailable, isChecking };
};

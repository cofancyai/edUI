import { useState } from 'react';

export const useMockTest = () => {
  const [mockTests, setMockTests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMockTests = async () => {
    setIsLoading(true);
    // Mock data
    setMockTests([]);
    setIsLoading(false);
  };

  return { mockTests, isLoading, fetchMockTests };
};

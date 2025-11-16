import { useState, useEffect } from 'react';

interface ApiStatus {
  isAvailable: boolean;
  service: string;
  lastChecked: Date | null;
}

interface UseApiAvailabilityReturn {
  apiStatuses: Record<string, ApiStatus>;
  isLoading: boolean;
  error: string | null;
  checkApiAvailability: (service: string) => Promise<boolean>;
  refreshAll: () => void;
}

export const useApiAvailability = (): UseApiAvailabilityReturn => {
  const [apiStatuses, setApiStatuses] = useState<Record<string, ApiStatus>>({
    openrouter: { isAvailable: true, service: 'OpenRouter', lastChecked: null },
    vapi: { isAvailable: true, service: 'VAPI', lastChecked: null },
    supabase: { isAvailable: true, service: 'Supabase', lastChecked: null }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkApiAvailability = async (service: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock API check - in production, this would make actual API calls
      await new Promise(resolve => setTimeout(resolve, 500));

      setApiStatuses(prev => ({
        ...prev,
        [service]: {
          ...prev[service],
          isAvailable: true,
          lastChecked: new Date()
        }
      }));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API check failed';
      setError(errorMessage);

      setApiStatuses(prev => ({
        ...prev,
        [service]: {
          ...prev[service],
          isAvailable: false,
          lastChecked: new Date()
        }
      }));

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAll = async () => {
    setIsLoading(true);
    const services = Object.keys(apiStatuses);

    try {
      await Promise.all(services.map(service => checkApiAvailability(service)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh API statuses');
    } finally {
      setIsLoading(false);
    }
  };

  // Check all APIs on mount
  useEffect(() => {
    refreshAll();
  }, []);

  return {
    apiStatuses,
    isLoading,
    error,
    checkApiAvailability,
    refreshAll
  };
};

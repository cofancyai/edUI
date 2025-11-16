import { useState, useCallback } from 'react';

export const useCorporateJobsApi = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobPage, setJobPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [jobsPerPage] = useState(10);

  const fetchCorporateJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setJobs([]);
      setTotalJobs(0);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to fetch corporate jobs');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchCorporateJobs();
  }, [fetchCorporateJobs]);

  return {
    jobs,
    jobsLoading,
    jobsError,
    jobPage,
    totalJobs,
    jobsPerPage,
    setJobPage,
    fetchCorporateJobs,
    handleRefresh
  };
};

import { useState, useCallback } from 'react';

export const useJobsApi = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobCategories, setJobCategories] = useState<any[]>([]);
  const [selectedJobCategory, setSelectedJobCategory] = useState<string>('all');
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobPage, setJobPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [jobsPerPage] = useState(10);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [states, setStates] = useState<string[]>([]);

  const fetchAllJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setJobs([]);
      setTotalJobs(0);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const fetchAllJobCategories = useCallback(async () => {
    try {
      setJobCategories([]);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to fetch categories');
    }
  }, []);

  const fetchAllStates = useCallback(async () => {
    try {
      setStates([]);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to fetch states');
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchAllJobs();
  }, [fetchAllJobs]);

  return {
    jobs,
    jobCategories,
    selectedJobCategory,
    jobsLoading,
    jobsError,
    jobPage,
    totalJobs,
    jobsPerPage,
    selectedState,
    states,
    setSelectedJobCategory,
    setSelectedState,
    setJobPage,
    fetchAllJobs,
    fetchAllJobCategories,
    fetchAllStates,
    handleRefresh
  };
};

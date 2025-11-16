import { useState, useCallback } from 'react';

export const useBookmarkedJobs = (studentPhone: string | null) => {
  const [bookmarkedJobs, setBookmarkedJobs] = useState<any[]>([]);
  const [bookmarkedLoading, setBookmarkedLoading] = useState(false);
  const [bookmarkedError, setBookmarkedError] = useState<string | null>(null);

  const fetchBookmarkedJobs = useCallback(async () => {
    if (!studentPhone) return;

    setBookmarkedLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setBookmarkedJobs([]);
    } catch (err) {
      setBookmarkedError(err instanceof Error ? err.message : 'Failed to fetch bookmarked jobs');
    } finally {
      setBookmarkedLoading(false);
    }
  }, [studentPhone]);

  const toggleBookmark = useCallback(async (jobId: string, jobType: string) => {
    if (!studentPhone) return;

    try {
      // Mock bookmark toggle
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      setBookmarkedError(err instanceof Error ? err.message : 'Failed to toggle bookmark');
    }
  }, [studentPhone]);

  const isBookmarked = useCallback((jobId: string) => {
    return bookmarkedJobs.some(job => job.id === jobId);
  }, [bookmarkedJobs]);

  return {
    bookmarkedJobs,
    bookmarkedLoading,
    bookmarkedError,
    fetchBookmarkedJobs,
    toggleBookmark,
    isBookmarked
  };
};

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRecommendedJobs } from '../../../hooks/useRecommendedJobs';
import { useBookmarkedJobs } from '../../../hooks/useBookmarkedJobs';
import { JobWithBookmarkStatus } from '../../../types/job.types';
import JobTable from './JobTable';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingIndicator from '../shared/LoadingIndicator';

interface RecommendedJobsProps {
  studentPhone: string | null;
}

const RecommendedJobs: React.FC<RecommendedJobsProps> = ({ studentPhone }) => {
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Get recommended jobs based on student profile
  const {
    recommendedJobs,
    recommendationsLoading,
    recommendationsError,
    refreshRecommendations
  } = useRecommendedJobs(studentPhone);

  // Get bookmark functionality
  const {
    toggleBookmark,
    isBookmarked,
    bookmarksLoading
  } = useBookmarkedJobs(studentPhone);

  // Add bookmark status and days left to each job
  const [jobsWithStatus, setJobsWithStatus] = useState<JobWithBookmarkStatus[]>([]);

  // Calculate days left and add bookmark status to jobs
  useEffect(() => {
    if (recommendedJobs.length > 0) {
      const today = new Date();
      const enhanced = recommendedJobs.map(job => {
        // Calculate days left until deadline
        const deadlineDate = new Date(job.last_date);
        const timeDiff = deadlineDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        // Determine deadline status
        let deadlineStatus: 'expired' | 'urgent' | 'approaching' | 'open' = 'open';
        if (daysLeft < 0) deadlineStatus = 'expired';
        else if (daysLeft <= 3) deadlineStatus = 'urgent';
        else if (daysLeft <= 7) deadlineStatus = 'approaching';
        
        return {
          ...job,
          is_bookmarked: isBookmarked(job.id),
          days_left: daysLeft,
          deadline_status: deadlineStatus
        };
      });
      
      setJobsWithStatus(enhanced);
    } else {
      setJobsWithStatus([]);
    }
  }, [recommendedJobs, isBookmarked]);

  // Handle toggling a bookmark
  const handleToggleBookmark = async (jobId: string) => {
    const success = await toggleBookmark(jobId);
    if (success) {
      // Update the bookmark status in the local state
      setJobsWithStatus(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, is_bookmarked: !job.is_bookmarked } 
            : job
        )
      );
    }
  };

  // Handle page navigation
  const handlePreviousPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(recommendedJobs.length / itemsPerPage);
    setPage(prev => Math.min(totalPages, prev + 1));
  };

  // Calculate pagination
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedJobs = jobsWithStatus.slice(startIndex, endIndex);
  const totalJobs = recommendedJobs.length;

  // Loading state
  if (recommendationsLoading || bookmarksLoading) {
    return <LoadingIndicator message="Loading recommended jobs..." subMessage="We're finding the best matches for you" />;
  }

  // Error state
  if (recommendationsError) {
    return <ErrorMessage message={recommendationsError} onRetry={refreshRecommendations} />;
  }

  // No student profile
  if (!studentPhone) {
    return (
      <div style={{ background: '#FFFFFF', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <p style={{ color: '#2E1A47', fontSize: '1.1rem' }}>Please log in to see job recommendations based on your profile.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ color: '#FFF8DC', fontSize: '1.25rem', fontWeight: '600' }}>Recommended Jobs</h3>
        <p style={{ color: '#e5e7eb', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          These jobs are recommended based on your profile and preferences.
        </p>
      </div>
      
      <JobTable
        type="recommended"
        jobsWithStatus={paginatedJobs}
        isLoading={recommendationsLoading || bookmarksLoading}
        jobPage={page}
        totalJobs={totalJobs}
        jobsPerPage={itemsPerPage}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        onToggleBookmark={handleToggleBookmark}
      />
    </div>
  );
};

export default RecommendedJobs;
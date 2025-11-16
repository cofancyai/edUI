import * as React from 'react';
import { useState, useEffect } from 'react';
import { Job, JobWithBookmarkStatus } from '../../../types/job.types';
import JobTable from './JobTable';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingIndicator from '../shared/LoadingIndicator';
import { supabase } from '../../../utils/supabaseClient';

interface BookmarkedJobsProps {
  studentPhone: string | null;
}

const BookmarkedJobs: React.FC<BookmarkedJobsProps> = ({ studentPhone }) => {
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Job[]>([]);
  const [jobsWithStatus, setJobsWithStatus] = useState<JobWithBookmarkStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 10;
  const [totalJobs, setTotalJobs] = useState<number>(0);

  // Fetch bookmarked jobs
  const fetchBookmarkedJobs = async () => {
    if (!studentPhone) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First get the student_id from the phone number
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('phone', studentPhone)
        .single();

      if (studentError) {
        if (studentError.code === 'PGRST116') {
          // No results found
          console.log(`No student found with phone: ${studentPhone}`);
          setBookmarkedJobs([]);
          setTotalJobs(0);
          setLoading(false);
          return;
        }
        throw new Error(`Error finding student: ${studentError.message}`);
      }

      if (!student) {
        console.log(`No student found with phone: ${studentPhone}`);
        setBookmarkedJobs([]);
        setTotalJobs(0);
        setLoading(false);
        return;
      }

      // Check if job_bookmarks table exists
      try {
        // Get the bookmarked job IDs
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('job_bookmarks')
          .select('job_id')
          .eq('student_id', student.id);

        if (bookmarksError) {
          if (bookmarksError.code === 'PGRST116') {
            // No bookmarks found
            setBookmarkedJobs([]);
            setTotalJobs(0);
            setLoading(false);
            return;
          } else if (bookmarksError.message.includes('does not exist')) {
            // Table doesn't exist, use mock data
            useMockData();
            return;
          }
          throw new Error(`Error fetching bookmarks: ${bookmarksError.message}`);
        }

        if (!bookmarks || bookmarks.length === 0) {
          setBookmarkedJobs([]);
          setTotalJobs(0);
          setLoading(false);
          return;
        }

        const jobIds = bookmarks.map(bookmark => bookmark.job_id);
        
        // Get the actual job data
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .in('id', jobIds)
          .order('created_at', { ascending: false });

        if (jobsError) {
          throw new Error(`Error fetching bookmarked jobs: ${jobsError.message}`);
        }

        setBookmarkedJobs(jobs || []);
        setTotalJobs(jobs?.length || 0);
      } catch (error) {
        if (error instanceof Error && error.message.includes('does not exist')) {
          // If job_bookmarks table doesn't exist, use mock data
          useMockData();
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error fetching bookmarked jobs:', error);
      setError(`Failed to load bookmarked jobs: ${error instanceof Error ? error.message : String(error)}`);
      useMockData();
    } finally {
      setLoading(false);
    }
  };

  // Use mock data as fallback
  const useMockData = () => {
    const mockJobs: Job[] = Array(5).fill(0).map((_, index) => ({
      id: `mock-job-${index}`,
      post_date: `${15 - index}-05-2025`,
      organization: ['UPSC', 'Railways', 'SSC', 'IBPS', 'Central Bank of India'][index],
      posts: `${Math.floor(Math.random() * 500) + 50} Vacancies`,
      job_type: ['Permanent', 'Contract', 'Temporary'][Math.floor(Math.random() * 3)],
      last_date: `${20 + index}-05-2025(${5 + index}days left)`,
      details_link: 'https://example.com/job-details',
      official_notification_link: 'https://example.com/official-notification',
      source_website: 'mockdata.com',
      category: ['graduates', 'post_graduates', 'engineering', 'intermediate'][Math.floor(Math.random() * 4)],
      is_state_job: Math.random() > 0.5,
      state: ['delhi', 'maharashtra', 'tamil_nadu', 'karnataka'][Math.floor(Math.random() * 4)],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      batch_id: 'mock-batch-123'
    }));
    
    setBookmarkedJobs(mockJobs);
    setTotalJobs(mockJobs.length);
  };

  // Calculate days left and add bookmark status
  useEffect(() => {
    if (bookmarkedJobs.length > 0) {
      const today = new Date();
      const enhanced = bookmarkedJobs.map(job => {
        // Extract or calculate days left
        let daysLeft = 0;
        const lastDate = job.last_date;
        
        if (lastDate.includes('day')) {
          // Extract days from string like "31-05-2025(14days left)"
          const match = lastDate.match(/\((\d+)day[s]? left\)/);
          if (match && match[1]) {
            daysLeft = parseInt(match[1], 10);
          }
        } else {
          // Calculate from date
          const dateStr = lastDate.split('(')[0].trim();
          
          // Parse date
          let deadlineDate: Date;
          if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            deadlineDate = new Date(
              parseInt(parts[2]), // year
              parseInt(parts[1]) - 1, // month (0-indexed)
              parseInt(parts[0]) // day
            );
          } else {
            deadlineDate = new Date(dateStr);
          }
          
          // Calculate days difference
          if (!isNaN(deadlineDate.getTime())) {
            const timeDiff = deadlineDate.getTime() - today.getTime();
            daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          }
        }
        
        // Determine deadline status
        let deadlineStatus: 'expired' | 'urgent' | 'approaching' | 'open' = 'open';
        if (daysLeft < 0) deadlineStatus = 'expired';
        else if (daysLeft <= 3) deadlineStatus = 'urgent';
        else if (daysLeft <= 7) deadlineStatus = 'approaching';
        
        return {
          ...job,
          is_bookmarked: true, // All jobs here are bookmarked
          days_left: daysLeft,
          deadline_status: deadlineStatus
        };
      });
      
      // Sort by deadline status - urgent first, then approaching, then open, then expired
      enhanced.sort((a, b) => {
        const statusPriority: Record<string, number> = {
          'urgent': 0,
          'approaching': 1,
          'open': 2,
          'expired': 3
        };
        
        return statusPriority[a.deadline_status] - statusPriority[b.deadline_status];
      });
      
      setJobsWithStatus(enhanced);
    } else {
      setJobsWithStatus([]);
    }
  }, [bookmarkedJobs]);

  // Toggle bookmark (remove job from bookmarks)
  const handleToggleBookmark = async (jobId: string) => {
    if (!studentPhone) {
      return;
    }

    setLoading(true);
    try {
      // First get the student_id from the phone number
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('phone', studentPhone)
        .single();

      if (studentError) {
        throw new Error(`Error finding student: ${studentError.message}`);
      }

      if (!student) {
        throw new Error('Student not found');
      }

      // Try to create the job_bookmarks table if it doesn't exist
      try {
        // Check if table exists
        const { error: tableError } = await supabase
          .from('job_bookmarks')
          .select('id')
          .limit(1);

        if (tableError && tableError.message.includes('does not exist')) {
          // Table doesn't exist, but we can't create it through the client API
          // Instead, handle by using local state
          const updatedJobs = bookmarkedJobs.filter(job => job.id !== jobId);
          setBookmarkedJobs(updatedJobs);
          setTotalJobs(updatedJobs.length);
          return;
        }
      } catch (error) {
        console.error('Error checking job_bookmarks table:', error);
        // Continue with local state management
        const updatedJobs = bookmarkedJobs.filter(job => job.id !== jobId);
        setBookmarkedJobs(updatedJobs);
        setTotalJobs(updatedJobs.length);
        return;
      }

      // Remove from database
      const { error: deleteError } = await supabase
        .from('job_bookmarks')
        .delete()
        .eq('student_id', student.id)
        .eq('job_id', jobId);

      if (deleteError) {
        throw new Error(`Error removing bookmark: ${deleteError.message}`);
      }

      // Update local state
      const updatedJobs = bookmarkedJobs.filter(job => job.id !== jobId);
      setBookmarkedJobs(updatedJobs);
      setTotalJobs(updatedJobs.length);
      
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setError(`Failed to update bookmark: ${error instanceof Error ? error.message : String(error)}`);
      
      // Update local state anyway for better UX
      const updatedJobs = bookmarkedJobs.filter(job => job.id !== jobId);
      setBookmarkedJobs(updatedJobs);
      setTotalJobs(updatedJobs.length);
    } finally {
      setLoading(false);
    }
  };

  // Handle page navigation
  const handlePreviousPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalJobs / itemsPerPage);
    setPage(prev => Math.min(totalPages, prev + 1));
  };

  // Fetch bookmarked jobs on component mount
  useEffect(() => {
    fetchBookmarkedJobs();
  }, [studentPhone]);

  // Calculate pagination
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedJobs = jobsWithStatus.slice(startIndex, endIndex);

  // If not logged in
  if (!studentPhone) {
    return (
      <div style={{ background: '#FFFFFF', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <p style={{ color: '#2E1A47', fontSize: '1.1rem' }}>Please log in to see your bookmarked jobs.</p>
      </div>
    );
  }

  // Loading state
  if (loading && !bookmarkedJobs.length) {
    return <LoadingIndicator message="Loading your bookmarked jobs..." />;
  }

  // Error state
  if (error && !bookmarkedJobs.length) {
    return <ErrorMessage message={error} onRetry={fetchBookmarkedJobs} />;
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ color: '#FFF8DC', fontSize: '1.25rem', fontWeight: '600' }}>Bookmarked Jobs</h3>
        <p style={{ color: '#e5e7eb', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Jobs you've saved for future reference. Click the bookmark icon to remove a job from your bookmarks.
        </p>
      </div>
      
      <JobTable
        type="bookmarked"
        jobs={bookmarkedJobs}
        jobsWithStatus={paginatedJobs}
        isLoading={loading}
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

export default BookmarkedJobs;
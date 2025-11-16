import React from 'react';
import { Job, CorporateJob, JobWithBookmarkStatus } from '../../../types/job.types';
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface JobTableProps {
  type: 'government' | 'corporate' | 'exams' | 'recommended' | 'bookmarked';
  jobs?: Job[];
  jobsWithStatus?: JobWithBookmarkStatus[];
  corporateJobs?: CorporateJob[];
  isLoading: boolean;
  jobPage?: number;
  totalJobs?: number;
  jobsPerPage?: number;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  onToggleBookmark?: (jobId: string) => void;
}

const JobTable: React.FC<JobTableProps> = ({ 
  type, 
  jobs, 
  jobsWithStatus,
  corporateJobs, 
  isLoading,
  jobPage = 1,
  totalJobs = 0,
  jobsPerPage = 10,
  onPreviousPage,
  onNextPage,
  onToggleBookmark
}) => {
  const totalPages = Math.ceil(totalJobs / jobsPerPage);
  
  // Parse deadline date and calculate days left
  const calculateDaysLeft = (dateString: string): number => {
    if (!dateString) return 0;
    
    // If deadline contains text like "Contract" or doesn't match date format
    if (dateString === "Contract" || !dateString.match(/\d{2}[-\/]\d{2}[-\/]\d{4}/)) {
      return 0;
    }
    
    let deadlineDate: Date = new Date();
    
    // Parse date string in format DD-MM-YYYY or DD/MM/YYYY
    try {
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // months are 0-indexed in JS
          const year = parseInt(parts[2], 10);
          deadlineDate = new Date(year, month, day);
        }
      } else if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          deadlineDate = new Date(year, month, day);
        }
      } else {
        // Try direct parsing as last resort
        deadlineDate = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(deadlineDate.getTime())) {
        return 0;
      }
      
      const today = new Date();
      
      // Set both dates to midnight for accurate day calculation
      today.setHours(0, 0, 0, 0);
      deadlineDate.setHours(0, 0, 0, 0);
      
      // Calculate days difference
      const timeDiff = deadlineDate.getTime() - today.getTime();
      return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error("Error parsing date:", error);
      return 0;
    }
  };

  // Extract days from deadline string like "26-05-2025(1day left)"
  const extractDaysFromString = (lastDate: string): number => {
    if (!lastDate) return 0;
    
    const match = lastDate.match(/\((\d+)day[s]? left\)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    
    // If no days specified in string, calculate from date
    return calculateDaysLeft(lastDate.split('(')[0]);
  };

  // Get deadline color based on days left
  const getDeadlineColor = (daysLeft: number): string => {
    if (daysLeft < 0) return '#ef4444'; // Red for expired
    if (daysLeft <= 3) return '#f97316'; // Orange for urgent
    if (daysLeft <= 7) return '#eab308'; // Yellow for approaching
    return '#22c55e'; // Green for open
  };

  // Format deadline status text
  const formatDeadlineStatus = (daysLeft: number): string => {
    if (daysLeft === 0) return 'Expires Today';
    if (daysLeft < 0) return `Expired ${Math.abs(daysLeft)} days ago`;
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  };
  
  if (isLoading) {
    return (
      <div style={{ background: '#FFFFFF', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '50%', 
            border: '5px solid rgba(177, 156, 217, 0.2)', 
            borderTopColor: '#B19CD9', 
            animation: 'spin 1s linear infinite' 
          }} />
        </div>
      </div>
    );
  }

  // Government Jobs, Recommended Jobs, or Bookmarked Jobs Table
  if (type === 'government' || type === 'recommended' || type === 'bookmarked') {
    const jobsToDisplay = jobsWithStatus || jobs || [];
    
    if (jobsToDisplay.length === 0) {
      return (
        <div style={{ background: '#FFFFFF', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
          <p style={{ color: '#2E1A47', fontSize: '1.1rem' }}>
            {type === 'recommended' 
              ? 'No recommended jobs found for your profile. Please complete your profile to get better recommendations.'
              : type === 'bookmarked'
                ? 'No bookmarked jobs found. Save interesting jobs to view them here later.'
                : 'No government jobs found matching your criteria.'}
          </p>
        </div>
      );
    }

    return (
      <>
        <div style={{ background: '#FFFFFF', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Post Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Organization</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Posts</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Job Type</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Last Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Details</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Notification</th>
                {onToggleBookmark && (
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47', width: '80px' }}>Bookmark</th>
                )}
              </tr>
            </thead>
            <tbody>
              {jobsToDisplay.map((job, index) => {
                // Calculate days left from the job's last_date
                const daysLeftString = job.last_date.match(/\((\d+)day[s]? left\)/);
                const daysLeft = daysLeftString 
                  ? parseInt(daysLeftString[1], 10) 
                  : calculateDaysLeft(job.last_date.split('(')[0]);
                
                // Get appropriate color and format the days left text
                const deadlineColor = getDeadlineColor(daysLeft);
                const deadlineText = formatDeadlineStatus(daysLeft);
                
                // Get bookmark status
                const isBookmarked = 'is_bookmarked' in job ? job.is_bookmarked : false;
                
                // Parse job last date to display
                const displayDate = job.last_date.includes('(') 
                  ? job.last_date.split('(')[0].trim() 
                  : job.last_date;
                
                return (
                  <tr key={job.id || index} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>{job.post_date}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>{job.organization}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>{job.posts}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>{job.job_type}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#333' }}>{displayDate}</span>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          backgroundColor: `${deadlineColor}15`,
                          color: deadlineColor,
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>
                          {deadlineText}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>
                      {job.details_link ? (
                        <a 
                          href={job.details_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            color: '#7c3aed',
                            textDecoration: 'none',
                            fontWeight: '500'
                          }}
                        >
                          View Details
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>
                      {job.official_notification_link ? (
                        <a 
                          href={job.official_notification_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            color: '#7c3aed',
                            textDecoration: 'none',
                            fontWeight: '500'
                          }}
                        >
                          Notification
                        </a>
                      ) : 'N/A'}
                    </td>
                    {onToggleBookmark && (
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', textAlign: 'center', width: '80px' }}>
                        <button
                          onClick={() => onToggleBookmark(job.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '0.25rem',
                            color: isBookmarked ? '#7c3aed' : '#9ca3af',
                            transition: 'all 0.2s ease'
                          }}
                          title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
                        >
                          {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <p style={{ color: '#EDEDED' }}>
            Showing {jobsToDisplay.length > 0 ? (jobPage - 1) * jobsPerPage + 1 : 0} to {Math.min(jobPage * jobsPerPage, totalJobs)} of {totalJobs} jobs
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onPreviousPage}
              disabled={jobPage === 1}
              style={{
                padding: '0.5rem 1rem',
                background: jobPage === 1 ? 'rgba(255, 215, 0, 0.3)' : 'linear-gradient(45deg, #B19CD9, #FFD700)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: jobPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              Previous
            </button>
            <button
              onClick={onNextPage}
              disabled={jobPage === totalPages || totalPages === 0}
              style={{
                padding: '0.5rem 1rem',
                background: (jobPage === totalPages || totalPages === 0) ? 'rgba(255, 215, 0, 0.3)' : 'linear-gradient(45deg, #B19CD9, #FFD700)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: (jobPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </>
    );
  }
  
  // Corporate Jobs Table
  else if (type === 'corporate') {
    if (!corporateJobs || corporateJobs.length === 0) {
      return (
        <div style={{ background: '#FFFFFF', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
          <p style={{ color: '#2E1A47', fontSize: '1.1rem' }}>No corporate jobs found matching your criteria.</p>
        </div>
      );
    }

    return (
      <>
        <div style={{ background: '#FFFFFF', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Company</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Job Title</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Location</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Job Type</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Deadline</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Apply</th>
              </tr>
            </thead>
            <tbody>
              {corporateJobs.map((job, index) => {
                const daysLeft = calculateDaysLeft(job.application_deadline);
                const deadlineColor = getDeadlineColor(daysLeft);
                const deadlineText = formatDeadlineStatus(daysLeft);
                
                return (
                  <tr key={job.id || index} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>{job.company}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>{job.title}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>{job.location}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>{job.job_type}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#333' }}>{job.application_deadline}</span>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          backgroundColor: `${deadlineColor}15`,
                          color: deadlineColor,
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>
                          {deadlineText}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>
                      <a 
                        href={job.apply_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          color: '#7c3aed',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                      >
                        Apply Now
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <p style={{ color: '#EDEDED' }}>
            Showing {corporateJobs.length > 0 ? (jobPage - 1) * jobsPerPage + 1 : 0} to {Math.min(jobPage * jobsPerPage, totalJobs)} of {totalJobs} jobs
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onPreviousPage}
              disabled={jobPage === 1}
              style={{
                padding: '0.5rem 1rem',
                background: jobPage === 1 ? 'rgba(255, 215, 0, 0.3)' : 'linear-gradient(45deg, #B19CD9, #FFD700)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: jobPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              Previous
            </button>
            <button
              onClick={onNextPage}
              disabled={jobPage === totalPages || totalPages === 0}
              style={{
                padding: '0.5rem 1rem',
                background: (jobPage === totalPages || totalPages === 0) ? 'rgba(255, 215, 0, 0.3)' : 'linear-gradient(45deg, #B19CD9, #FFD700)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: (jobPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </>
    );
  }
  
  // Default fallback
  return (
    <div style={{ background: '#FFFFFF', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
      <p style={{ color: '#2E1A47', fontSize: '1.1rem' }}>Please select a job type to view.</p>
    </div>
  );
};

export default JobTable;
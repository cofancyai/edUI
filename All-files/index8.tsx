import * as React from 'react';
import { useState, useEffect } from 'react';
import JobTable from './JobTable';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingIndicator from '../shared/LoadingIndicator';
import BookmarkedJobs from './BookmarkedJobs';
import { useJobsApi } from '../../../hooks/useJobsApi';
import { useBookmarkedJobs } from '../../../hooks/useBookmarkedJobs';
import { useCorporateJobsApi } from '../../../hooks/useCorporateJobsApi';
import { useExamsApi } from '../../../hooks/useExamsApi';
import { getApiConfig } from '../../../services/apiService';
import { supabase } from '../../../utils/supabaseClient';

// Tab types
type TabType = 'government' | 'corporate' | 'exams' | 'bookmarked';

const ExamAlert: React.FC = () => {
  // Get student phone for tracking bookmarks
  const studentPhone = localStorage.getItem('studentPhone');
  
  // State for API configuration
  const [apiConfig, setApiConfig] = useState<any>(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<TabType>('government');

  // Government Jobs API
  const {
    jobs: governmentJobs,
    jobCategories,
    selectedJobCategory,
    jobsLoading: governmentJobsLoading,
    jobsError: governmentJobsError,
    jobPage: governmentJobPage,
    totalJobs: totalGovernmentJobs,
    jobsPerPage,
    selectedState,
    states,
    setSelectedJobCategory,
    setSelectedState,
    setJobPage: setGovernmentJobPage,
    fetchAllJobs: fetchAllGovernmentJobs,
    fetchAllJobCategories,
    fetchAllStates,
    handleRefresh: handleGovernmentJobsRefresh
  } = useJobsApi();

  // Corporate Jobs API
  const {
    jobs: corporateJobs,
    companies,
    locations,
    selectedCompany,
    selectedLocation,
    corporateJobsLoading,
    corporateJobsError,
    corporateJobPage,
    totalCorporateJobs,
    corporateJobsPerPage,
    setSelectedCompany,
    setSelectedLocation,
    setCorporateJobPage,
    fetchAllCorporateJobs,
    fetchAllCompanies,
    fetchAllLocations,
    handleRefresh: handleCorporateJobsRefresh
  } = useCorporateJobsApi();

  // Exams API
  const {
    exams,
    statuses,
    selectedStatus,
    examsLoading,
    examsError,
    examsPage,
    totalExams,
    examsPerPage,
    setSelectedStatus,
    setExamsPage,
    fetchAllExams,
    fetchAllStatuses,
    handleRefresh: handleExamsRefresh
  } = useExamsApi();

  // Bookmarks functionality
  const { 
    toggleBookmark,
    isBookmarked,
    bookmarksLoading
  } = useBookmarkedJobs(studentPhone);

  // Initialize API configuration
  useEffect(() => {
    const initializeApiConfig = async () => {
      try {
        const config = await getApiConfig();
        setApiConfig(config);
        console.log("API configuration loaded successfully");
      } catch (error) {
        console.error("Failed to load API configuration:", error);
      }
    };
    
    initializeApiConfig();
  }, []);

  // Set default tab to government on load
  useEffect(() => {
    setActiveTab('government');
  }, []);

  // Load initial data for the active tab
  useEffect(() => {
    if (activeTab === 'government') {
      fetchAllJobCategories();
      fetchAllStates();
      fetchAllGovernmentJobs();
    } else if (activeTab === 'corporate') {
      fetchAllCompanies();
      fetchAllLocations();
      fetchAllCorporateJobs();
    } else if (activeTab === 'exams') {
      fetchAllStatuses();
      fetchAllExams();
    }
    // For bookmarked tab, data is loaded in its component
  }, [activeTab]);

  // Handle toggling a bookmark for government jobs
  const handleToggleBookmark = async (jobId: string) => {
    await toggleBookmark(jobId);
  };

  // Tab style functions
  const getTabStyle = (tab: TabType) => {
    const baseStyle = {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem 0.5rem 0 0',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.2s ease',
    };

    if (activeTab === tab) {
      return {
        ...baseStyle,
        background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
        color: '#2E1A47',
        border: '1px solid #FFD700',
        borderBottom: 'none',
      };
    } else {
      return {
        ...baseStyle,
        background: 'rgba(255, 215, 0, 0.1)',
        color: '#EDEDED',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderBottom: 'none',
      };
    }
  };

  // Render government jobs tab content
  const renderGovernmentJobs = () => {
    // If API config isn't loaded yet, show loading
    if (!apiConfig) {
      return <LoadingIndicator message="Loading API configuration..." />;
    }
    
    // Debug logging
    console.log("Categories for dropdown:", jobCategories);
    console.log("States for dropdown:", states);
    console.log("Selected Category:", selectedJobCategory);
    console.log("Selected State:", selectedState);

    if (governmentJobsLoading && !governmentJobs.length) {
      return <LoadingIndicator message="Loading government job listings..." subMessage="This may take a few moments" />;
    }

    if (governmentJobsError && !governmentJobs.length) {
      return <ErrorMessage message={governmentJobsError} onRetry={fetchAllGovernmentJobs} />;
    }

    const totalGovernmentPages = Math.ceil(totalGovernmentJobs / jobsPerPage);

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: '#FFF8DC' }}>
  Government Job Listings
  <span style={{ 
    fontSize: '0.8rem', 
    color: '#B19CD9', 
    marginLeft: '1rem',
    fontWeight: 'normal' 
  }}>
    (Updated daily at 12 AM)
  </span>
</h3>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* Category Dropdown */}
            <select 
              id="categorySelect"
              value={selectedJobCategory}
              onChange={(e) => {
                setSelectedJobCategory(e.target.value);
                console.log("Selected category:", e.target.value);
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#1e293b',
                color: '#EDEDED',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              {jobCategories.map(category => (
                <option key={category.name} value={category.name}>
                  {category.display_name || category.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  {category.count ? ` (${category.count})` : ''}
                </option>
              ))}
            </select>

            {/* State Dropdown */}
            <select
              id="stateSelect"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                console.log("Selected state:", e.target.value);
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#1e293b',
                color: '#EDEDED',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All States</option>
              {states.map(state => (
                <option key={state} value={state}>
                  {state.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => {
                // Reset page to 1 when refreshing
                setGovernmentJobPage(1);
                // Fetch all jobs again with current filters
                fetchAllGovernmentJobs();
              }}
              disabled={governmentJobsLoading}
              style={{
                padding: '0.5rem 1rem',
                background: governmentJobsLoading ? 'rgba(255, 215, 0, 0.3)' : 'linear-gradient(45deg, #B19CD9, #FFD700)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: governmentJobsLoading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              {governmentJobsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        <JobTable 
          type="government"
          jobs={governmentJobs}
          isLoading={governmentJobsLoading}
          jobPage={governmentJobPage}
          totalJobs={totalGovernmentJobs}
          jobsPerPage={jobsPerPage}
          onPreviousPage={() => setGovernmentJobPage(prev => Math.max(1, prev - 1))}
          onNextPage={() => setGovernmentJobPage(prev => Math.min(totalGovernmentPages, prev + 1))}
          onToggleBookmark={handleToggleBookmark}
        />
      </>
    );
  };

  // Render corporate jobs tab content
  const renderCorporateJobs = () => {
    // If API config isn't loaded yet, show loading
    if (!apiConfig) {
      return <LoadingIndicator message="Loading API configuration..." />;
    }
    
    // Debug logging
    console.log("Companies:", companies);
    console.log("Selected Company:", selectedCompany);
    console.log("Locations:", locations);
    console.log("Selected Location:", selectedLocation);

    if (corporateJobsLoading && !corporateJobs.length) {
      return <LoadingIndicator message="Loading corporate job listings..." subMessage="This may take a few moments" />;
    }

    if (corporateJobsError && !corporateJobs.length) {
      return <ErrorMessage message={corporateJobsError} onRetry={fetchAllCorporateJobs} />;
    }

    const totalCorporatePages = Math.ceil(totalCorporateJobs / corporateJobsPerPage);

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: '#FFF8DC' }}>
            Corporate Job Listings
            {selectedCompany !== 'all' && ` - ${companies.find(c => c.code === selectedCompany)?.name || selectedCompany}`}
            {selectedLocation !== 'all' && ` - ${selectedLocation}`}
          </h3>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#1e293b',
                color: '#EDEDED',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
              }}
            >
              <option value="all">All Companies</option>
              {companies.map(company => (
                <option key={company.code} value={company.code}>
                  {company.name} ({company.count})
                </option>
              ))}
            </select>
            
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#1e293b',
                color: '#EDEDED',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
              }}
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location.name} value={location.name}>
                  {location.name} ({location.count})
                </option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setCorporateJobPage(1);
                fetchAllCorporateJobs();
              }}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(45deg, #B19CD9, #FFD700)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Refresh
            </button>
          </div>
        </div>
        
        <JobTable 
          type="corporate"
          corporateJobs={corporateJobs} 
          isLoading={corporateJobsLoading}
          jobPage={corporateJobPage}
          totalJobs={totalCorporateJobs}
          jobsPerPage={corporateJobsPerPage}
          onPreviousPage={() => setCorporateJobPage(prev => Math.max(1, prev - 1))}
          onNextPage={() => setCorporateJobPage(prev => Math.min(totalCorporatePages, prev + 1))}
        />
      </>
    );
  };

  // Render exams tab content
  const renderExams = () => {
    // If API config isn't loaded yet, show loading
    if (!apiConfig) {
      return <LoadingIndicator message="Loading API configuration..." />;
    }
    
    // Debug logging
    console.log("Exam Statuses:", statuses);
    console.log("Selected Status:", selectedStatus);

    if (examsLoading && !exams.length) {
      return <LoadingIndicator message="Loading higher education exam listings..." subMessage="This may take a few moments" />;
    }

    if (examsError && !exams.length) {
      return <ErrorMessage message={examsError} onRetry={fetchAllExams} />;
    }

    const totalExamPages = Math.ceil(totalExams / examsPerPage);

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: '#FFF8DC' }}>
            Higher Studies Exam Listings
            {selectedStatus !== 'all' && ` - ${selectedStatus.toUpperCase()}`}
          </h3>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#1e293b',
                color: '#EDEDED',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status.status} value={status.status}>
                  {status.status.toUpperCase()} ({status.count})
                </option>
              ))}
            </select>
            
            <button
              onClick={handleExamsRefresh}
              disabled={examsLoading}
              style={{
                padding: '0.5rem 1rem',
                background: examsLoading ? 'rgba(255, 215, 0, 0.3)' : 'linear-gradient(45deg, #B19CD9, #FFD700)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: examsLoading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              {examsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        <div style={{ background: '#FFFFFF', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Exam Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Start Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>End Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eaeaea', fontWeight: '600', color: '#2E1A47' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, index) => (
                <tr key={exam.id || index} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>{exam.exam_name}</td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>{exam.start_date || 'Not specified'}</td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea', color: '#333' }}>{exam.end_date || 'Not specified'}</td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      backgroundColor: 
                        exam.status.toUpperCase() === 'OPEN' ? 'rgba(16, 185, 129, 0.1)' : 
                        exam.status.toUpperCase() === 'UPCOMING' ? 'rgba(59, 130, 246, 0.1)' : 
                        'rgba(239, 68, 68, 0.1)',
                      color: 
                        exam.status.toUpperCase() === 'OPEN' ? '#10b981' : 
                        exam.status.toUpperCase() === 'UPCOMING' ? '#3b82f6' : 
                        '#ef4444',
                    }}>
                      {exam.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #eaeaea' }}>
                    <a 
                      href={exam.details_url} 
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <p style={{ color: '#EDEDED', margin: 0 }}>
            Showing {exams.length > 0 ? (examsPage - 1) * examsPerPage + 1 : 0} to {Math.min(examsPage * examsPerPage, totalExams)} of {totalExams} exams
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setExamsPage(prev => Math.max(1, prev - 1))}
              disabled={examsPage === 1}
              style={{
                padding: '0.5rem 1rem',
                background: examsPage === 1 ? 'rgba(255, 215, 0, 0.3)' : 'linear-gradient(45deg, #B19CD9, #FFD700)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: examsPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setExamsPage(prev => Math.min(totalExamPages, prev + 1))}
              disabled={examsPage === totalExamPages || totalExamPages === 0}
              style={{
                padding: '0.5rem 1rem',
                background: (examsPage === totalExamPages || totalExamPages === 0) ? 'rgba(255, 215, 0, 0.3)' : 'linear-gradient(45deg, #B19CD9, #FFD700)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: (examsPage === totalExamPages || totalExamPages === 0) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </>
    );
  };

  // Render bookmarked jobs tab content
  const renderBookmarkedJobs = () => {
    return <BookmarkedJobs studentPhone={studentPhone} />;
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Tab Switcher */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.25rem',
        overflowX: 'auto'
      }}>
        <div 
          onClick={() => setActiveTab('government')} 
          style={getTabStyle('government')}
        >
          Government Jobs
        </div>
        <div 
          onClick={() => setActiveTab('corporate')} 
          style={getTabStyle('corporate')}
        >
          Corporate Jobs
        </div>
        <div 
          onClick={() => setActiveTab('exams')} 
          style={getTabStyle('exams')}
        >
          Higher Studies Exam
        </div>
        <div 
          onClick={() => setActiveTab('bookmarked')} 
          style={getTabStyle('bookmarked')}
        >
          Bookmarked Jobs
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ 
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '0 0.5rem 0.5rem 0.5rem',
        padding: '1.5rem',
        minHeight: '500px'
      }}>
        {activeTab === 'government' && renderGovernmentJobs()}
        {activeTab === 'corporate' && renderCorporateJobs()}
        {activeTab === 'exams' && renderExams()}
        {activeTab === 'bookmarked' && renderBookmarkedJobs()}
      </div>
    </div>
  );
};

export default ExamAlert;
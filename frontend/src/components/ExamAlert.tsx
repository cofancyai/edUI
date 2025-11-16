import React, { useState } from 'react';
import { Briefcase, Building2, GraduationCap, Bookmark, RefreshCw, Filter, MapPin, Calendar, ExternalLink, Star, Clock, Bell } from 'lucide-react';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';

// Tab types
type TabType = 'government' | 'corporate' | 'exams' | 'bookmarked';

interface ExamAlertProps {
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

const ExamAlert: React.FC<ExamAlertProps> = ({ selectedLanguage = 'english', isAuthenticated = false }) => {
  const [activeTab, setActiveTab] = useState<TabType>('government');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in production, this would come from API
  const mockGovernmentJobs = [
    {
      id: '1',
      title: 'UPSC Civil Services Examination 2024',
      department: 'Union Public Service Commission',
      vacancies: 1000,
      lastDate: '2024-03-15',
      state: 'All India',
      category: 'Central Government',
      applyUrl: 'https://upsc.gov.in'
    },
    {
      id: '2',
      title: 'SSC CGL 2024',
      department: 'Staff Selection Commission',
      vacancies: 5000,
      lastDate: '2024-04-10',
      state: 'All India',
      category: 'Central Government',
      applyUrl: 'https://ssc.nic.in'
    },
    {
      id: '3',
      title: 'Railway Group D Recruitment',
      department: 'Railway Recruitment Board',
      vacancies: 15000,
      lastDate: '2024-02-28',
      state: 'All India',
      category: 'Railways',
      applyUrl: 'https://rrbcdg.gov.in'
    }
  ];

  const tabs = [
    { id: 'government', label: 'Government Jobs', icon: Briefcase, count: 156 },
    { id: 'corporate', label: 'Corporate Jobs', icon: Building2, count: 89 },
    { id: 'exams', label: 'Higher Studies', icon: GraduationCap, count: 42 },
    { id: 'bookmarked', label: 'Bookmarked', icon: Bookmark, count: 12 }
  ];

  const categories = ['All Categories', 'Central Government', 'State Government', 'Railways', 'Banking', 'Defense', 'Police'];
  const states = ['All States', 'All India', 'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh'];
  const companies = ['All Companies', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant'];
  const locations = ['All Locations', 'Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi NCR'];
  const statuses = ['All Statuses', 'Open', 'Upcoming', 'Closed'];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const renderJobCard = (job: any) => (
    <div
      key={job.id}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        transition: 'all 0.3s ease',
        marginBottom: '1rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 215, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            color: '#FFD700',
            fontSize: '1.2rem',
            fontWeight: '700',
            margin: '0 0 0.5rem 0',
            lineHeight: '1.4'
          }}>
            {job.title}
          </h3>
          <p style={{
            color: '#B19CD9',
            fontSize: '0.95rem',
            margin: '0 0 0.75rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Building2 size={16} />
            {job.department}
          </p>
        </div>
        <button
          style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
          }}
        >
          <Star size={18} style={{ color: '#FFD700' }} />
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '1rem',
        borderRadius: '0.5rem'
      }}>
        <div>
          <span style={{ color: '#B19CD9', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
            Vacancies
          </span>
          <span style={{ color: '#EDEDED', fontWeight: '700', fontSize: '1.1rem' }}>
            {job.vacancies.toLocaleString()}
          </span>
        </div>
        <div>
          <span style={{ color: '#B19CD9', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
            <MapPin size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Location
          </span>
          <span style={{ color: '#EDEDED', fontWeight: '600' }}>
            {job.state}
          </span>
        </div>
        <div>
          <span style={{ color: '#B19CD9', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
            <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Last Date
          </span>
          <span style={{ color: '#EF4444', fontWeight: '700' }}>
            {new Date(job.lastDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          onClick={() => window.open(job.applyUrl, '_blank')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            color: '#2E1A47',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.3)';
          }}
        >
          Apply Now <ExternalLink size={16} />
        </button>
        <span style={{
          padding: '0.5rem 1rem',
          background: 'rgba(16, 185, 129, 0.2)',
          color: '#10B981',
          borderRadius: '1rem',
          fontSize: '0.85rem',
          fontWeight: '700',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          {job.category}
        </span>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '6px solid rgba(177, 156, 217, 0.2)',
            borderLeft: '6px solid #B19CD9',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }} />
          <p style={{ color: '#B19CD9', fontSize: '1.1rem' }}>Loading job listings...</p>
        </div>
      );
    }

    if (activeTab === 'government') {
      return (
        <div>
          {mockGovernmentJobs.map(renderJobCard)}
        </div>
      );
    }

    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: '#B19CD9'
      }}>
        <Clock size={64} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
        <h3 style={{ color: '#FFD700', marginBottom: '0.5rem', fontSize: '1.3rem' }}>
          Coming Soon
        </h3>
        <p style={{ fontSize: '1rem' }}>
          {activeTab === 'corporate' && 'Corporate job listings are being updated.'}
          {activeTab === 'exams' && 'Higher studies exam information will be available soon.'}
          {activeTab === 'bookmarked' && 'Your bookmarked items will appear here.'}
        </p>
      </div>
    );
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      minHeight: '600px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <Bell size={32} style={{ color: '#FFD700' }} />
        <div>
          <h2 style={{
            color: '#FFD700',
            fontSize: '1.8rem',
            fontWeight: '700',
            margin: 0
          }}>
            Exam & Job Alerts
          </h2>
          <p style={{
            color: '#B19CD9',
            fontSize: '1rem',
            margin: 0
          }}>
            Latest government jobs, corporate openings & exam notifications
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '0.75rem',
        padding: '0.5rem',
        marginBottom: '2rem',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: '0.75rem 1.5rem',
                background: isActive
                  ? 'linear-gradient(45deg, #FFD700, #B19CD9)'
                  : 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                color: isActive ? '#2E1A47' : '#EDEDED',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                flex: '1 1 auto',
                minWidth: '140px',
                justifyContent: 'center'
              }}
            >
              <Icon size={18} />
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: isActive ? '#2E1A47' : 'rgba(255, 215, 0, 0.2)',
                  color: isActive ? '#FFD700' : '#FFD700',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  minWidth: '24px',
                  textAlign: 'center'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <Filter size={18} style={{ color: '#B19CD9' }} />
          <h3 style={{ color: '#B19CD9', margin: 0, fontSize: '1rem', fontWeight: '600' }}>
            Filter Results
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {activeTab === 'government' && (
            <>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#EDEDED',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} style={{ background: '#2E1A47' }}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#EDEDED',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {states.map(state => (
                  <option key={state} value={state} style={{ background: '#2E1A47' }}>
                    {state}
                  </option>
                ))}
              </select>
            </>
          )}

          {activeTab === 'corporate' && (
            <>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#EDEDED',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {companies.map(comp => (
                  <option key={comp} value={comp} style={{ background: '#2E1A47' }}>
                    {comp}
                  </option>
                ))}
              </select>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#EDEDED',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {locations.map(loc => (
                  <option key={loc} value={loc} style={{ background: '#2E1A47' }}>
                    {loc}
                  </option>
                ))}
              </select>
            </>
          )}

          {activeTab === 'exams' && (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#EDEDED',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {statuses.map(status => (
                <option key={status} value={status} style={{ background: '#2E1A47' }}>
                  {status}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              background: isLoading
                ? 'rgba(255, 215, 0, 0.3)'
                : 'linear-gradient(45deg, #10B981, #059669)',
              color: isLoading ? '#B19CD9' : 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: isLoading ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <RefreshCw size={18} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '0.75rem',
        border: '1px solid rgba(255, 215, 0, 0.1)',
        padding: '1.5rem',
        minHeight: '400px'
      }}>
        {renderContent()}
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ExamAlert;

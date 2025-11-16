import * as React from 'react';
import { JobCategory, Company, Location, ExamStatus } from '../../../types/job.types';
import RefreshButton from '../shared/RefreshButton';

interface JobFiltersProps {
  type: 'government' | 'corporate' | 'exams';
  
  // Government job props
  categories?: JobCategory[];
  states?: string[];
  selectedCategory?: string;
  selectedState?: string;
  setSelectedCategory?: (category: string) => void;
  setSelectedState?: (state: string) => void;
  
  // Corporate job props
  companies?: Company[];
  locations?: Location[];
  selectedCompany?: string;
  selectedLocation?: string;
  setSelectedCompany?: (company: string) => void;
  setSelectedLocation?: (location: string) => void;
  
  // Exam props
  statuses?: ExamStatus[];
  selectedStatus?: string;
  setSelectedStatus?: (status: string) => void;
  
  // Common props
  onRefresh: () => void;
  isLoading: boolean;
}

const JobFilters: React.FC<JobFiltersProps> = ({ 
  type,
  categories,
  states,
  selectedCategory,
  selectedState,
  setSelectedCategory,
  setSelectedState,
  companies,
  locations,
  selectedCompany,
  selectedLocation,
  setSelectedCompany,
  setSelectedLocation,
  statuses,
  selectedStatus,
  setSelectedStatus,
  onRefresh,
  isLoading
}) => {
  const renderGovernmentFilters = () => {
    return (
      <>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory && setSelectedCategory(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(45deg, #1a1a4e, #2E1A47)',
            color: '#EDEDED',
            border: '1px solid rgba(255, 215, 0, 0.1)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          <option value="all">All Categories</option>
          {categories && categories.map(category => (
            <option key={category.name} value={category.name}>
              {category.display_name || category.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} ({category.count})
            </option>
          ))}
        </select>
        
        <select
          value={selectedState}
          onChange={e => setSelectedState && setSelectedState(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(45deg, #1a1a4e, #2E1A47)',
            color: '#EDEDED',
            border: '1px solid rgba(255, 215, 0, 0.1)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          <option value="all">All States</option>
          {states && states.map(state => (
            <option key={state} value={state}>
              {state.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>
      </>
    );
  };

  const renderCorporateFilters = () => {
    return (
      <>
        <select
          value={selectedCompany}
          onChange={e => setSelectedCompany && setSelectedCompany(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(45deg, #1a1a4e, #2E1A47)',
            color: '#EDEDED',
            border: '1px solid rgba(255, 215, 0, 0.1)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          <option value="all">All Companies</option>
          {companies && companies.map(company => (
            <option key={company.code} value={company.code}>
              {company.name} ({company.count})
            </option>
          ))}
        </select>
        
        <select
          value={selectedLocation}
          onChange={e => setSelectedLocation && setSelectedLocation(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(45deg, #1a1a4e, #2E1A47)',
            color: '#EDEDED',
            border: '1px solid rgba(255, 215, 0, 0.1)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          <option value="all">All Locations</option>
          {locations && locations.map(location => (
            <option key={location.name} value={location.name}>
              {location.name} ({location.count})
            </option>
          ))}
        </select>
      </>
    );
  };

  const renderExamFilters = () => {
    return (
      <select
        value={selectedStatus}
        onChange={e => setSelectedStatus && setSelectedStatus(e.target.value)}
        style={{
          padding: '0.5rem 1rem',
          background: 'linear-gradient(45deg, #1a1a4e, #2E1A47)',
          color: '#EDEDED',
          border: '1px solid rgba(255, 215, 0, 0.1)',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
        }}
      >
        <option value="all">All Statuses</option>
        {statuses && statuses.map(status => (
          <option key={status.status} value={status.status}>
            {status.status.charAt(0).toUpperCase() + status.status.slice(1)} ({status.count})
          </option>
        ))}
      </select>
    );
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
      {type === 'government' && renderGovernmentFilters()}
      {type === 'corporate' && renderCorporateFilters()}
      {type === 'exams' && renderExamFilters()}
      
      <RefreshButton
        onClick={onRefresh}
        isLoading={isLoading}
        title="Refresh"
      />
    </div>
  );
};

export default JobFilters;
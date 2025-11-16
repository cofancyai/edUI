// src/components/dashboard/ExamBot/SearchBar.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Check } from 'lucide-react';
import { Topic } from '../../../types/examBot.types';

interface SearchBarProps {
    onSearch: (query: string) => void;
    onFilterChange: (filters: Record<string, string[]>) => void;
    onReset?: () => void;  // Add this line
    topics: Topic[];
    recentSearches?: string[];
    activeFilters: Record<string, string[]>;
    searchQuery: string;
    availableYears: number[];
  }

  const SearchBar: React.FC<SearchBarProps> = ({ 
    onSearch, 
    onFilterChange, 
    onReset = () => {},  // Add this line
    topics,
    recentSearches = [],
    activeFilters,
    searchQuery,
    availableYears
  }) => {
  // Initialize query state with the current searchQuery from parent
  const [query, setQuery] = useState<string>(searchQuery || '');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(activeFilters);
  
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Sync local query state with parent searchQuery
  useEffect(() => {
    if (searchQuery !== query) {
      setQuery(searchQuery);
    }
  }, [searchQuery]);
  
  // Update local state when activeFilters prop changes
  useEffect(() => {
    setSelectedFilters(activeFilters);
  }, [activeFilters]);
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Generate suggestions based on input and topics
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    
    // Gather all topic and subtopic names
    const allTopics: string[] = [];
    topics.forEach(topic => {
      allTopics.push(topic.name);
      topic.subtopics.forEach(subtopic => {
        allTopics.push(subtopic.name);
      });
    });
    
    // Filter for matches
    const matchedSuggestions = allTopics
      .filter(item => item.toLowerCase().includes(lowerQuery))
      .slice(0, 5); // Limit to 5 suggestions
    
    // Add recent searches that match
    const matchedRecent = recentSearches
      .filter(item => item.toLowerCase().includes(lowerQuery) && !matchedSuggestions.includes(item))
      .slice(0, 3);
    
    setSuggestions([...matchedSuggestions, ...matchedRecent]);
  }, [query, topics, recentSearches]);
  
  const handleSearch = () => {
    console.log('Search button clicked with query:', query, 'and filters:', selectedFilters);
    
    // Always pass the current selected filters to the parent when searching
    onFilterChange(selectedFilters);
    
    // Then perform the search
    onSearch(query || ' '); // Use a space if query is empty to trigger a search with just filters
    
    setShowSuggestions(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };
  
  const handleFilterChange = (type: string, value: string) => {
    setSelectedFilters(prev => {
      // Create a new array for this filter type
      const updatedFilter = prev[type] ? [...prev[type]] : [];
      
      // Toggle the value
      if (updatedFilter.includes(value)) {
        const index = updatedFilter.indexOf(value);
        updatedFilter.splice(index, 1);
      } else {
        updatedFilter.push(value);
      }
      
      // Create new filters object
      const newFilters = { ...prev, [type]: updatedFilter };
      
      return newFilters;
    });
  };
  
  const applyFilters = () => {
    console.log('Applying filters:', selectedFilters);
    onFilterChange(selectedFilters);
    
    // If there's an active search query, re-run the search with the new filters
    if (query.trim()) {
      onSearch(query);
    }
    
    setShowFilters(false);
  };
  
  const clearFilters = () => {
    const emptyFilters = {
      topics: [],
      difficulty: [],
      year: []
    };
    setSelectedFilters(emptyFilters);
    onFilterChange(emptyFilters);
    
    // If there's an active search query, re-run the search with cleared filters
    if (query.trim()) {
      onSearch(query);
    }
  };
  
  const getActiveFilterCount = () => {
    return Object.values(selectedFilters).reduce((count, filterArray) => count + filterArray.length, 0);
  };
  
  return (
    <div className="search-container" ref={searchRef} style={{
      marginBottom: '1.5rem',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <Search size={20} color="#B19CD9" style={{ marginRight: '0.75rem' }} />
        
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search for topics, questions, or concepts..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#EDEDED',
            fontSize: '1rem',
            padding: '0.25rem 0',
            outline: 'none'
          }}
        />
        
        {query && (
          <X 
            size={18} 
            color="#B19CD9" 
            style={{ 
              marginRight: '0.75rem',
              cursor: 'pointer' 
            }}
            onClick={() => {
              setQuery('');
              setShowSuggestions(false);
              // Clear search when X is clicked
              if (searchQuery) {
                onSearch('');
              }
            }}
          />
        )}
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            background: showFilters || getActiveFilterCount() > 0 ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            color: showFilters || getActiveFilterCount() > 0 ? '#FFD700' : '#B19CD9',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            marginRight: '0.75rem',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Filter size={18} style={{ marginRight: '0.25rem' }} />
          <span style={{ fontSize: '0.85rem' }}>Filter</span>
          
          {getActiveFilterCount() > 0 && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#FFD700',
              color: '#2E1A47',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}>
              {getActiveFilterCount()}
            </div>
          )}
        </button>
        
        <button
          onClick={handleSearch}
          style={{
            background: 'linear-gradient(45deg, #B19CD9, #FFD700)',
            color: '#2E1A47',
            border: 'none',
            borderRadius: '0.25rem',
            padding: '0.35rem 0.75rem',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Search
        </button>
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
          borderRadius: '0 0 0.5rem 0.5rem',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 10,
          marginTop: '0.25rem'
        }}>
          {suggestions.map((suggestion, index) => (
            <div 
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid rgba(177, 156, 217, 0.1)' : 'none',
                color: '#EDEDED',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Search size={16} color="#B19CD9" style={{ marginRight: '0.75rem', opacity: 0.7 }} />
              {suggestion}
            </div>
          ))}
        </div>
      )}
      
      {/* Filters section */}
      {showFilters && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginTop: '0.75rem',
          zIndex: 10,
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Topics filter */}
            <div>
              <h4 style={{ 
                color: '#B19CD9', 
                fontSize: '0.9rem',
                marginBottom: '0.75rem'
              }}>Topics</h4>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '0.5rem',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '0.25rem'
              }}>
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleFilterChange('topics', topic.id)}
                    style={{
                      background: selectedFilters.topics?.includes(topic.id) 
                        ? 'rgba(255, 215, 0, 0.15)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      border: selectedFilters.topics?.includes(topic.id)
                        ? '1px solid #FFD700'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '1rem',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.8rem',
                      color: selectedFilters.topics?.includes(topic.id) ? '#FFD700' : '#EDEDED',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {selectedFilters.topics?.includes(topic.id) && (
                      <Check size={12} style={{ flexShrink: 0 }} />
                    )}
                    <span>{topic.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Difficulty filter */}
            <div>
              <h4 style={{ 
                color: '#B19CD9', 
                fontSize: '0.9rem',
                marginBottom: '0.75rem'
              }}>Difficulty</h4>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '0.5rem' 
              }}>
                {['Easy', 'Medium', 'Hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleFilterChange('difficulty', level)}
                    style={{
                      background: selectedFilters.difficulty?.includes(level) 
                        ? 'rgba(255, 215, 0, 0.15)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      border: selectedFilters.difficulty?.includes(level)
                        ? '1px solid #FFD700'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '1rem',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.8rem',
                      color: selectedFilters.difficulty?.includes(level) ? '#FFD700' : '#EDEDED',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {selectedFilters.difficulty?.includes(level) && (
                      <Check size={12} style={{ flexShrink: 0 }} />
                    )}
                    <span>{level}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Year filter */}
            <div>
              <h4 style={{ 
                color: '#B19CD9', 
                fontSize: '0.9rem',
                marginBottom: '0.75rem'
              }}>Year</h4>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '0.5rem',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '0.25rem'
              }}>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleFilterChange('year', year.toString())}
                    style={{
                      background: selectedFilters.year?.includes(year.toString()) 
                        ? 'rgba(255, 215, 0, 0.15)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      border: selectedFilters.year?.includes(year.toString())
                        ? '1px solid #FFD700'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '1rem',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.8rem',
                      color: selectedFilters.year?.includes(year.toString()) ? '#FFD700' : '#EDEDED',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {selectedFilters.year?.includes(year.toString()) && (
                      <Check size={12} style={{ flexShrink: 0 }} />
                    )}
                    <span>{year}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Filter actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '1rem'
          }}>
            <button
              onClick={clearFilters}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#B19CD9',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Clear All
            </button>
            
            <button
              onClick={applyFilters}
              style={{
                background: 'linear-gradient(45deg, #B19CD9, #FFD700)',
                color: '#2E1A47',
                border: 'none',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
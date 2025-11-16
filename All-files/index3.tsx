import { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, BookOpen, Users, Video, Clock } from 'lucide-react';
import { useTutorData } from '../../../hooks/useTutorData';
import TutorList from './TutorList';
import TutorProfile from './TutorProfile';
import { Tutor } from '../../../types/tutor.types';

interface ManualLearningProps {
  selectedLanguage: string;
  isAuthenticated: boolean;
}

const ManualLearning = ({ selectedLanguage, isAuthenticated }: ManualLearningProps) => {
  const { tutors, loading, error } = useTutorData();
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'students' | 'videos' | 'rating'>('name');

  const subjects = [
    'All Subjects',
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
    'Hindi', 'History', 'Geography', 'Political Science', 'Economics',
    'Computer Science', 'General Knowledge', 'Current Affairs'
  ];

  // Filter tutors based on search and subject
  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutor.working_experience.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = selectedSubject === '' || selectedSubject === 'All Subjects';
    
    return matchesSearch && matchesSubject;
  });

  // Sort tutors
  const sortedTutors = [...filteredTutors].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'students':
        // Mock data - in real app, this would come from stats
        return Math.random() - 0.5;
      case 'videos':
        return Math.random() - 0.5;
      case 'rating':
        return Math.random() - 0.5;
      default:
        return 0;
    }
  });

  const handleTutorSelect = (tutor: Tutor) => {
    setSelectedTutor(tutor);
  };

  const handleBackToList = () => {
    setSelectedTutor(null);
  };

  if (selectedTutor) {
    return (
      <TutorProfile 
        tutor={selectedTutor}
        onBack={handleBackToList}
        selectedLanguage={selectedLanguage}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
      borderRadius: '0.75rem',
      padding: '2rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      minHeight: '600px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{
            color: '#FFD700',
            fontSize: '1.8rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <BookOpen size={28} />
            Manual Learning
          </h2>
          <p style={{
            color: '#B19CD9',
            fontSize: '1rem',
            margin: 0
          }}>
            Learn from expert tutors with videos and live classes
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '0.5rem',
            padding: '0.25rem'
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.5rem',
                background: viewMode === 'grid' ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                color: viewMode === 'grid' ? '#FFD700' : '#9ca3af',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem',
                background: viewMode === 'list' ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                color: viewMode === 'list' ? '#FFD700' : '#9ca3af',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '0.5rem',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#60a5fa', fontSize: '1.5rem', fontWeight: '700' }}>
            {tutors.length}
          </div>
          <div style={{ color: '#EDEDED', fontSize: '0.8rem' }}>Expert Tutors</div>
        </div>
        
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '0.5rem',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#34d399', fontSize: '1.5rem', fontWeight: '700' }}>
            {subjects.length - 1}
          </div>
          <div style={{ color: '#EDEDED', fontSize: '0.8rem' }}>Subjects Available</div>
        </div>
        
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '0.5rem',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: '700' }}>
            Free
          </div>
          <div style={{ color: '#EDEDED', fontSize: '0.8rem' }}>Video Access</div>
        </div>
        
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '0.5rem',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#a78bfa', fontSize: '1.5rem', fontWeight: '700' }}>
            Live
          </div>
          <div style={{ color: '#EDEDED', fontSize: '0.8rem' }}>Classes Available</div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
          <Search 
            size={20} 
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }}
          />
          <input
            type="text"
            placeholder="Search tutors by name or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              backgroundColor: '#111827',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Subject Filter */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{
            padding: '0.75rem',
            backgroundColor: '#111827',
            color: '#f9fafb',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            fontSize: '0.9rem',
            minWidth: '150px'
          }}
        >
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'students' | 'videos' | 'rating')}
          style={{
            padding: '0.75rem',
            backgroundColor: '#111827',
            color: '#f9fafb',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            fontSize: '0.9rem',
            minWidth: '120px'
          }}
        >
          <option value="name">Sort by Name</option>
          <option value="students">Most Students</option>
          <option value="videos">Most Videos</option>
          <option value="rating">Highest Rated</option>
        </select>

        {/* Results Count */}
        <div style={{
          color: '#9ca3af',
          fontSize: '0.9rem',
          padding: '0.75rem'
        }}>
          {sortedTutors.length} tutors found
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '6px solid rgba(255, 215, 0, 0.3)',
            borderTop: '6px solid #FFD700',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#EDEDED', fontSize: '1.1rem' }}>Finding amazing tutors for you...</p>
        </div>
      )}

      {/* Tutors List */}
      {!loading && !error && (
        <TutorList 
          tutors={sortedTutors}
          onTutorSelect={handleTutorSelect}
          viewMode={viewMode}
          selectedLanguage={selectedLanguage}
        />
      )}

      {/* No Results */}
      {!loading && !error && sortedTutors.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af'
        }}>
          <Users size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '1rem', color: '#EDEDED' }}>No tutors found</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            {searchQuery || selectedSubject !== 'All Subjects' 
              ? 'Try adjusting your search criteria'
              : 'No tutors are available at the moment'
            }
          </p>
          {(searchQuery || selectedSubject !== 'All Subjects') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('All Subjects');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Help Section */}
      {!loading && tutors.length > 0 && (
        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '0.75rem'
        }}>
          <h3 style={{
            color: '#FFD700',
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ðŸ’¡ How Manual Learning Works
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Video size={20} style={{ color: '#10b981' }} />
              <div>
                <div style={{ color: '#EDEDED', fontWeight: '500', fontSize: '0.9rem' }}>
                  Free Video Access
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                  Watch any tutor's videos for free
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={20} style={{ color: '#3b82f6' }} />
              <div>
                <div style={{ color: '#EDEDED', fontWeight: '500', fontSize: '0.9rem' }}>
                  Live Classes
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                  Pay to join live interactive sessions
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Clock size={20} style={{ color: '#f59e0b' }} />
              <div>
                <div style={{ color: '#EDEDED', fontWeight: '500', fontSize: '0.9rem' }}>
                  Learn at Your Pace
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                  No restrictions on video learning
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualLearning;
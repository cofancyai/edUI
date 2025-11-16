import { Video, Users, Star, BookOpen, Award, Play, Calendar } from 'lucide-react';
import { Tutor } from '../../../types/tutor.types';

interface TutorListProps {
  tutors: Tutor[];
  onTutorSelect: (tutor: Tutor) => void;
  viewMode: 'grid' | 'list';
  selectedLanguage: string;
}

const TutorList = ({ tutors, onTutorSelect, viewMode, selectedLanguage }: TutorListProps) => {
  // Mock data for demonstration - in real app, this would come from API
  const getTutorStats = (tutorId: string) => ({
    videoCount: Math.floor(Math.random() * 50) + 5,
    studentCount: Math.floor(Math.random() * 200) + 10,
    rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
    hasActiveClass: Math.random() > 0.7,
    classPrice: Math.floor(Math.random() * 400) + 100
  });

  const getSubjectIcon = (qualification: string) => {
    const qual = qualification.toLowerCase();
    if (qual.includes('math') || qual.includes('btech') || qual.includes('engineering')) return 'ðŸ”¢';
    if (qual.includes('science') || qual.includes('physics') || qual.includes('chemistry')) return 'ðŸ§ª';
    if (qual.includes('arts') || qual.includes('english') || qual.includes('literature')) return 'ðŸ“š';
    if (qual.includes('commerce') || qual.includes('economics')) return 'ðŸ’¼';
    if (qual.includes('computer') || qual.includes('it')) return 'ðŸ’»';
    return 'ðŸŽ“';
  };

  const formatExperience = (experience: string) => {
    if (experience.length > 100) {
      return experience.substring(0, 100) + '...';
    }
    return experience;
  };

  const getEducationLevel = (qualification: string) => {
    if (qualification === 'phd') return 'PhD';
    if (qualification === 'master_degree') return 'Master\'s';
    if (qualification === 'degree') return 'Bachelor\'s';
    if (qualification === 'higher_secondary') return '12th Grade';
    if (qualification === 'matriculation') return '10th Grade';
    return qualification;
  };

  if (viewMode === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tutors.map((tutor) => {
          const stats = getTutorStats(tutor.id);
          return (
            <div
              key={tutor.id}
              onClick={() => onTutorSelect(tutor)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {tutor.name.charAt(0).toUpperCase()}
              </div>

              {/* Main Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{
                      color: '#FFD700',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      margin: '0 0 0.25rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {getSubjectIcon(tutor.education_qualification)} {tutor.name}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.85rem',
                      color: '#B19CD9'
                    }}>
                      <span>{getEducationLevel(tutor.education_qualification)}</span>
                      {tutor.degree && <span>â€¢ {tutor.degree}</span>}
                      {tutor.phd && <span>â€¢ PhD</span>}
                    </div>
                  </div>

                  {/* Rating */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(245, 158, 11, 0.2)',
                    borderRadius: '1rem',
                    fontSize: '0.8rem'
                  }}>
                    <Star size={12} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <span style={{ color: '#fbbf24', fontWeight: '600' }}>{stats.rating}</span>
                  </div>
                </div>

                {/* Experience */}
                <p style={{
                  color: '#EDEDED',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  margin: '0 0 1rem 0',
                  opacity: 0.8
                }}>
                  {formatExperience(tutor.working_experience)}
                </p>

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2rem',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa' }}>
                    <Video size={14} />
                    <span>{stats.videoCount} videos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
                    <Users size={14} />
                    <span>{stats.studentCount} students</span>
                  </div>
                  {stats.hasActiveClass && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
                      <Calendar size={14} />
                      <span>Live class available</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <button style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(45deg, #8b5cf6, #a78bfa)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Play size={14} />
                  View Profile
                </button>
                {stats.hasActiveClass && (
                  <div style={{ fontSize: '0.7rem', color: '#f59e0b', textAlign: 'center' }}>
                    Live class â‚¹{stats.classPrice}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid View
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '1.5rem'
    }}>
      {tutors.map((tutor) => {
        const stats = getTutorStats(tutor.id);
        return (
          <div
            key={tutor.id}
            onClick={() => onTutorSelect(tutor)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 215, 0, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
            }}
          >
            {/* Background Gradient */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(30px, -30px)'
            }} />

            {/* Live Class Indicator */}
            {stats.hasActiveClass && (
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                padding: '0.25rem 0.75rem',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                borderRadius: '1rem',
                fontSize: '0.7rem',
                fontWeight: '600',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                ðŸ”´ LIVE
              </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {tutor.name.charAt(0).toUpperCase()}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{
                  color: '#FFD700',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 0.25rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {getSubjectIcon(tutor.education_qualification)} {tutor.name}
                </h3>
                <div style={{
                  color: '#B19CD9',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Award size={12} />
                  {getEducationLevel(tutor.education_qualification)}
                  {tutor.phd && ' â€¢ PhD'}
                </div>
              </div>

              {/* Rating */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                background: 'rgba(245, 158, 11, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.8rem'
              }}>
                <Star size={12} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                <span style={{ color: '#fbbf24', fontWeight: '600' }}>{stats.rating}</span>
              </div>
            </div>

            {/* Experience */}
            <p style={{
              color: '#EDEDED',
              fontSize: '0.85rem',
              lineHeight: '1.4',
              margin: '0 0 1rem 0',
              opacity: 0.8,
              minHeight: '3.5rem'
            }}>
              {formatExperience(tutor.working_experience)}
            </p>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                textAlign: 'center'
              }}>
                <div style={{ color: '#60a5fa', fontSize: '1.2rem', fontWeight: '700' }}>
                  {stats.videoCount}
                </div>
                <div style={{ color: '#EDEDED', fontSize: '0.7rem' }}>Videos</div>
              </div>
              
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                textAlign: 'center'
              }}>
                <div style={{ color: '#34d399', fontSize: '1.2rem', fontWeight: '700' }}>
                  {stats.studentCount}
                </div>
                <div style={{ color: '#EDEDED', fontSize: '0.7rem' }}>Students</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={{
                flex: 1,
                padding: '0.75rem',
                background: 'linear-gradient(45deg, #8b5cf6, #a78bfa)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <BookOpen size={14} />
                View Profile
              </button>
              
              {stats.hasActiveClass && (
                <button style={{
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  minWidth: '80px'
                }}>
                  â‚¹{stats.classPrice}
                </button>
              )}
            </div>

            {/* Specialization Tags */}
            <div style={{ 
              marginTop: '1rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {tutor.degree && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#a78bfa',
                  borderRadius: '0.25rem',
                  fontSize: '0.7rem',
                  fontWeight: '500'
                }}>
                  {tutor.degree.substring(0, 15)}...
                </span>
              )}
              
              {tutor.master_degree && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  borderRadius: '0.25rem',
                  fontSize: '0.7rem',
                  fontWeight: '500'
                }}>
                  Master's
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TutorList;
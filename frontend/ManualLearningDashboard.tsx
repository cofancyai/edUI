import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Home, LogOut, Settings, Bell, Search, Video, Calendar, Users, TrendingUp, Award, Clock, Star } from 'lucide-react';
import ManualLearning from './dashboard/ManualLearning';
import { useStudentTutorData } from '../hooks/useTutorData';

const ManualLearningDashboard = () => {
  const navigate = useNavigate();
  const studentPhone = localStorage.getItem('studentPhone');
  const studentName = localStorage.getItem('studentName') || 'Student';
  
  const { enrolledClasses, loading: enrolledLoading } = useStudentTutorData(studentPhone || '');
  
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeNotifications, setActiveNotifications] = useState(3);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check authentication
  useEffect(() => {
    if (!studentPhone) {
      navigate('/student');
    }
  }, [studentPhone, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('studentPhone');
    localStorage.removeItem('studentName');
    navigate('/');
  };

  const switchToAIMode = () => {
    navigate('/student/dashboard');
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mock data for quick stats
  const quickStats = {
    videosWatched: Math.floor(Math.random() * 50) + 10,
    hoursLearned: Math.floor(Math.random() * 20) + 5,
    classesAttended: enrolledClasses.length,
    tutorsFollowed: Math.floor(Math.random() * 10) + 3
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#2E1A47',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1a1a4e, #2E1A47)',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* Left Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {/* Logo & Mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(45deg, #10b981, #34d399)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={20} style={{ color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  color: '#FFD700',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  margin: 0
                }}>
                  Manual Learning
                </h1>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#B19CD9'
                }}>
                  Learn from Expert Tutors
                </div>
              </div>
            </div>

            {/* Mode Switch Button */}
            <button
              onClick={switchToAIMode}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Brain size={14} />
              Switch to AI Mode
            </button>
          </div>

          {/* Center Section - Greeting */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              color: '#FFD700',
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              {getGreeting()}, {studentName}!
            </div>
            <div style={{
              color: '#B19CD9',
              fontSize: '0.8rem'
            }}>
              {currentTime.toLocaleDateString('en-IN')} â€¢ {formatTime(currentTime)}
            </div>
          </div>

          {/* Right Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Quick Stats */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 215, 0, 0.2)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#10b981', fontSize: '1rem', fontWeight: '700' }}>
                  {quickStats.videosWatched}
                </div>
                <div style={{ color: '#EDEDED', fontSize: '0.7rem' }}>Videos</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f59e0b', fontSize: '1rem', fontWeight: '700' }}>
                  {quickStats.classesAttended}
                </div>
                <div style={{ color: '#EDEDED', fontSize: '0.7rem' }}>Classes</div>
              </div>
            </div>

            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#EDEDED',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.25rem',
                fontSize: '0.8rem'
              }}
            >
              <option value="English">English</option>
              <option value="Hindi">à¤¹à¤¿à¤‚à¤¦à¥€</option>
              <option value="Tamil">à®¤à®®à®¿à®´à¯</option>
              <option value="Telugu">à°¤à±†à°²à±à°—à±</option>
            </select>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button style={{
                background: 'none',
                border: 'none',
                color: '#EDEDED',
                cursor: 'pointer',
                padding: '0.5rem',
                position: 'relative'
              }}>
                <Bell size={20} />
                {activeNotifications > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '0.25rem',
                    right: '0.25rem',
                    width: '8px',
                    height: '8px',
                    background: '#ef4444',
                    borderRadius: '50%'
                  }} />
                )}
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(45deg, #ef4444, #f87171)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Quick Overview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Learning Progress */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.05))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ color: '#10b981', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                  Learning Progress
                </h3>
                <div style={{ color: '#EDEDED', fontSize: '1.8rem', fontWeight: '700' }}>
                  {quickStats.hoursLearned}h
                </div>
                <div style={{ color: '#B19CD9', fontSize: '0.8rem' }}>
                  This month
                </div>
              </div>
              <TrendingUp size={24} style={{ color: '#10b981' }} />
            </div>
          </div>

          {/* Enrolled Classes */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.05))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ color: '#f59e0b', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                  Enrolled Classes
                </h3>
                <div style={{ color: '#EDEDED', fontSize: '1.8rem', fontWeight: '700' }}>
                  {quickStats.classesAttended}
                </div>
                <div style={{ color: '#B19CD9', fontSize: '0.8rem' }}>
                  {enrolledLoading ? 'Loading...' : 'Active enrollments'}
                </div>
              </div>
              <Calendar size={24} style={{ color: '#f59e0b' }} />
            </div>
          </div>

          {/* Favorite Tutors */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.1), rgba(167, 139, 250, 0.05))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ color: '#8b5cf6', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                  Favorite Tutors
                </h3>
                <div style={{ color: '#EDEDED', fontSize: '1.8rem', fontWeight: '700' }}>
                  {quickStats.tutorsFollowed}
                </div>
                <div style={{ color: '#B19CD9', fontSize: '0.8rem' }}>
                  Following
                </div>
              </div>
              <Star size={24} style={{ color: '#8b5cf6' }} />
            </div>
          </div>

          {/* Videos Watched */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.05))',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ color: '#3b82f6', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                  Videos Watched
                </h3>
                <div style={{ color: '#EDEDED', fontSize: '1.8rem', fontWeight: '700' }}>
                  {quickStats.videosWatched}
                </div>
                <div style={{ color: '#B19CD9', fontSize: '0.8rem' }}>
                  Total completed
                </div>
              </div>
              <Video size={24} style={{ color: '#3b82f6' }} />
            </div>
          </div>
        </div>

        {/* Enrolled Classes Quick View */}
        {enrolledClasses.length > 0 && (
          <div style={{
            background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                color: '#FFD700',
                fontSize: '1.2rem',
                fontWeight: '600',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={20} />
                Your Upcoming Classes
              </h3>
              <div style={{
                color: '#B19CD9',
                fontSize: '0.8rem'
              }}>
                {enrolledClasses.length} class(es) enrolled
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              {enrolledClasses.slice(0, 3).map((enrollment: any, index: number) => (
                <div
                  key={index}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid rgba(255, 215, 0, 0.2)'
                  }}
                >
                  <h4 style={{
                    color: '#FFD700',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {enrollment.live_classes?.title || 'Live Class'}
                  </h4>
                  <div style={{
                    color: '#EDEDED',
                    fontSize: '0.8rem',
                    marginBottom: '0.5rem'
                  }}>
                    Tutor: {enrollment.tutors?.name || 'Unknown'}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: '#B19CD9'
                  }}>
                    <span>
                      {enrollment.live_classes?.scheduled_date 
                        ? new Date(enrollment.live_classes.scheduled_date).toLocaleDateString()
                        : 'Schedule TBD'
                      }
                    </span>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: enrollment.live_classes?.status === 'active' 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : 'rgba(107, 114, 128, 0.2)',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem'
                    }}>
                      {enrollment.live_classes?.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Manual Learning Component */}
        <ManualLearning 
          selectedLanguage={selectedLanguage}
          isAuthenticated={!!studentPhone}
        />

        {/* Quick Help Section */}
        <div style={{
          marginTop: '3rem',
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '0.75rem',
          padding: '1.5rem'
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
            ðŸ’¡ Quick Tips for Manual Learning
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <div style={{ color: '#EDEDED', fontWeight: '500', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                ðŸ“¹ Free Videos
              </div>
              <div style={{ color: '#B19CD9', fontSize: '0.8rem' }}>
                Browse and watch any tutor's videos for free
              </div>
            </div>
            
            <div>
              <div style={{ color: '#EDEDED', fontWeight: '500', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                ðŸ’° Live Classes
              </div>
              <div style={{ color: '#B19CD9', fontSize: '0.8rem' }}>
                Pay to join interactive live sessions with tutors
              </div>
            </div>
            
            <div>
              <div style={{ color: '#EDEDED', fontWeight: '500', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                â­ Follow Tutors
              </div>
              <div style={{ color: '#B19CD9', fontSize: '0.8rem' }}>
                Keep track of your favorite tutors and their content
              </div>
            </div>
            
            <div>
              <div style={{ color: '#EDEDED', fontWeight: '500', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                ðŸ”„ Switch Anytime
              </div>
              <div style={{ color: '#B19CD9', fontSize: '0.8rem' }}>
                You can switch to AI Mode learning anytime
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManualLearningDashboard;
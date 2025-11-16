import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Video, Calendar, BarChart3, Home, Settings, Bell } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import VideoManagement from './dashboard/tutor/VideoManagement';
import ClassManagement from './dashboard/tutor/ClassManagement';
import TutorStats from './dashboard/tutor/TutorStats';

interface TutorData {
  id: string;
  name: string;
  username: string;
  mobile_number: string;
  education_qualification: string;
  degree: string;
  master_degree: string;
  phd: boolean;
  working_experience: string;
  documents_url: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

const TutorDashboard = () => {
  const navigate = useNavigate();
  const tutorUsername = localStorage.getItem('tutorUsername');
  const tutorId = localStorage.getItem('tutorId');

  const [tutorData, setTutorData] = useState<TutorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'classes' | 'profile'>('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check if tutor is logged in
    if (!tutorUsername || !tutorId) {
      navigate('/tutor');
      return;
    }

    fetchTutorData();
  }, [tutorUsername, tutorId, navigate]);

  const fetchTutorData = async () => {
    try {
      const { data: tutor, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', tutorId)
        .single();

      if (error) {
        throw error;
      }

      if (tutor) {
        setTutorData(tutor);
        
        // Check if tutor is approved
        if (!tutor.is_approved) {
          setError('Your account is pending approval. Please wait for admin approval.');
        }
      }
    } catch (err: any) {
      console.error('Error fetching tutor data:', err);
      setError('Failed to load tutor data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tutorUsername');
    localStorage.removeItem('tutorId');
    navigate('/');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
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

  const getEducationLevel = (qualification: string) => {
    if (qualification === 'phd') return 'PhD';
    if (qualification === 'master_degree') return 'Master\'s Degree';
    if (qualification === 'degree') return 'Bachelor\'s Degree';
    if (qualification === 'higher_secondary') return '12th Grade';
    if (qualification === 'matriculation') return '10th Grade';
    return qualification;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#2E1A47',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              border: '6px solid rgba(255, 215, 0, 0.2)',
              borderLeft: '6px solid #FFD700',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '1rem',
            }}
          />
          <p style={{ color: '#EDEDED', fontSize: '1.1rem' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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
            {/* Logo & Tutor Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(45deg, #10b981, #34d399)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white',
                fontWeight: 'bold',
                border: '2px solid rgba(255, 215, 0, 0.3)'
              }}>
                {tutorData?.name?.charAt(0).toUpperCase() || 'T'}
              </div>
              <div>
                <h1 style={{
                  color: '#FFD700',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  margin: 0
                }}>
                  Tutor Dashboard
                </h1>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#B19CD9'
                }}>
                  {getGreeting()}, {tutorData?.name || 'Tutor'}!
                </div>
              </div>
            </div>

            {/* Approval Status */}
            {tutorData && (
              <div style={{
                padding: '0.5rem 1rem',
                background: tutorData.is_approved 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'rgba(245, 158, 11, 0.2)',
                color: tutorData.is_approved ? '#10b981' : '#f59e0b',
                borderRadius: '0.5rem',
                border: `1px solid ${tutorData.is_approved 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : 'rgba(245, 158, 11, 0.3)'}`,
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {tutorData.is_approved ? 'âœ… Approved' : 'â³ Pending Approval'}
              </div>
            )}
          </div>

          {/* Center - Time */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              color: '#FFD700',
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              {currentTime.toLocaleDateString('en-IN')}
            </div>
            <div style={{
              color: '#B19CD9',
              fontSize: '0.8rem'
            }}>
              {formatTime(currentTime)}
            </div>
          </div>

          {/* Right Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Notifications */}
            <button style={{
              background: 'none',
              border: 'none',
              color: '#EDEDED',
              cursor: 'pointer',
              padding: '0.5rem',
              position: 'relative'
            }}>
              <Bell size={20} />
              <span style={{
                position: 'absolute',
                top: '0.25rem',
                right: '0.25rem',
                width: '8px',
                height: '8px',
                background: '#ef4444',
                borderRadius: '50%'
              }} />
            </button>

            {/* Profile Button */}
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '0.5rem',
                background: activeTab === 'profile' 
                  ? 'rgba(255, 215, 0, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'profile' ? '#FFD700' : '#EDEDED',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <Settings size={20} />
            </button>

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
                fontSize: '0.85rem',
                fontWeight: '600',
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

      {/* Error Message */}
      {error && !tutorData?.is_approved && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#f59e0b',
          padding: '1rem',
          margin: '1rem 2rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {tutorData?.is_approved ? (
          <>
            {/* Navigation Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '1rem'
            }}>
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'videos', label: 'My Videos', icon: Video },
                { id: 'classes', label: 'Live Classes', icon: Calendar },
                { id: 'profile', label: 'Profile', icon: User }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: activeTab === tab.id 
                        ? 'rgba(255, 215, 0, 0.2)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      color: activeTab === tab.id ? '#FFD700' : '#9ca3af',
                      border: activeTab === tab.id 
                        ? '1px solid rgba(255, 215, 0, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && tutorData && (
              <TutorStats tutorId={tutorData.id} />
            )}

            {activeTab === 'videos' && tutorData && (
              <VideoManagement tutorId={tutorData.id} />
            )}

            {activeTab === 'classes' && tutorData && (
              <ClassManagement tutorId={tutorData.id} />
            )}

            {activeTab === 'profile' && tutorData && (
              <div style={{
                background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
                borderRadius: '0.75rem',
                padding: '2rem',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}>
                <h2 style={{
                  color: '#FFD700',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <User size={24} />
                  Tutor Profile
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr',
                  gap: '2rem'
                }}>
                  {/* Profile Picture & Basic Info */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.75rem',
                    padding: '2rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      background: 'linear-gradient(45deg, #10b981, #34d399)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                      color: 'white',
                      fontWeight: 'bold',
                      margin: '0 auto 1.5rem',
                      border: '4px solid rgba(255, 215, 0, 0.3)'
                    }}>
                      {tutorData.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <h3 style={{
                      color: '#FFD700',
                      fontSize: '1.3rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      {tutorData.name}
                    </h3>
                    
                    <div style={{
                      color: '#B19CD9',
                      fontSize: '0.9rem',
                      marginBottom: '1rem'
                    }}>
                      @{tutorData.username}
                    </div>

                    <div style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      borderRadius: '1rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      display: 'inline-block'
                    }}>
                      {getEducationLevel(tutorData.education_qualification)}
                    </div>
                  </div>

                  {/* Detailed Information */}
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1.5rem',
                      marginBottom: '2rem'
                    }}>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#B19CD9',
                          fontSize: '0.8rem',
                          marginBottom: '0.5rem',
                          fontWeight: '500'
                        }}>
                          Mobile Number
                        </label>
                        <div style={{
                          color: '#EDEDED',
                          fontSize: '0.9rem',
                          padding: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '0.5rem'
                        }}>
                          {tutorData.mobile_number}
                        </div>
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          color: '#B19CD9',
                          fontSize: '0.8rem',
                          marginBottom: '0.5rem',
                          fontWeight: '500'
                        }}>
                          Education Qualification
                        </label>
                        <div style={{
                          color: '#EDEDED',
                          fontSize: '0.9rem',
                          padding: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '0.5rem'
                        }}>
                          {getEducationLevel(tutorData.education_qualification)}
                        </div>
                      </div>

                      {tutorData.degree && (
                        <div>
                          <label style={{
                            display: 'block',
                            color: '#B19CD9',
                            fontSize: '0.8rem',
                            marginBottom: '0.5rem',
                            fontWeight: '500'
                          }}>
                            Degree
                          </label>
                          <div style={{
                            color: '#EDEDED',
                            fontSize: '0.9rem',
                            padding: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '0.5rem'
                          }}>
                            {tutorData.degree}
                          </div>
                        </div>
                      )}

                      {tutorData.master_degree && (
                        <div>
                          <label style={{
                            display: 'block',
                            color: '#B19CD9',
                            fontSize: '0.8rem',
                            marginBottom: '0.5rem',
                            fontWeight: '500'
                          }}>
                            Master's Degree
                          </label>
                          <div style={{
                            color: '#EDEDED',
                            fontSize: '0.9rem',
                            padding: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '0.5rem'
                          }}>
                            {tutorData.master_degree}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Working Experience */}
                    <div>
                      <label style={{
                        display: 'block',
                        color: '#B19CD9',
                        fontSize: '0.8rem',
                        marginBottom: '0.5rem',
                        fontWeight: '500'
                      }}>
                        Working Experience
                      </label>
                      <div style={{
                        color: '#EDEDED',
                        fontSize: '0.9rem',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.5rem',
                        lineHeight: '1.6',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {tutorData.working_experience}
                      </div>
                    </div>

                    {/* Account Info */}
                    <div style={{
                      marginTop: '2rem',
                      padding: '1rem',
                      background: 'rgba(255, 215, 0, 0.1)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '0.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem'
                      }}>
                        <div>
                          <span style={{ color: '#B19CD9' }}>Account Created: </span>
                          <span style={{ color: '#EDEDED' }}>
                            {new Date(tutorData.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#B19CD9' }}>Status: </span>
                          <span style={{ color: tutorData.is_approved ? '#10b981' : '#f59e0b' }}>
                            {tutorData.is_approved ? 'Approved' : 'Pending Approval'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Pending Approval Message */
          <div style={{
            background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
            borderRadius: '0.75rem',
            padding: '3rem',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem',
            }}>
              â³
            </div>
            <h2 style={{
              color: '#FFD700',
              fontSize: '1.8rem',
              marginBottom: '1rem',
            }}>
              Account Pending Approval
            </h2>
            <p style={{
              color: '#B19CD9',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              marginBottom: '2rem',
            }}>
              Thank you for registering as a tutor! Your account is currently under review by our admin team. 
              You'll receive access to the tutor dashboard once your credentials and documents are verified.
            </p>
            <div style={{
              background: 'rgba(255, 215, 0, 0.1)',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              color: '#EDEDED',
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                <strong>What happens next?</strong><br/>
                1. Admin reviews your qualifications and documents<br/>
                2. You'll receive an email notification upon approval<br/>
                3. Log in again to access your full tutor dashboard
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TutorDashboard;
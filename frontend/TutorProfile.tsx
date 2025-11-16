import { useState, useEffect } from 'react';
import { ArrowLeft, Video, Calendar, Clock, DollarSign, Users, Play, Star, Award, BookOpen, Phone, Mail, CheckCircle } from 'lucide-react';
import { useTutorData } from '../../../hooks/useTutorData';
import { usePayment, usePaymentCheck } from '../../../hooks/usePayment';
import VideoPlayer from './VideoPlayer';
import { Tutor, TutorVideo, LiveClass } from '../../../types/tutor.types';

interface TutorProfileProps {
  tutor: Tutor;
  onBack: () => void;
  selectedLanguage: string;
  isAuthenticated: boolean;
}

const TutorProfile = ({ tutor, onBack, selectedLanguage, isAuthenticated }: TutorProfileProps) => {
  const { videos, currentClass, loading, incrementViews } = useTutorData(tutor.id);
  const { payForClass, loading: paymentLoading } = usePayment();
  const { checkSinglePayment, hasPaid } = usePaymentCheck();
  
  const [selectedVideo, setSelectedVideo] = useState<TutorVideo | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'about' | 'class'>('videos');
  const [paymentStatus, setPaymentStatus] = useState<boolean>(false);

  // Mock student ID - in real app, get from auth context
  const studentId = localStorage.getItem('studentPhone') || 'demo-student';

  // Check payment status for current class
  useEffect(() => {
    if (currentClass && studentId) {
      checkSinglePayment(studentId, currentClass.id).then((payment) => {
        setPaymentStatus(payment !== null);
      });
    }
  }, [currentClass, studentId]);

  // Mock tutor stats
  const tutorStats = {
    totalVideos: videos.length,
    totalStudents: Math.floor(Math.random() * 500) + 50,
    rating: (Math.random() * 1.5 + 3.5).toFixed(1),
    experience: '3+ years',
    responseTime: '< 2 hours',
    completionRate: '95%'
  };

  const handleVideoSelect = (video: TutorVideo) => {
    setSelectedVideo(video);
    incrementViews(video.id); // Track view
  };

  const handlePayForClass = async () => {
    if (!currentClass) return;
    
    try {
      const payment = await payForClass(
        studentId,
        currentClass.id,
        tutor.id,
        currentClass.price,
        currentClass.title
      );
      
      if (payment) {
        setPaymentStatus(true);
        alert('Payment successful! You can now join the live class.');
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  if (selectedVideo) {
    return (
      <VideoPlayer 
        video={selectedVideo}
        onBack={() => setSelectedVideo(null)}
        tutorName={tutor.name}
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
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: '#B19CD9',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '1rem',
            padding: '0.5rem'
          }}
        >
          <ArrowLeft size={16} />
          Back to Tutors
        </button>

        {/* Tutor Header Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(50px, -50px)'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              color: 'white',
              fontWeight: 'bold',
              border: '4px solid rgba(255, 215, 0, 0.3)'
            }}>
              {tutor.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{
                color: '#FFD700',
                fontSize: '2rem',
                fontWeight: '700',
                margin: '0 0 0.5rem 0'
              }}>
                {tutor.name}
              </h1>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#B19CD9'
                }}>
                  <Award size={16} />
                  {getEducationLevel(tutor.education_qualification)}
                </div>
                
                {tutor.degree && (
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    borderRadius: '1rem',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    {tutor.degree}
                  </div>
                )}
                
                {tutor.phd && (
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    borderRadius: '1rem',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    PhD
                  </div>
                )}
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: '700' }}>
                    {tutorStats.totalVideos}
                  </div>
                  <div style={{ color: '#EDEDED', fontSize: '0.8rem' }}>Videos</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: '700' }}>
                    {tutorStats.totalStudents}
                  </div>
                  <div style={{ color: '#EDEDED', fontSize: '0.8rem' }}>Students</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    color: '#FFD700',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}>
                    <Star size={20} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    {tutorStats.rating}
                  </div>
                  <div style={{ color: '#EDEDED', fontSize: '0.8rem' }}>Rating</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: '700' }}>
                    {tutorStats.experience}
                  </div>
                  <div style={{ color: '#EDEDED', fontSize: '0.8rem' }}>Experience</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Class Alert */}
      {currentClass && (
        <div style={{
          background: paymentStatus 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${paymentStatus 
            ? 'rgba(16, 185, 129, 0.3)' 
            : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{
                color: paymentStatus ? '#10b981' : '#ef4444',
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {paymentStatus ? (
                  <>
                    <CheckCircle size={20} />
                    ðŸŽ‰ You're enrolled in the live class!
                  </>
                ) : (
                  <>
                    ðŸ”´ Live Class Available
                  </>
                )}
              </h3>
              
              <div style={{ color: '#EDEDED', marginBottom: '0.75rem' }}>
                <strong>{currentClass.title}</strong> â€¢ {currentClass.subject}
              </div>
              
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                fontSize: '0.9rem',
                color: '#B19CD9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} />
                  {formatDateTime(currentClass.scheduled_date)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={14} />
                  {currentClass.duration_minutes} minutes
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={14} />
                  â‚¹{currentClass.price}
                </div>
              </div>
            </div>
            
            {paymentStatus ? (
              <button style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(45deg, #10b981, #34d399)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Video size={16} />
                Join Class
              </button>
            ) : (
              <button
                onClick={handlePayForClass}
                disabled={paymentLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: paymentLoading 
                    ? '#6b7280' 
                    : 'linear-gradient(45deg, #ef4444, #f87171)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: paymentLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: paymentLoading ? 0.7 : 1
                }}
              >
                <DollarSign size={16} />
                {paymentLoading ? 'Processing...' : 'Pay & Join'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '1rem'
      }}>
        {[
          { id: 'videos', label: 'Videos', icon: Video, count: tutorStats.totalVideos },
          { id: 'about', label: 'About', icon: BookOpen },
          ...(currentClass ? [{ id: 'class', label: 'Live Class', icon: Calendar }] : [])
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'videos' | 'about' | 'class')}
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
                fontSize: '0.9rem'
              }}
            >
              <Icon size={16} />
              {tab.label}
              {tab.count && (
                <span style={{
                  padding: '0.125rem 0.5rem',
                  background: activeTab === tab.id ? '#FFD700' : '#374151',
                  color: activeTab === tab.id ? '#000' : '#fff',
                  borderRadius: '1rem',
                  fontSize: '0.7rem',
                  fontWeight: '600'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'videos' && (
        <div>
          {loading ? (
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
              <p style={{ color: '#EDEDED' }}>Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#9ca3af'
            }}>
              <Video size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '1rem' }}>No videos available</h3>
              <p>This tutor hasn't uploaded any videos yet.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{
                      color: '#FFD700',
                      fontSize: '1rem',
                      fontWeight: '600',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      {video.title}
                    </h4>
                    
                    <Play 
                      size={20} 
                      style={{ 
                        color: '#60a5fa',
                        flexShrink: 0,
                        marginLeft: '0.5rem'
                      }} 
                    />
                  </div>
                  
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    borderRadius: '1rem',
                    fontSize: '0.7rem',
                    fontWeight: '500',
                    marginBottom: '0.75rem'
                  }}>
                    {video.subject}
                  </div>
                  
                  {video.description && (
                    <p style={{
                      color: '#EDEDED',
                      fontSize: '0.85rem',
                      lineHeight: '1.4',
                      margin: '0 0 1rem 0',
                      opacity: 0.8
                    }}>
                      {video.description.length > 80 
                        ? video.description.substring(0, 80) + '...'
                        : video.description
                      }
                    </p>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: '#9ca3af'
                  }}>
                    <span>{video.views} views</span>
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '2rem'
        }}>
          {/* Experience & Background */}
          <div>
            <h3 style={{
              color: '#FFD700',
              fontSize: '1.2rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              About {tutor.name}
            </h3>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{
                color: '#EDEDED',
                fontSize: '1rem',
                fontWeight: '500',
                marginBottom: '1rem'
              }}>
                Teaching Experience
              </h4>
              <p style={{
                color: '#B19CD9',
                lineHeight: '1.6',
                margin: 0
              }}>
                {tutor.working_experience}
              </p>
            </div>
            
            {/* Contact Info */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.75rem',
              padding: '1.5rem'
            }}>
              <h4 style={{
                color: '#EDEDED',
                fontSize: '1rem',
                fontWeight: '500',
                marginBottom: '1rem'
              }}>
                Contact Information
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Phone size={16} style={{ color: '#60a5fa' }} />
                  <span style={{ color: '#EDEDED' }}>{tutor.mobile_number}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mail size={16} style={{ color: '#34d399' }} />
                  <span style={{ color: '#EDEDED' }}>Available for queries</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div>
            <h3 style={{
              color: '#FFD700',
              fontSize: '1.2rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              Quick Stats
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <div style={{ color: '#60a5fa', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  Response Time
                </div>
                <div style={{ color: '#EDEDED', fontSize: '1.1rem', fontWeight: '600' }}>
                  {tutorStats.responseTime}
                </div>
              </div>
              
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <div style={{ color: '#34d399', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  Completion Rate
                </div>
                <div style={{ color: '#EDEDED', fontSize: '1.1rem', fontWeight: '600' }}>
                  {tutorStats.completionRate}
                </div>
              </div>
              
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <div style={{ color: '#fbbf24', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  Subjects
                </div>
                <div style={{ color: '#EDEDED', fontSize: '1.1rem', fontWeight: '600' }}>
                  Multi-subject
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'class' && currentClass && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '2rem'
        }}>
          <h3 style={{
            color: '#FFD700',
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '1.5rem'
          }}>
            Live Class Details
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ color: '#B19CD9', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                Class Title
              </div>
              <div style={{ color: '#EDEDED', fontWeight: '600' }}>
                {currentClass.title}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#B19CD9', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                Subject
              </div>
              <div style={{ color: '#EDEDED', fontWeight: '600' }}>
                {currentClass.subject}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#B19CD9', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                Duration
              </div>
              <div style={{ color: '#EDEDED', fontWeight: '600' }}>
                {currentClass.duration_minutes} minutes
              </div>
            </div>
            
            <div>
              <div style={{ color: '#B19CD9', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                Price
              </div>
              <div style={{ color: '#EDEDED', fontWeight: '600' }}>
                â‚¹{currentClass.price}
              </div>
            </div>
          </div>
          
          {currentClass.description && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ color: '#B19CD9', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                Description
              </div>
              <p style={{ color: '#EDEDED', lineHeight: '1.6', margin: 0 }}>
                {currentClass.description}
              </p>
            </div>
          )}
          
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <div style={{ color: '#FFD700', fontWeight: '600', marginBottom: '0.5rem' }}>
              ðŸ“… Scheduled for: {formatDateTime(currentClass.scheduled_date)}
            </div>
            <div style={{ color: '#EDEDED', fontSize: '0.9rem' }}>
              {paymentStatus 
                ? 'âœ… You are enrolled! You will receive the meeting link before the class starts.'
                : 'â° Pay now to secure your spot in this live class.'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorProfile;
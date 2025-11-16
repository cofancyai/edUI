import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Users, ArrowRight, Sparkles, Video, Calendar, BookOpen, Zap } from 'lucide-react';

const ModeSelection = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<'ai' | 'manual' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleModeSelect = (mode: 'ai' | 'manual') => {
    setSelectedMode(mode);
    setIsAnimating(true);
    
    // Animate transition
    setTimeout(() => {
      if (mode === 'ai') {
        navigate('/student/dashboard');
      } else {
        navigate('/student/manual-dashboard');
      }
    }, 800);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const studentName = localStorage.getItem('studentName') || 'Student';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #2E1A47 50%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Montserrat', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <div style={{
        maxWidth: '1200px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            background: 'linear-gradient(45deg, #FFD700, #FFF8DC, #B19CD9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
            animation: isAnimating ? 'fadeOut 0.5s ease-out' : 'none'
          }}>
            {getGreeting()}, {studentName}! ðŸ‘‹
          </h1>
          
          <p style={{
            fontSize: '1.3rem',
            color: '#E5E7EB',
            marginBottom: '0.5rem',
            animation: isAnimating ? 'fadeOut 0.5s ease-out' : 'none'
          }}>
            Choose your learning experience
          </p>
          
          <p style={{
            fontSize: '1rem',
            color: '#B19CD9',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
            animation: isAnimating ? 'fadeOut 0.5s ease-out' : 'none'
          }}>
            Select the learning mode that best fits your study style and goals
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem',
          animation: isAnimating ? 'fadeOut 0.5s ease-out' : 'none'
        }}>
          {/* AI Mode Learning */}
          <div
            onClick={() => handleModeSelect('ai')}
            style={{
              background: selectedMode === 'ai' 
                ? 'linear-gradient(145deg, #1e40af, #3b82f6)' 
                : 'linear-gradient(145deg, #2d3748, #1f2937)',
              borderRadius: '1.5rem',
              padding: '3rem 2rem',
              border: selectedMode === 'ai' 
                ? '3px solid #FFD700' 
                : '2px solid rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              transform: selectedMode === 'ai' ? 'scale(1.05)' : 'scale(1)',
              boxShadow: selectedMode === 'ai' 
                ? '0 20px 40px rgba(59, 130, 246, 0.4)' 
                : '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!selectedMode) {
                e.currentTarget.style.transform = 'scale(1.02) translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedMode) {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
              }
            }}
          >
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />

            {/* Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              position: 'relative',
              zIndex: 1
            }}>
              <Brain size={40} style={{ color: 'white' }} />
            </div>

            <h2 style={{
              color: 'white',
              fontSize: '1.8rem',
              fontWeight: '700',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              AI Mode Learning
              <Sparkles size={24} style={{ color: '#FFD700' }} />
            </h2>

            <p style={{
              color: '#E5E7EB',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              Experience intelligent, personalized learning with AI-powered features
            </p>

            {/* Features */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '0.75rem',
              marginBottom: '2rem'
            }}>
              {[
                { icon: Zap, text: 'AI-Powered Tutoring' },
                { icon: BookOpen, text: 'Smart Mock Tests' },
                { icon: Brain, text: 'Aptitude Training' },
                { icon: Sparkles, text: 'Current Affairs AI' }
              ].map((feature, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#B19CD9',
                  fontSize: '0.95rem'
                }}>
                  <feature.icon size={16} style={{ color: '#60a5fa' }} />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: selectedMode === 'ai' ? '#FFD700' : '#60a5fa',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              Start AI Learning
              <ArrowRight size={20} />
            </div>
          </div>

          {/* Manual Mode Learning */}
          <div
            onClick={() => handleModeSelect('manual')}
            style={{
              background: selectedMode === 'manual' 
                ? 'linear-gradient(145deg, #059669, #10b981)' 
                : 'linear-gradient(145deg, #2d3748, #1f2937)',
              borderRadius: '1.5rem',
              padding: '3rem 2rem',
              border: selectedMode === 'manual' 
                ? '3px solid #FFD700' 
                : '2px solid rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              transform: selectedMode === 'manual' ? 'scale(1.05)' : 'scale(1)',
              boxShadow: selectedMode === 'manual' 
                ? '0 20px 40px rgba(16, 185, 129, 0.4)' 
                : '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!selectedMode) {
                e.currentTarget.style.transform = 'scale(1.02) translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedMode) {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
              }
            }}
          >
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />

            {/* Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(45deg, #10b981, #34d399)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              position: 'relative',
              zIndex: 1
            }}>
              <Users size={40} style={{ color: 'white' }} />
            </div>

            <h2 style={{
              color: 'white',
              fontSize: '1.8rem',
              fontWeight: '700',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              Manual Learning Mode
              <Users size={24} style={{ color: '#FFD700' }} />
            </h2>

            <p style={{
              color: '#E5E7EB',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              Learn directly from expert tutors with videos and live classes
            </p>

            {/* Features */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '0.75rem',
              marginBottom: '2rem'
            }}>
              {[
                { icon: Users, text: 'Expert Tutors' },
                { icon: Video, text: 'Free Video Lectures' },
                { icon: Calendar, text: 'Live Classes' },
                { icon: BookOpen, text: 'Interactive Learning' }
              ].map((feature, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#B19CD9',
                  fontSize: '0.95rem'
                }}>
                  <feature.icon size={16} style={{ color: '#34d399' }} />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: selectedMode === 'manual' ? '#FFD700' : '#34d399',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              Browse Tutors
              <ArrowRight size={20} />
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          animation: isAnimating ? 'fadeOut 0.5s ease-out' : 'none'
        }}>
          <p style={{
            color: '#E5E7EB',
            fontSize: '0.95rem',
            margin: '0 0 0.5rem 0',
            fontWeight: '500'
          }}>
            ðŸ’¡ You can switch between modes anytime from your dashboard
          </p>
          <p style={{
            color: '#B19CD9',
            fontSize: '0.85rem',
            margin: 0
          }}>
            Both modes offer comprehensive learning experiences tailored to different preferences
          </p>
        </div>

        {/* Loading Animation */}
        {isAnimating && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-in'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '6px solid rgba(255, 215, 0, 0.3)',
                borderTop: '6px solid #FFD700',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }} />
              <p style={{ color: 'white', fontSize: '1.1rem' }}>
                Loading {selectedMode === 'ai' ? 'AI Learning' : 'Manual Learning'} Mode...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes fadeOut {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
          }
          
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default ModeSelection;
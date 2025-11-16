import React, { useState } from 'react';
import { Brain, Target, Zap, TrendingUp, BookOpen, Award, BarChart3 } from 'lucide-react';

interface AptitudeProps {
  studentPhone?: string | null;
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

const Aptitude: React.FC<AptitudeProps> = ({
  studentPhone,
  selectedLanguage = 'english',
  isAuthenticated = false
}) => {
  const [selectedMode, setSelectedMode] = useState<'practice' | 'test' | 'solve' | null>(null);

  // Mode selection view
  if (!selectedMode) {
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
          paddingBottom: '1.5rem',
          borderBottom: '2px solid rgba(255, 215, 0, 0.2)'
        }}>
          <TrendingUp size={40} style={{ color: '#FFD700' }} />
          <div>
            <h2 style={{
              color: '#FFD700',
              fontSize: '2rem',
              fontWeight: '700',
              margin: 0,
              marginBottom: '0.5rem',
              background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Aptitude Training
            </h2>
            <p style={{
              color: '#B19CD9',
              fontSize: '1.05rem',
              margin: 0
            }}>
              Master quantitative aptitude for competitive exams
            </p>
          </div>
        </div>

        {/* Mode Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Practice Mode */}
          <div
            onClick={() => setSelectedMode('practice')}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '1rem',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(45deg, #3B82F6, #60A5FA)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Brain size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{
              color: '#60A5FA',
              fontSize: '1.4rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Practice Mode
            </h3>
            <p style={{
              color: '#EDEDED',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              Practice unlimited aptitude questions with instant feedback and detailed explanations
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#60A5FA',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Start Practicing →
            </div>
          </div>

          {/* Test Mode */}
          <div
            onClick={() => setSelectedMode('test')}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '1rem',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(45deg, #10B981, #34D399)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Target size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{
              color: '#34D399',
              fontSize: '1.4rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Test Mode
            </h3>
            <p style={{
              color: '#EDEDED',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              Take timed tests to simulate real exam conditions and track your performance
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#34D399',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Take Test →
            </div>
          </div>

          {/* AI Solver */}
          <div
            onClick={() => setSelectedMode('solve')}
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '2px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '1rem',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(245, 158, 11, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(45deg, #F59E0B, #FBBF24)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Zap size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{
              color: '#FBBF24',
              fontSize: '1.4rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              AI Solver
            </h3>
            <p style={{
              color: '#EDEDED',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              Upload or type any aptitude problem and get step-by-step AI-powered solutions
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#FBBF24',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Solve Problem →
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div style={{
          background: 'rgba(255, 215, 0, 0.05)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
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
            <Award size={20} />
            What You'll Master
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {[
              { icon: BarChart3, text: 'Number Systems', color: '#3B82F6' },
              { icon: BookOpen, text: 'Percentages & Ratios', color: '#10B981' },
              { icon: Target, text: 'Time & Distance', color: '#F59E0B' },
              { icon: TrendingUp, text: 'Profit & Loss', color: '#8B5CF6' },
              { icon: Brain, text: 'Data Interpretation', color: '#EC4899' },
              { icon: Zap, text: 'Logical Reasoning', color: '#14B8A6' }
            ].map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0.5rem'
              }}>
                <item.icon size={18} style={{ color: item.color }} />
                <span style={{ color: '#EDEDED', fontSize: '0.9rem' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Coming Soon View for selected modes
  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      minHeight: '600px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <div style={{
        marginBottom: '2rem'
      }}>
        {selectedMode === 'practice' && <Brain size={64} style={{ color: '#3B82F6' }} />}
        {selectedMode === 'test' && <Target size={64} style={{ color: '#10B981' }} />}
        {selectedMode === 'solve' && <Zap size={64} style={{ color: '#F59E0B' }} />}
      </div>

      <h2 style={{
        color: '#FFD700',
        fontSize: '2rem',
        fontWeight: '700',
        marginBottom: '1rem'
      }}>
        {selectedMode === 'practice' && 'Practice Mode'}
        {selectedMode === 'test' && 'Test Mode'}
        {selectedMode === 'solve' && 'AI Solver'}
      </h2>

      <p style={{
        color: '#B19CD9',
        fontSize: '1.1rem',
        marginBottom: '2rem',
        maxWidth: '600px',
        lineHeight: '1.6'
      }}>
        {selectedMode === 'practice' && 'Practice unlimited aptitude questions with instant feedback and detailed solutions. Coming soon!'}
        {selectedMode === 'test' && 'Take timed tests to simulate real exam conditions and track your performance. Coming soon!'}
        {selectedMode === 'solve' && 'Upload or type any aptitude problem and get step-by-step AI-powered solutions. Coming soon!'}
      </p>

      <div style={{
        background: 'rgba(255, 215, 0, 0.1)',
        padding: '1.5rem 2rem',
        borderRadius: '0.75rem',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        marginBottom: '2rem'
      }}>
        <Award size={32} style={{ color: '#FFD700', marginBottom: '0.5rem' }} />
        <h3 style={{ color: '#FFD700', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
          Full Implementation Coming Soon!
        </h3>
        <p style={{ color: '#EDEDED', margin: 0, fontSize: '0.95rem' }}>
          This feature requires database integration and API endpoints for full functionality.
          Stay tuned for comprehensive aptitude training!
        </p>
      </div>

      <button
        onClick={() => setSelectedMode(null)}
        style={{
          padding: '1rem 2rem',
          background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
          color: '#2E1A47',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 215, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        ← Back to Modes
      </button>
    </div>
  );
};

export default Aptitude;

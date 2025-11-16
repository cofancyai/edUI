import React from 'react';
import { Trophy, Target, Clock, RotateCcw, Home, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

interface ResultsViewProps {
  mockTest: any;
  selectedLanguage: string;
}

const ResultsView: React.FC<ResultsViewProps> = ({ mockTest, selectedLanguage }) => {
  const {
    testResults,
    selectedMockTest,
    resetToSelection,
    startMockTest
  } = mockTest;

  if (!testResults) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#F8FAFC'
      }}>
        Loading results...
      </div>
    );
  }

  const { attempt, questions, topic_wise_performance, difficulty_wise_performance } = testResults;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 60) return '#3B82F6'; // Blue
    if (percentage >= 40) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return 'Outstanding Performance! ðŸ†';
    if (percentage >= 80) return 'Excellent Work! ðŸŒŸ';
    if (percentage >= 70) return 'Good Job! ðŸ‘';
    if (percentage >= 60) return 'Keep Improving! ðŸ“ˆ';
    if (percentage >= 40) return 'Needs More Practice ðŸ“š';
    return 'Focus on Fundamentals ðŸ’ª';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#F8FAFC',
          marginBottom: '0.5rem'
        }}>
          Test Results
        </h1>
        <p style={{
          color: '#94A3B8',
          fontSize: '1.1rem'
        }}>
          Mock Test {selectedMockTest} - Performance Analysis
        </p>
      </div>

      {/* Score Overview */}
      <div style={{
        backgroundColor: '#1E293B',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        border: `2px solid ${getScoreColor(attempt.score_percentage)}`,
        textAlign: 'center'
      }}>
        {/* Score Circle */}
        <div style={{
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          margin: '0 auto 2rem',
          background: `conic-gradient(${getScoreColor(attempt.score_percentage)} 0deg, ${getScoreColor(attempt.score_percentage)} ${(attempt.score_percentage/100) * 360}deg, #374151 ${(attempt.score_percentage/100) * 360}deg, #374151 360deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: getScoreColor(attempt.score_percentage)
            }}>
              {attempt.score_percentage}%
            </div>
          </div>
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: getScoreColor(attempt.score_percentage),
          marginBottom: '1rem'
        }}>
          {getPerformanceMessage(attempt.score_percentage)}
        </h2>

        <p style={{
          color: '#94A3B8',
          fontSize: '1rem'
        }}>
          You scored {attempt.correct_answers} out of {attempt.total_questions} questions correctly
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center'
        }}>
          <CheckCircle size={32} color="#10B981" style={{ marginBottom: '1rem' }} />
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#10B981',
            marginBottom: '0.5rem'
          }}>
            {attempt.correct_answers}
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Correct Answers
          </div>
        </div>

        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center'
        }}>
          <XCircle size={32} color="#EF4444" style={{ marginBottom: '1rem' }} />
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#EF4444',
            marginBottom: '0.5rem'
          }}>
            {attempt.answered_questions - attempt.correct_answers}
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Wrong Answers
          </div>
        </div>

        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid rgba(107, 114, 128, 0.3)',
          textAlign: 'center'
        }}>
          <Clock size={32} color="#6B7280" style={{ marginBottom: '1rem' }} />
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#6B7280',
            marginBottom: '0.5rem'
          }}>
            {attempt.total_questions - attempt.answered_questions}
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Unanswered
          </div>
        </div>

        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          textAlign: 'center'
        }}>
          <Target size={32} color="#3B82F6" style={{ marginBottom: '1rem' }} />
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#3B82F6',
            marginBottom: '0.5rem'
          }}>
            {attempt.answered_questions > 0 ? Math.round((attempt.correct_answers / attempt.answered_questions) * 100) : 0}%
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Accuracy
          </div>
        </div>
      </div>

      {/* Topic-wise Performance */}
      <div style={{
        backgroundColor: '#1E293B',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#F8FAFC',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <TrendingUp size={20} />
          Topic-wise Performance
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {Object.entries(topic_wise_performance).map(([topicId, performance]: [string, any]) => (
            <div
              key={topicId}
              style={{
                backgroundColor: '#0F172A',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#F8FAFC'
                }}>
                  {performance.topic_name}
                </h4>
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: getScoreColor(performance.accuracy)
                }}>
                  {performance.accuracy}%
                </span>
              </div>

              <div style={{
                marginBottom: '1rem',
                fontSize: '0.9rem',
                color: '#94A3B8'
              }}>
                {performance.correct_answers}/{performance.total_questions} questions correct
              </div>

              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#374151',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${performance.accuracy}%`,
                  height: '100%',
                  backgroundColor: getScoreColor(performance.accuracy),
                  borderRadius: '4px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty-wise Performance */}
      <div style={{
        backgroundColor: '#1E293B',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#F8FAFC',
          marginBottom: '1.5rem'
        }}>
          Difficulty-wise Analysis
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {Object.entries(difficulty_wise_performance).map(([difficulty, performance]) => (
            <div
              key={difficulty}
              style={{
                backgroundColor: '#0F172A',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: `1px solid ${
                  difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.3)' :
                  difficulty === 'Medium' ? 'rgba(249, 115, 22, 0.3)' :
                  'rgba(239, 68, 68, 0.3)'
                }`
              }}
            >
              <div style={{
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: difficulty === 'Easy' ? '#10B981' :
                         difficulty === 'Medium' ? '#F97316' : '#EF4444',
                  marginBottom: '0.5rem'
                }}>
                  {difficulty}
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#F8FAFC',
                  marginBottom: '0.5rem'
                }}>
                  {(performance as any).accuracy || 0}%
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#94A3B8'
                }}>
                  {(performance as any).accuracy || 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => startMockTest(selectedMockTest)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem 2rem',
            backgroundColor: '#3B82F6',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563EB';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3B82F6';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <RotateCcw size={18} />
          Retake Test
        </button>

        <button
          onClick={resetToSelection}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem 2rem',
            backgroundColor: '#10B981',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10B981';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Home size={18} />
          Back to Tests
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
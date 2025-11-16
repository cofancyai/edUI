import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, Trophy, Target, Eye } from 'lucide-react';

interface ResultsViewProps {
  aptitude: any;
  selectedLanguage: string;
  onBack: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  aptitude,
  selectedLanguage,
  onBack
}) => {
  const [showQuestions, setShowQuestions] = useState(false);
  
  const {
    questions,
    userAnswers
  } = aptitude;

  // Calculate results
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(userAnswers).length;
  const correctAnswers = questions.filter((q: any) => userAnswers[q.id] === q.correct_answer).length;
  const incorrectAnswers = answeredQuestions - correctAnswers;
  const unansweredQuestions = totalQuestions - answeredQuestions;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // Get score color
  const getScoreColor = () => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#3B82F6'; // Blue
    if (score >= 40) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  // Get performance message
  const getPerformanceMessage = () => {
    if (score >= 90) return 'Excellent! Outstanding performance!';
    if (score >= 80) return 'Great job! Very good performance!';
    if (score >= 70) return 'Good work! Above average performance!';
    if (score >= 60) return 'Not bad! Average performance!';
    if (score >= 40) return 'Needs improvement. Keep practicing!';
    return 'Requires more practice. Don\'t give up!';
  };

  // Show empty state if no questions
  if (!questions || questions.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#1E293B',
        borderRadius: '0.75rem',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#F8FAFC' }}>No Test Results</h3>
        <p style={{ marginBottom: '1.5rem', color: '#94A3B8' }}>
          No test data available to display results.
        </p>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem 1.5rem',
            backgroundColor: '#14B8A6',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#0F172A',
      color: '#F8FAFC',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#1E293B',
            color: '#14B8A6',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#F8FAFC',
          margin: 0
        }}>
          Test Results
        </h1>
      </div>

      {/* Score Card */}
      <div style={{
        padding: '2rem',
        backgroundColor: '#1E293B',
        borderRadius: '1rem',
        border: `2px solid ${getScoreColor()}`,
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        {/* Score Circle */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          margin: '0 auto 1.5rem',
          background: `conic-gradient(${getScoreColor()} 0deg, ${getScoreColor()} ${(score/100) * 360}deg, #374151 ${(score/100) * 360}deg, #374151 360deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: getScoreColor()
            }}>
              {score}%
            </div>
          </div>
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: getScoreColor(),
          marginBottom: '0.5rem'
        }}>
          {getPerformanceMessage()}
        </h2>

        <p style={{
          color: '#94A3B8',
          fontSize: '1rem'
        }}>
          You answered {correctAnswers} out of {totalQuestions} questions correctly
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Correct Answers */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#1E293B',
          borderRadius: '0.75rem',
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
            {correctAnswers}
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Correct
          </div>
        </div>

        {/* Incorrect Answers */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#1E293B',
          borderRadius: '0.75rem',
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
            {incorrectAnswers}
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Incorrect
          </div>
        </div>

        {/* Unanswered */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#1E293B',
          borderRadius: '0.75rem',
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
            {unansweredQuestions}
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Unanswered
          </div>
        </div>

        {/* Accuracy */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#1E293B',
          borderRadius: '0.75rem',
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
            {answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0}%
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Accuracy
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => setShowQuestions(!showQuestions)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem 1.5rem',
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
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3B82F6';
          }}
        >
          <Eye size={18} />
          {showQuestions ? 'Hide' : 'Review'} Questions
        </button>

        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem 1.5rem',
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
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10B981';
          }}
        >
          <Trophy size={18} />
          Take Another Test
        </button>
      </div>

      {/* Question Review */}
      {showQuestions && (
        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '0.75rem',
          padding: '2rem',
          border: '1px solid #374151'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#F8FAFC',
            marginBottom: '1.5rem'
          }}>
            Question Review
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {questions.map((question: any, index: number) => {
              const userAnswer = userAnswers[question.id];
              const isCorrect = userAnswer === question.correct_answer;
              const isAnswered = userAnswer !== undefined && userAnswer !== null;

              return (
                <div
                  key={question.id}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '#0F172A',
                    borderRadius: '0.5rem',
                    border: `2px solid ${
                      !isAnswered ? '#6B7280' : isCorrect ? '#10B981' : '#EF4444'
                    }`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      backgroundColor: !isAnswered ? '#6B7280' : isCorrect ? '#10B981' : '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F8FAFC',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>
                      {index + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: '#F8FAFC',
                        fontSize: '1rem',
                        lineHeight: 1.4,
                        marginBottom: '1rem'
                      }}>
                        {question.question_text}
                      </p>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Your Answer: </span>
                          <span style={{ 
                            color: !isAnswered ? '#6B7280' : isCorrect ? '#10B981' : '#EF4444',
                            fontWeight: 600
                          }}>
                            {isAnswered ? userAnswer : 'Not answered'}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Correct Answer: </span>
                          <span style={{ color: '#10B981', fontWeight: 600 }}>
                            {question.correct_answer}
                          </span>
                        </div>
                      </div>

                      {question.explanation && (
                        <div style={{
                          padding: '1rem',
                          backgroundColor: '#374151',
                          borderRadius: '0.5rem',
                          marginTop: '1rem'
                        }}>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#3B82F6',
                            marginBottom: '0.5rem'
                          }}>
                            Explanation:
                          </div>
                          <p style={{
                            color: '#F8FAFC',
                            fontSize: '0.9rem',
                            lineHeight: 1.4,
                            margin: 0
                          }}>
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView;
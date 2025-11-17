import React from 'react';
import { Pause, Clock, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface TestInterfaceProps {
  mockTest: any;
  selectedLanguage: string;
}

const TestInterface: React.FC<TestInterfaceProps> = ({ mockTest, selectedLanguage }) => {
  const {
    questions,
    currentQuestionIndex,
    userAnswers,
    timeRemaining,
    selectedMockTest,
    getCurrentQuestion,
    getCurrentAnswer,
    answerQuestion,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    pauseTest,
    handleSubmitTest,
    getProgressStats,
    formatTimeRemaining,
    canSubmitTest,
    isLoading
  } = mockTest;

  const [showPalette, setShowPalette] = React.useState(false);

  const currentQuestion = getCurrentQuestion();
  const currentAnswer = getCurrentAnswer();
  const progressStats = getProgressStats();

  if (!currentQuestion) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#F8FAFC'
      }}>
        Loading question...
      </div>
    );
  }

  const handleOptionSelect = (optionId: string) => {
    answerQuestion(currentQuestion.id, optionId);
  };

  const getTimeColor = () => {
    if (timeRemaining > 1800) return '#10B981'; // Green (30+ minutes)
    if (timeRemaining > 600) return '#F59E0B'; // Yellow (10+ minutes)
    return '#EF4444'; // Red (< 10 minutes)
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
      minHeight: '100vh',
      color: '#F8FAFC'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '1.25rem',
        padding: '2rem 2.5rem',
        marginBottom: '3rem',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#F8FAFC',
              marginBottom: '0.5rem'
            }}>
              Mock Test {selectedMockTest}
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#94A3B8'
              }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <div style={{
                width: '150px',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <span style={{
                fontSize: '0.85rem',
                color: '#64748B',
                fontWeight: '500'
              }}>
                {progressStats.answeredQuestions} answered
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: timeRemaining < 600 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              border: `1px solid ${timeRemaining < 600 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
            }}>
              <Clock size={18} color={getTimeColor()} />
              <span style={{
                color: getTimeColor(),
                fontWeight: 600,
                fontSize: '1.1rem',
                fontFamily: 'monospace'
              }}>
                {formatTimeRemaining()}
              </span>
            </div>

            <button
              onClick={pauseTest}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#F59E0B',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              <Pause size={16} />
              Pause
            </button>

            <button
              onClick={() => setShowPalette(!showPalette)}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.25rem',
                color: '#3B82F6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <BookOpen size={16} />
              {showPalette ? 'Hide' : 'Show'} All
            </button>
          </div>
        </div>
      </div>

      {/* Question Palette (collapsible) */}
      {showPalette && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '1.25rem',
          padding: '2rem',
          marginBottom: '3rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
            gap: '0.75rem',
            maxHeight: '250px',
            overflowY: 'auto',
            padding: '0.5rem'
          }}>
            {questions.map((question: any, index: number) => {
              const isAnswered = !!userAnswers[question.id];
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={question.id}
                  onClick={() => goToQuestion(index)}
                  style={{
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: isCurrent ? '600' : '500',
                    border: isCurrent ? '2px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)',
                    background:
                      isCurrent ? 'rgba(59, 130, 246, 0.2)' :
                      isAnswered ? 'rgba(16, 185, 129, 0.15)' :
                      'rgba(255, 255, 255, 0.05)',
                    color:
                      isCurrent ? '#3B82F6' :
                      isAnswered ? '#10B981' :
                      '#94A3B8',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div style={{
            display: 'flex',
            gap: '2rem',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.85rem',
            color: '#94A3B8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '0.25rem', background: 'rgba(59, 130, 246, 0.2)', border: '2px solid #3B82F6' }}></div>
              Current
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '0.25rem', background: 'rgba(16, 185, 129, 0.15)' }}></div>
              Answered
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '0.25rem', background: 'rgba(255, 255, 255, 0.05)' }}></div>
              Not Visited
            </div>
          </div>
        </div>
      )}

      {/* ONE QUESTION AT A TIME - Main Question Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '1.25rem',
        padding: '3rem',
        marginBottom: '2.5rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        minHeight: '500px'
      }}>
        {/* Question Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            fontSize: '0.85rem'
          }}>
            <span style={{
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              fontWeight: '500'
            }}>
              {currentQuestion.topic}
            </span>
            <span style={{ color: '#64748B', fontSize: '0.9rem' }}>
              {currentQuestion.subtopic}
            </span>
          </div>
          <div style={{
            background:
              currentQuestion.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.1)' :
              currentQuestion.difficulty === 'Medium' ? 'rgba(251, 191, 36, 0.1)' :
              'rgba(239, 68, 68, 0.1)',
            color:
              currentQuestion.difficulty === 'Easy' ? '#10B981' :
              currentQuestion.difficulty === 'Medium' ? '#FBBF24' :
              '#EF4444',
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            {currentQuestion.difficulty}
          </div>
        </div>

        {/* Question Text */}
        <div style={{
          fontSize: '1.25rem',
          lineHeight: 2,
          color: '#F8FAFC',
          marginBottom: '3rem',
          fontWeight: '400',
          letterSpacing: '0.01em'
        }}>
          {currentQuestion.question}
        </div>

        {/* Options */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {currentQuestion.options.map((option: string, index: number) => {
            const optionId = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = currentAnswer === optionId;

            return (
              <button
                key={optionId}
                onClick={() => handleOptionSelect(optionId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  padding: '1.75rem 2rem',
                  background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: `2px solid ${isSelected ? '#3B82F6' : 'rgba(255, 255, 255, 0.05)'}`,
                  borderRadius: '1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <div style={{
                  minWidth: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: '600',
                  background: isSelected ? '#3B82F6' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? 'white' : '#94A3B8',
                  transition: 'all 0.2s'
                }}>
                  {optionId}
                </div>
                <span style={{
                  color: '#F8FAFC',
                  fontSize: '1.1rem',
                  flex: 1,
                  lineHeight: 1.8
                }}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '1.25rem',
        padding: '2rem 2.5rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        <button
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 2rem',
            background: currentQuestionIndex === 0 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(59, 130, 246, 0.1)',
            color: currentQuestionIndex === 0 ? '#475569' : '#3B82F6',
            border: `1px solid ${currentQuestionIndex === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.2)'}`,
            borderRadius: '1rem',
            cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        <div style={{
          display: 'flex',
          gap: '1rem'
        }}>
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={nextQuestion}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 2rem',
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3B82F6',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '1rem',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
            >
              Next
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmitTest}
              disabled={!canSubmitTest() || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 2.5rem',
                background: canSubmitTest() && !isLoading
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                color: canSubmitTest() && !isLoading ? '#F8FAFC' : '#475569',
                border: 'none',
                borderRadius: '1rem',
                cursor: canSubmitTest() && !isLoading ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                opacity: isLoading ? 0.7 : 1,
                fontSize: '1rem',
                boxShadow: canSubmitTest() && !isLoading ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <CheckCircle size={20} />
              {isLoading ? 'Submitting...' : 'Submit Test'}
            </button>
          )}
        </div>
      </div>

      {/* Warning for incomplete test */}
      {progressStats.remainingQuestions > 0 && currentQuestionIndex === questions.length - 1 && (
        <div style={{
          padding: '1.5rem 2rem',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <AlertTriangle size={24} color="#F97316" />
          <div style={{ color: '#F97316', fontSize: '0.95rem', lineHeight: 1.6 }}>
            <strong>{progressStats.remainingQuestions} question(s) remaining unanswered.</strong>
            <br />
            You can submit now or go back to answer them.
          </div>
        </div>
      )}
    </div>
  );
};

export default TestInterface;

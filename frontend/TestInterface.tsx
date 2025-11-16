import React from 'react';
import { Pause, Clock, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

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
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1.5rem',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#1E293B',
        borderRadius: '0.75rem',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#F8FAFC',
            marginBottom: '0.25rem'
          }}>
            Mock Test {selectedMockTest}
          </h1>
          <div style={{
            fontSize: '0.9rem',
            color: '#94A3B8'
          }}>
            Question {currentQuestionIndex + 1} of {questions.length}
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
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#0F172A',
            borderRadius: '0.5rem',
            border: `1px solid ${getTimeColor()}40`
          }}>
            <Clock size={18} color={getTimeColor()} />
            <span style={{
              color: getTimeColor(),
              fontWeight: 600,
              fontSize: '1rem'
            }}>
              {formatTimeRemaining()}
            </span>
          </div>
          
          <button
            onClick={pauseTest}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#F59E0B',
              color: '#F8FAFC',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Pause size={16} />
            Pause
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          fontSize: '0.9rem',
          color: '#94A3B8'
        }}>
          <span>Progress: {progressStats.answeredQuestions}/{progressStats.totalQuestions} answered</span>
          <span>{progressStats.progressPercentage}% complete</span>
        </div>
        <div style={{
          width: '100%',
          height: '0.5rem',
          backgroundColor: '#374151',
          borderRadius: '0.25rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressStats.progressPercentage}%`,
            height: '100%',
            backgroundColor: '#3B82F6',
            borderRadius: '0.25rem',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Question Content */}
      <div style={{
        backgroundColor: '#1E293B',
        borderRadius: '0.75rem',
        padding: '2rem',
        marginBottom: '2rem',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        {/* Question Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #374151'
        }}>
          <div>
            <span style={{
              fontSize: '0.9rem',
              color: '#94A3B8'
            }}>
              {currentQuestion.topic} â€¢ {currentQuestion.subtopic}
            </span>
          </div>
          <div style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: currentQuestion.difficulty === 'Easy' 
              ? 'rgba(16, 185, 129, 0.1)' 
              : currentQuestion.difficulty === 'Medium' 
                ? 'rgba(249, 115, 22, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)',
            color: currentQuestion.difficulty === 'Easy' 
              ? '#10B981' 
              : currentQuestion.difficulty === 'Medium' 
                ? '#F97316' 
                : '#EF4444',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: 500
          }}>
            {currentQuestion.difficulty}
          </div>
        </div>

        {/* Question Text */}
        <div style={{
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.2rem',
            lineHeight: 1.6,
            color: '#F8FAFC',
            margin: 0,
            fontWeight: 500,
            whiteSpace: 'pre-wrap'
          }}>
            {currentQuestion.question}
          </h2>
        </div>

        {/* Options */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
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
                  gap: '1rem',
                  padding: '1rem 1.5rem',
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#0F172A',
                  border: `2px solid ${isSelected ? '#3B82F6' : '#374151'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                    e.currentTarget.style.borderColor = '#3B82F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#0F172A';
                    e.currentTarget.style.borderColor = '#374151';
                  }
                }}
              >
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? '#3B82F6' : 'transparent',
                  border: `2px solid ${isSelected ? '#3B82F6' : '#94A3B8'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isSelected ? '#F8FAFC' : '#94A3B8'
                }}>
                  {optionId}
                </div>
                <span style={{
                  color: isSelected ? '#3B82F6' : '#F8FAFC',
                  fontSize: '1rem',
                  flex: 1
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <button
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: currentQuestionIndex === 0 ? '#374151' : '#1E293B',
            color: currentQuestionIndex === 0 ? '#9CA3AF' : '#F8FAFC',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 500
          }}
        >
          <ChevronLeft size={18} />
          Previous
        </button>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={nextQuestion}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmitTest}
              disabled={!canSubmitTest() || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: canSubmitTest() && !isLoading ? '#10B981' : '#374151',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: canSubmitTest() && !isLoading ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <CheckCircle size={18} />
              {isLoading ? 'Submitting...' : 'Submit Test'}
            </button>
          )}
        </div>
      </div>

      {/* Question Palette */}
      <div style={{
        backgroundColor: '#1E293B',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: '#F8FAFC',
          marginBottom: '1rem'
        }}>
          Question Palette
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1rem'
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
                  backgroundColor: isCurrent
                    ? '#3B82F6'
                    : isAnswered
                      ? '#10B981'
                      : '#374151',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#F8FAFC',
                  fontWeight: isCurrent ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.backgroundColor = isAnswered ? '#059669' : '#4B5563';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.backgroundColor = isAnswered ? '#10B981' : '#374151';
                  }
                }}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#94A3B8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '1rem',
              height: '1rem',
              backgroundColor: '#3B82F6',
              borderRadius: '0.25rem'
            }} />
            Current
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '1rem',
              height: '1rem',
              backgroundColor: '#10B981',
              borderRadius: '0.25rem'
            }} />
            Answered
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '1rem',
              height: '1rem',
              backgroundColor: '#374151',
              borderRadius: '0.25rem'
            }} />
            Not Visited
          </div>
        </div>
      </div>

      {/* Warning for incomplete test */}
      {progressStats.remainingQuestions > 0 && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertTriangle size={20} color="#F97316" />
          <div style={{ color: '#F97316', fontSize: '0.9rem' }}>
            {progressStats.remainingQuestions} question(s) remaining. 
            You can submit the test now or continue answering.
          </div>
        </div>
      )}

      {/* Quick Submit Button */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 1000
      }}>
        <button
          onClick={handleSubmitTest}
          disabled={!canSubmitTest() || isLoading}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: canSubmitTest() && !isLoading ? '#10B981' : '#374151',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: canSubmitTest() && !isLoading ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: isLoading ? 0.7 : 1,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (canSubmitTest() && !isLoading) {
              e.currentTarget.style.backgroundColor = '#059669';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (canSubmitTest() && !isLoading) {
              e.currentTarget.style.backgroundColor = '#10B981';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <CheckCircle size={18} />
          {isLoading ? 'Submitting...' : 'Submit Test'}
        </button>
      </div>
    </div>
  );
};

export default TestInterface;
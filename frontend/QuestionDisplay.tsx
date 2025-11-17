import React, { useState, useEffect } from 'react';
import { Flag, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Question } from '../../../types/examBot.types';

interface QuestionDisplayProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  userAnswer?: string;
  timeRemaining?: number;
  onSubmitAnswer: (answer: string) => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onJumpToQuestion: (index: number) => void;
  onEndTest: () => void;
  isAnswered: (index: number) => boolean;
  isFlagged?: (index: number) => boolean;
  onFlagQuestion?: (index: number) => void;
  onUnflagQuestion?: (index: number) => void;
  reviewMode?: boolean;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  currentIndex,
  totalQuestions,
  userAnswer,
  timeRemaining,
  onSubmitAnswer,
  onNextQuestion,
  onPrevQuestion,
  onJumpToQuestion,
  onEndTest,
  isAnswered,
  isFlagged = () => false,
  onFlagQuestion = () => {},
  onUnflagQuestion = () => {},
  reviewMode = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(userAnswer);
  const [showExplanation, setShowExplanation] = useState(reviewMode);
  const [showPalette, setShowPalette] = useState(false);

  // Reset selected option when question changes
  useEffect(() => {
    setSelectedOption(userAnswer);
    setShowExplanation(reviewMode);
  }, [question, userAnswer, reviewMode]);

  const handleOptionSelect = (option: string) => {
    if (reviewMode) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (selectedOption && !reviewMode) {
      onSubmitAnswer(selectedOption);
    }
  };

  // Format time remaining
  const formatTime = (seconds?: number): string => {
    if (seconds === undefined) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get the correct letter from index (0 -> A, 1 -> B, etc.)
  const getOptionLetter = (index: number): string => {
    return String.fromCharCode(65 + index);
  };

  const isCorrect = reviewMode && userAnswer === question.answer;
  const isIncorrect = reviewMode && userAnswer !== undefined && userAnswer !== question.answer;

  const toggleFlag = () => {
    if (isFlagged(currentIndex)) {
      onUnflagQuestion(currentIndex);
    } else {
      onFlagQuestion(currentIndex);
    }
  };

  // Calculate progress stats
  const answeredCount = Array.from({ length: totalQuestions }).filter((_, idx) => isAnswered(idx)).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '1rem',
      color: '#F8FAFC'
    }}>
      {/* Clean Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Left: Question Info */}
          <div>
            <div style={{
              fontSize: '0.85rem',
              color: '#94A3B8',
              marginBottom: '0.25rem'
            }}>
              Question {currentIndex + 1} of {totalQuestions}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '120px',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <span style={{
                fontSize: '0.8rem',
                color: '#64748B',
                fontWeight: '500'
              }}>
                {answeredCount} answered
              </span>
            </div>
          </div>

          {/* Right: Timer and Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {!reviewMode && timeRemaining !== undefined && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: timeRemaining < 60 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: `1px solid ${timeRemaining < 60 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
              }}>
                <Clock size={16} color={timeRemaining < 60 ? '#EF4444' : '#3B82F6'} />
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  color: timeRemaining < 60 ? '#EF4444' : '#3B82F6'
                }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}

            <button
              onClick={() => setShowPalette(!showPalette)}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                color: '#3B82F6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
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
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))',
            gap: '0.5rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const answered = isAnswered(idx);
              const flagged = isFlagged(idx);
              const current = currentIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => onJumpToQuestion(idx)}
                  style={{
                    width: '45px',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: current ? '600' : '500',
                    border: current ? '2px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)',
                    background:
                      current ? 'rgba(59, 130, 246, 0.2)' :
                      flagged ? 'rgba(239, 68, 68, 0.15)' :
                      answered ? 'rgba(16, 185, 129, 0.15)' :
                      'rgba(255, 255, 255, 0.05)',
                    color:
                      current ? '#3B82F6' :
                      flagged ? '#EF4444' :
                      answered ? '#10B981' :
                      '#94A3B8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!current) {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!current) {
                      e.currentTarget.style.background =
                        flagged ? 'rgba(239, 68, 68, 0.15)' :
                        answered ? 'rgba(16, 185, 129, 0.15)' :
                        'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {idx + 1}
                  {flagged && !reviewMode && (
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#EF4444'
                    }}></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.75rem',
            color: '#94A3B8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '0.25rem', background: 'rgba(59, 130, 246, 0.2)', border: '2px solid #3B82F6' }}></div>
              Current
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '0.25rem', background: 'rgba(16, 185, 129, 0.15)' }}></div>
              Answered
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '0.25rem', background: 'rgba(239, 68, 68, 0.15)' }}></div>
              Flagged
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '0.25rem', background: 'rgba(255, 255, 255, 0.05)' }}></div>
              Not Visited
            </div>
          </div>
        </div>
      )}

      {/* Question Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {/* Question Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            fontSize: '0.8rem'
          }}>
            <span style={{
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.5rem',
              fontWeight: '500'
            }}>
              {question.topic}
            </span>
            <span style={{ color: '#64748B' }}>
              {question.year}
            </span>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <span style={{
              background:
                question.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.1)' :
                question.difficulty === 'Medium' ? 'rgba(251, 191, 36, 0.1)' :
                'rgba(239, 68, 68, 0.1)',
              color:
                question.difficulty === 'Easy' ? '#10B981' :
                question.difficulty === 'Medium' ? '#FBBF24' :
                '#EF4444',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {question.difficulty}
            </span>
            {!reviewMode && (
              <button
                onClick={toggleFlag}
                style={{
                  background: isFlagged(currentIndex) ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  color: isFlagged(currentIndex) ? '#EF4444' : '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                title={isFlagged(currentIndex) ? "Remove flag" : "Flag for review"}
              >
                <Flag size={16} fill={isFlagged(currentIndex) ? '#EF4444' : 'none'} />
              </button>
            )}
          </div>
        </div>

        {/* Question Text */}
        <div style={{
          fontSize: '1.15rem',
          lineHeight: 1.7,
          color: '#F8FAFC',
          marginBottom: '2rem',
          fontWeight: '400'
        }}>
          {question.question}
        </div>

        {/* Options */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {question.options.map((option, idx) => {
            const letter = getOptionLetter(idx);
            const isSelected = selectedOption === letter;
            const isCorrectAnswer = reviewMode && letter === question.answer;
            const isWrongAnswer = reviewMode && userAnswer === letter && letter !== question.answer;

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(letter)}
                disabled={reviewMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem 1.5rem',
                  background:
                    isCorrectAnswer ? 'rgba(16, 185, 129, 0.1)' :
                    isWrongAnswer ? 'rgba(239, 68, 68, 0.1)' :
                    isSelected ? 'rgba(59, 130, 246, 0.1)' :
                    'rgba(255, 255, 255, 0.03)',
                  border: `2px solid ${
                    isCorrectAnswer ? '#10B981' :
                    isWrongAnswer ? '#EF4444' :
                    isSelected ? '#3B82F6' :
                    'rgba(255, 255, 255, 0.05)'
                  }`,
                  borderRadius: '0.75rem',
                  cursor: reviewMode ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (!reviewMode && !isSelected) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!reviewMode && !isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                <div style={{
                  minWidth: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  background:
                    isCorrectAnswer ? '#10B981' :
                    isWrongAnswer ? '#EF4444' :
                    isSelected ? '#3B82F6' :
                    'rgba(255, 255, 255, 0.05)',
                  color:
                    isCorrectAnswer || isWrongAnswer || isSelected ? 'white' : '#94A3B8',
                  transition: 'all 0.2s'
                }}>
                  {isCorrectAnswer ? (
                    <CheckCircle size={18} />
                  ) : isWrongAnswer ? (
                    <XCircle size={18} />
                  ) : (
                    letter
                  )}
                </div>
                <span style={{
                  color: '#F8FAFC',
                  fontSize: '1rem',
                  flex: 1
                }}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation (Review Mode) */}
        {reviewMode && question.detailed_explanation && (
          <div style={{ marginTop: '2rem' }}>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              style={{
                width: '100%',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '0.75rem',
                padding: '1rem 1.5rem',
                color: '#8B5CF6',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.95rem',
                fontWeight: '500',
                marginBottom: showExplanation ? '1rem' : '0'
              }}
            >
              <span>{showExplanation ? 'Hide Explanation' : 'View Explanation'}</span>
              <span style={{ fontSize: '1.2rem' }}>{showExplanation ? '−' : '+'}</span>
            </button>

            {showExplanation && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.1)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                color: '#CBD5E1'
              }}>
                <div style={{
                  fontWeight: '600',
                  color: '#8B5CF6',
                  marginBottom: '0.75rem',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Explanation
                </div>
                <div>{question.detailed_explanation}</div>

                {question.tags && question.tags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(139, 92, 246, 0.1)'
                  }}>
                    {question.tags.map((tag, index) => (
                      <span key={index} style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#A78BFA'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          onClick={onPrevQuestion}
          disabled={currentIndex === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: currentIndex === 0 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(59, 130, 246, 0.1)',
            color: currentIndex === 0 ? '#475569' : '#3B82F6',
            border: `1px solid ${currentIndex === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.2)'}`,
            borderRadius: '0.75rem',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (currentIndex !== 0) {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentIndex !== 0) {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            }
          }}
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        <div style={{
          display: 'flex',
          gap: '0.75rem'
        }}>
          {!reviewMode && !isAnswered(currentIndex) && selectedOption && (
            <button
              onClick={handleSubmit}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
            >
              Submit Answer
            </button>
          )}

          {currentIndex === totalQuestions - 1 ? (
            <button
              onClick={onEndTest}
              style={{
                padding: '0.75rem 1.5rem',
                background: reviewMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: reviewMode ? '#10B981' : '#EF4444',
                border: `1px solid ${reviewMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                borderRadius: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = reviewMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = reviewMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
              }}
            >
              {reviewMode ? 'Finish Review' : 'End Test'}
            </button>
          ) : (
            <button
              onClick={onNextQuestion}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3B82F6',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              }}
            >
              Next
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function for getting answers in review mode
const getUserAnswerForQuestion = (currentQuestion: Question, index: number): string => {
  // This is a stub - you'll need to implement this properly in the component
  // by passing the correct data to access answers for different questions
  return '';
};

export default QuestionDisplay;

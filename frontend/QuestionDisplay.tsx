import React, { useState, useEffect } from 'react';
import { Flag, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
  
  // Reset selected option when question changes
  useEffect(() => {
    setSelectedOption(userAnswer);
    setShowExplanation(reviewMode);
  }, [question, userAnswer, reviewMode]);
  
  const handleOptionSelect = (option: string) => {
    if (reviewMode) return; // Don't allow changes in review mode
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      color: '#EDEDED'
    }}>
      {/* Top navigation bar with question numbers */}
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '0.75rem 0.75rem 0 0',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {/* Header with timer and progress */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#FFF8DC' }}>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <div style={{
              width: '100px',
              height: '6px',
              background: '#1a1a4e',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #B19CD9, #FFD700)',
                borderRadius: '3px'
              }}></div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {!reviewMode && (
              <button
                onClick={toggleFlag}
                title={isFlagged(currentIndex) ? "Unflag this question" : "Flag this question for review later"}
                style={{
                  background: isFlagged(currentIndex) ? 'rgba(231, 76, 60, 0.2)' : 'transparent',
                  border: isFlagged(currentIndex) ? '1px solid #e74c3c' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.25rem',
                  padding: '0.4rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: isFlagged(currentIndex) ? '#e74c3c' : '#B19CD9',
                  cursor: 'pointer'
                }}
              >
                <Flag size={16} />
                <span style={{ fontSize: '0.8rem' }}>
                  {isFlagged(currentIndex) ? 'Flagged' : 'Flag'}
                </span>
              </button>
            )}
            
            {!reviewMode && timeRemaining !== undefined && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: timeRemaining < 60 ? 'rgba(231, 76, 60, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: timeRemaining < 60 ? '1px solid #e74c3c' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.25rem',
                padding: '0.4rem 0.75rem'
              }}>
                <Clock size={16} color={timeRemaining < 60 ? '#e74c3c' : '#B19CD9'} />
                <span style={{ 
                  fontFamily: 'monospace', 
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  color: timeRemaining < 60 ? '#e74c3c' : '#FFD700'
                }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Question navigation bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'center',
          maxHeight: '150px',
          overflowY: 'auto',
          padding: '0.5rem'
        }}>
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onJumpToQuestion(idx)}
              title={isFlagged(idx) ? "Flagged question" : isAnswered(idx) ? "Answered" : "Unanswered"}
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                border: 'none',
                background: 
                  currentIndex === idx ? '#FFD700' :
                  isFlagged(idx) ? 'rgba(231, 76, 60, 0.7)' :
                  reviewMode && isAnswered(idx) && 
                    question.answer === getUserAnswerForQuestion(question, idx) ? 'rgba(39, 174, 96, 0.7)' :
                  reviewMode && isAnswered(idx) ? 'rgba(231, 76, 60, 0.7)' :
                  isAnswered(idx) ? 'rgba(255, 215, 0, 0.3)' :
                  'rgba(255, 255, 255, 0.1)',
                color: 
                  currentIndex === idx ? '#2E1A47' :
                  reviewMode && isAnswered(idx) && 
                    question.answer === getUserAnswerForQuestion(question, idx) ? 'white' :
                  isAnswered(idx) ? '#FFD700' :
                  '#EDEDED',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {idx + 1}
              {isFlagged(idx) && !reviewMode && (
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#e74c3c'
                }}></div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main question content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
        borderRadius: '0 0 0.75rem 0.75rem',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'auto'
      }}>
        {/* Question metadata */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          color: '#B19CD9',
          marginBottom: '1rem'
        }}>
          <div>
            <span style={{ marginRight: '1.5rem' }}>
              Topic: {question.topic}
            </span>
            <span>
              Year: {question.year}
            </span>
          </div>
          <div>
            <span style={{
              background: 
                question.difficulty === 'Easy' ? 'rgba(39, 174, 96, 0.2)' :
                question.difficulty === 'Medium' ? 'rgba(243, 156, 18, 0.2)' :
                'rgba(231, 76, 60, 0.2)',
              color:
                question.difficulty === 'Easy' ? '#27ae60' :
                question.difficulty === 'Medium' ? '#f39c12' :
                '#e74c3c',
              padding: '0.2rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {question.difficulty}
            </span>
          </div>
        </div>
        
        {/* Question text */}
        <div style={{
          marginBottom: '1.5rem',
          fontSize: '1.1rem',
          lineHeight: 1.6,
          color: '#FFF8DC'
        }}>
          {question.question}
        </div>
        
        {/* Options */}
        <div style={{ flex: 1, marginBottom: '1.5rem' }}>
          {question.options.map((option, idx) => (
            <div
              key={idx}
              onClick={() => handleOptionSelect(getOptionLetter(idx))}
              style={{
                padding: '1rem',
                marginBottom: '0.75rem',
                background: 
                  reviewMode && getOptionLetter(idx) === question.answer ? 'rgba(39, 174, 96, 0.2)' :
                  reviewMode && userAnswer === getOptionLetter(idx) && userAnswer !== question.answer ? 'rgba(231, 76, 60, 0.2)' :
                  selectedOption === getOptionLetter(idx) ? 'rgba(255, 215, 0, 0.15)' : 
                  'rgba(255, 255, 255, 0.05)',
                border: 
                  reviewMode && getOptionLetter(idx) === question.answer ? '1px solid #27ae60' :
                  reviewMode && userAnswer === getOptionLetter(idx) && userAnswer !== question.answer ? '1px solid #e74c3c' :
                  selectedOption === getOptionLetter(idx) ? '1px solid #FFD700' : 
                  '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                cursor: reviewMode ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                background: 
                  reviewMode && getOptionLetter(idx) === question.answer ? '#27ae60' :
                  reviewMode && userAnswer === getOptionLetter(idx) && userAnswer !== question.answer ? '#e74c3c' :
                  selectedOption === getOptionLetter(idx) ? '#FFD700' : 
                  'transparent',
                border: 
                  reviewMode && (getOptionLetter(idx) === question.answer || userAnswer === getOptionLetter(idx)) ? 'none' :
                  '1px solid #B19CD9',
                color: 
                  reviewMode && (getOptionLetter(idx) === question.answer || userAnswer === getOptionLetter(idx)) ? 'white' :
                  selectedOption === getOptionLetter(idx) ? '#2E1A47' : 
                  '#B19CD9'
              }}>
                {reviewMode && getOptionLetter(idx) === question.answer ? (
                  <CheckCircle size={16} />
                ) : reviewMode && userAnswer === getOptionLetter(idx) && userAnswer !== question.answer ? (
                  <XCircle size={16} />
                ) : (
                  getOptionLetter(idx)
                )}
              </div>
              <div>{option}</div>
            </div>
          ))}
        </div>
        
        {/* Explanation (in review mode) */}
        {reviewMode && (
          <div>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              style={{
                background: 'transparent',
                border: '1px solid #B19CD9',
                color: '#B19CD9',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: showExplanation ? '1rem' : 0
              }}
            >
              <span>{showExplanation ? 'Hide Explanation' : 'Show Explanation'}</span>
              <span>{showExplanation ? 'â–²' : 'â–¼'}</span>
            </button>
            
            {showExplanation && (
              <div style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                lineHeight: 1.6
              }}>
                <div style={{
                  marginBottom: '0.75rem',
                  fontWeight: 'bold',
                  color: '#FFD700'
                }}>
                  Explanation:
                </div>
                <div>
                  {question.detailed_explanation}
                </div>
                <div style={{
                  marginTop: '1rem',
                  fontSize: '0.85rem',
                  color: '#B19CD9'
                }}>
                  {question.tags && question.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginTop: '0.5rem'
                    }}>
                      {question.tags.map((tag, index) => (
                        <span key={index} style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Navigation buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '1rem'
        }}>
          <button
            onClick={onPrevQuestion}
            disabled={currentIndex === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: currentIndex === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              color: currentIndex === 0 ? '#666' : '#EDEDED',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>
          
          <div>
            {!reviewMode && !isAnswered(currentIndex) && (
              <button
                onClick={handleSubmit}
                disabled={!selectedOption}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !selectedOption ? 'rgba(255, 215, 0, 0.3)' : 'linear-gradient(45deg, #B19CD9, #FFD700)',
                  color: !selectedOption ? '#999' : '#2E1A47',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: !selectedOption ? 'not-allowed' : 'pointer',
                  marginRight: '0.5rem'
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
                  background: 'linear-gradient(45deg, #B19CD9, #FFD700)',
                  color: '#2E1A47',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer'
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
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#EDEDED',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <span>Next</span>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
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
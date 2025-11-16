import * as React from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import RefreshButton from '../shared/RefreshButton';
import LoadingIndicator from '../shared/LoadingIndicator';
import ErrorMessage from '../shared/ErrorMessage';
import { QuizQuestion, QuizAnswer } from '../../../types/quiz.types';
import { getLanguageFont, getExplanationTranslations } from '../../../utils/formatUtils';

interface QuizTabProps {
  quizQuestions: QuizQuestion[];
  quizAnswers: QuizAnswer[];
  currentQuizQuestionIdx: number;
  showExplanation: boolean;
  quizCompleted: boolean;
  quizLoading: boolean;
  quizError: string | null;
  selectedDifficulty: 'easy' | 'medium' | 'hard';
  selectedLanguage: string;
  handleGenerateQuiz: () => Promise<void>;
  handleQuizAnswer: (selectedOptionIdx: number) => void;
  handleNextQuestion: () => void;
  handlePreviousQuestion: () => void;
  resetQuiz: () => void;
  setSelectedDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

const QuizTab: React.FC<QuizTabProps> = ({
  quizQuestions,
  quizAnswers,
  currentQuizQuestionIdx,
  showExplanation,
  quizCompleted,
  quizLoading,
  quizError,
  selectedDifficulty,
  selectedLanguage,
  handleGenerateQuiz,
  handleQuizAnswer,
  handleNextQuestion,
  handlePreviousQuestion,
  resetQuiz,
  setSelectedDifficulty
}) => {
  const explanationTranslations = getExplanationTranslations();

  // Always visible difficulty selector and controls
  const QuizControls = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '1.5rem',
      padding: '1rem',
      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
      borderRadius: '0.75rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ 
          color: '#FFD700', 
          fontWeight: '600',
          fontSize: '1rem'
        }}>
          Difficulty:
        </span>
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#EDEDED',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}
        >
          <option value="easy" style={{ background: '#2E1A47', color: '#EDEDED' }}>
            Easy
          </option>
          <option value="medium" style={{ background: '#2E1A47', color: '#EDEDED' }}>
            Medium
          </option>
          <option value="hard" style={{ background: '#2E1A47', color: '#EDEDED' }}>
            Hard
          </option>
        </select>
        {quizQuestions.length > 0 && (
          <span style={{ 
            color: '#B19CD9', 
            fontSize: '0.9rem',
            marginLeft: '0.5rem'
          }}>
            Current: {selectedDifficulty}
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {quizQuestions.length > 0 && (
          <button
            onClick={resetQuiz}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 215, 0, 0.1)',
              color: '#FFD700',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
            }}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        )}
        <RefreshButton
          onClick={handleGenerateQuiz}
          isLoading={quizLoading}
          title={quizQuestions.length > 0 ? "New Quiz" : "Generate Quiz"}
        />
      </div>
    </div>
  );

  // Loading state
  if (quizLoading) {
    return (
      <div style={{ padding: '1rem' }}>
        <QuizControls />
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '3rem 1rem',
          textAlign: 'center'
        }}>
          <LoadingIndicator 
            message={`Generating ${selectedDifficulty} quiz questions...`}
            subMessage="This may take a few moments" 
          />
        </div>
      </div>
    );
  }

  // Empty state (no quiz questions)
  if (!quizQuestions.length) {
    return (
      <div style={{ padding: '1rem' }}>
        <QuizControls />
        
        {quizError && (
          <div style={{ marginBottom: '1.5rem' }}>
            <ErrorMessage message={quizError} />
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '3rem 1rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(177, 156, 217, 0.3)'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem',
            opacity: 0.7
          }}>
            ðŸ§ 
          </div>
          <h3 style={{ 
            color: '#2E1A47', 
            marginBottom: '1rem',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            Ready to Test Your Knowledge?
          </h3>
          <p style={{ 
            color: '#666', 
            marginBottom: '1.5rem',
            fontSize: '1rem',
            lineHeight: '1.5'
          }}>
            Select your preferred difficulty level above and click "Generate Quiz" to start your learning journey.
          </p>
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            color: '#B8860B',
            fontSize: '0.9rem'
          }}>
            ðŸ’¡ <strong>Tip:</strong> Make sure you have some content generated first for better quiz questions!
          </div>
        </div>
      </div>
    );
  }

  // Quiz completed state
  if (quizCompleted) {
    const correctCount = quizAnswers.filter((answer) => answer.isCorrect).length;
    const percentage = Math.round((correctCount / quizQuestions.length) * 100);
    
    return (
      <div style={{ padding: '1rem' }}>
        <QuizControls />
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(177, 156, 217, 0.3)'
        }}>
          <h3 style={{ 
            color: '#2E1A47', 
            marginBottom: '1.5rem',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}>
            Quiz Results ({selectedDifficulty} difficulty)
          </h3>
          
          {/* Score Circle */}
          <div
            style={{
              height: '150px',
              width: '150px',
              borderRadius: '50%',
              background: `conic-gradient(#FFD700 0% ${percentage}%, #4a3063 ${percentage}% 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                height: '130px',
                width: '130px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}
            >
              <span style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: percentage >= 70 ? '#FFD700' : '#EDEDED' 
              }}>
                {percentage}%
              </span>
              <span style={{ 
                fontSize: '0.8rem', 
                color: '#B19CD9',
                marginTop: '0.25rem'
              }}>
                Score
              </span>
            </div>
          </div>

          {/* Results Summary */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ 
              color: '#2E1A47', 
              marginBottom: '0.5rem',
              fontSize: '1.1rem'
            }}>
              You answered <span style={{ color: '#FFD700', fontWeight: '600' }}>{correctCount}</span> out of{' '}
              <span style={{ color: '#FFD700', fontWeight: '600' }}>{quizQuestions.length}</span> questions correctly.
            </p>
            
            <div style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              background: percentage >= 70 
                ? 'rgba(0, 200, 0, 0.1)' 
                : percentage >= 50 
                  ? 'rgba(255, 165, 0, 0.1)' 
                  : 'rgba(255, 0, 0, 0.1)',
              border: percentage >= 70 
                ? '1px solid rgba(0, 200, 0, 0.3)' 
                : percentage >= 50 
                  ? '1px solid rgba(255, 165, 0, 0.3)' 
                  : '1px solid rgba(255, 0, 0, 0.3)',
              marginTop: '1rem'
            }}>
              <p style={{ 
                color: percentage >= 70 ? '#00C800' : percentage >= 50 ? '#FFA500' : '#FF4444',
                fontWeight: '600',
                margin: 0
              }}>
                {percentage >= 70 
                  ? 'ðŸŽ‰ Excellent work! You have a strong understanding of the topic.' 
                  : percentage >= 50 
                    ? 'ðŸ‘ Good job! There\'s room for improvement.' 
                    : 'ðŸ“š Keep studying! Practice makes perfect.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => {
                resetQuiz();
                handleGenerateQuiz();
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Try Again ({selectedDifficulty})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz state
  const currentQuestion = quizQuestions[currentQuizQuestionIdx];
  if (!currentQuestion) {
    return (
      <div style={{ padding: '1rem' }}>
        <QuizControls />
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#2E1A47' 
        }}>
          <p>No quiz questions available.</p>
        </div>
      </div>
    );
  }

  const currentAnswer = quizAnswers.find((answer) => answer.questionIndex === currentQuizQuestionIdx);
  
  return (
    <div style={{ padding: '1rem' }}>
      <QuizControls />
      
      {/* Progress Bar and Question Info */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(177, 156, 217, 0.3)'
      }}>
        <h3 style={{ 
          color: '#2E1A47',
          margin: 0,
          fontSize: '1.1rem',
          fontWeight: '600'
        }}>
          Question {currentQuizQuestionIdx + 1} of {quizQuestions.length}
          <span style={{ 
            color: '#B19CD9', 
            fontSize: '0.9rem',
            marginLeft: '0.5rem',
            fontWeight: '400'
          }}>
            ({selectedDifficulty})
          </span>
        </h3>
        <div
          style={{
            height: '8px',
            width: '200px',
            background: 'rgba(177, 156, 217, 0.3)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${((currentQuizQuestionIdx + 1) / quizQuestions.length) * 100}%`,
              background: 'linear-gradient(90deg, #B19CD9, #FFD700)',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div
        style={{
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
          padding: '2rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(177, 156, 217, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        <p style={{ 
          color: '#2E1A47', 
          fontSize: '1.1rem', 
          marginBottom: '1.5rem', 
          fontWeight: '500',
          lineHeight: '1.6',
          fontFamily: getLanguageFont(selectedLanguage)
        }}>
          {currentQuestion.question}
        </p>
        
        {/* Answer Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentQuestion.options.map((option, optionIdx) => {
            let backgroundColor = 'rgba(255, 255, 255, 0.05)';
            let borderColor = 'rgba(177, 156, 217, 0.3)';
            let textColor = '#2E1A47';
            let icon = null;
            
            if (currentAnswer) {
              if (optionIdx === currentQuestion.correct_index) {
                backgroundColor = 'rgba(0, 200, 0, 0.15)';
                borderColor = 'rgba(0, 200, 0, 0.5)';
                textColor = '#006400';
                icon = <Check size={20} style={{ color: '#00C800' }} />;
              } else if (optionIdx === currentAnswer.selectedOption) {
                backgroundColor = 'rgba(200, 0, 0, 0.15)';
                borderColor = 'rgba(200, 0, 0, 0.5)';
                textColor = '#8B0000';
                icon = <X size={20} style={{ color: '#FF4444' }} />;
              }
            }
            
            return (
              <button
                key={`option-${currentQuizQuestionIdx}-${optionIdx}`}
                onClick={() => handleQuizAnswer(optionIdx)}
                disabled={!!currentAnswer}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor,
                  border: `2px solid ${borderColor}`,
                  borderRadius: '0.5rem',
                  cursor: currentAnswer ? 'default' : 'pointer',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: textColor,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: getLanguageFont(selectedLanguage),
                  opacity: currentAnswer && optionIdx !== currentQuestion.correct_index && optionIdx !== currentAnswer.selectedOption ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!currentAnswer) {
                    e.currentTarget.style.backgroundColor = 'rgba(177, 156, 217, 0.1)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!currentAnswer) {
                    e.currentTarget.style.backgroundColor = backgroundColor;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <span>{option}</span>
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
{showExplanation && currentAnswer && (
  <div
    style={{
      padding: '1.5rem',
      background: 'rgba(177, 156, 217, 0.1)',
      borderRadius: '0.75rem',
      marginBottom: '1.5rem',
      border: '1px solid rgba(177, 156, 217, 0.3)'
    }}
  >
    <h4 style={{ 
      color: '#2E1A47', 
      marginBottom: '1rem',
      fontSize: '1rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <span>ðŸ’¡</span>
      {explanationTranslations[selectedLanguage as keyof typeof explanationTranslations] || 'Explanation'}
    </h4>
    <p style={{ 
      color: '#4A5568', 
      lineHeight: '1.6',
      margin: 0,
      fontFamily: getLanguageFont(selectedLanguage)
    }}>
      {currentQuestion.explanation}
    </p>
  </div>
)}

      {/* Navigation Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '2rem'
      }}>
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuizQuestionIdx === 0}
          style={{
            padding: '0.75rem 1.5rem',
            background: currentQuizQuestionIdx === 0 
              ? 'rgba(177, 156, 217, 0.3)' 
              : 'rgba(177, 156, 217, 0.8)',
            color: currentQuizQuestionIdx === 0 ? '#999' : 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: currentQuizQuestionIdx === 0 ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          â† Previous
        </button>

        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          {quizQuestions.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: idx === currentQuizQuestionIdx 
                  ? '#FFD700' 
                  : quizAnswers.some(a => a.questionIndex === idx)
                    ? '#B19CD9'
                    : 'rgba(177, 156, 217, 0.3)',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>

        <button
          onClick={handleNextQuestion}
          disabled={!currentAnswer}
          style={{
            padding: '0.75rem 1.5rem',
            background: !currentAnswer 
              ? 'rgba(177, 156, 217, 0.3)' 
              : 'linear-gradient(45deg, #FFD700, #B19CD9)',
            color: !currentAnswer ? '#999' : '#2E1A47',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: !currentAnswer ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (currentAnswer) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentAnswer) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {currentQuizQuestionIdx === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next â†’'}
        </button>
      </div>
    </div>
  );
};

export default QuizTab;
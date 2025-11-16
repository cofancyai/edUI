import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import QuestionDisplay from './QuestionDisplay';
import LoadingIndicator from '../shared/LoadingIndicator';
import ErrorMessage from '../shared/ErrorMessage';
import { AptitudeQuestion } from '../../../types/aptitude.types';

interface TestModeProps {
  aptitude: any;
  selectedLanguage: string;
  onComplete: () => void;
  onBack: () => void;
}

const TestMode: React.FC<TestModeProps> = ({
  aptitude,
  selectedLanguage,
  onComplete,
  onBack
}) => {
  const {
    questions,
    isLoadingQuestions,
    questionError,
    activeQuestion,
    activeQuestionIndex,
    userAnswers,
    answerQuestion,
    goToQuestion,
    endTest,
    testInProgress
  } = aptitude;
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  
  // Calculate progress
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  
  // Set time limit based on questions
  useEffect(() => {
    if (testInProgress && questions.length > 0 && timeLeft === null && !testStarted) {
      // Calculate time based on question time estimates
      const totalTime = questions.reduce((sum: number, q: AptitudeQuestion) => {
        return sum + (q.time_estimate_seconds || 60);
      }, 0);
      setTimeLeft(totalTime);
      setTestStarted(true);
    }
  }, [testInProgress, questions, timeLeft, testStarted]);
  
  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || !testInProgress || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Time's up - end the test automatically
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, testInProgress]);

  // Handle answer submission
  const handleAnswer = (answer: string) => {
    if (!activeQuestion) return;
    answerQuestion(activeQuestion.id, answer);
  };

  // Submit the test
  const handleSubmitTest = useCallback(async () => {
    try {
      await endTest();
      onComplete();
    } catch (error) {
      console.error('Error submitting test:', error);
    }
  }, [endTest, onComplete]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get time color based on remaining time
  const getTimeColor = () => {
    if (!timeLeft) return '#94A3B8';
    const totalTime = questions.reduce((sum: number, q: AptitudeQuestion) => sum + (q.time_estimate_seconds || 60), 0);
    const timePercent = (timeLeft / totalTime) * 100;
    
    if (timePercent > 50) return '#10B981'; // Green
    if (timePercent > 25) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  // Show loading state
  if (isLoadingQuestions) {
    return <LoadingIndicator message="Loading test questions..." />;
  }

  // Show error state
  if (questionError) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#1E293B',
        borderRadius: '0.75rem',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      }}>
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '1rem', color: '#EF4444' }}>Error Loading Test</h3>
        <p style={{ marginBottom: '1.5rem', color: '#F8FAFC' }}>
          {questionError}
        </p>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: '#14B8A6',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>
    );
  }

  // Show empty state
  if (!activeQuestion || questions.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#1E293B',
        borderRadius: '0.75rem'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#F8FAFC' }}>No Questions Available</h3>
        <p style={{ marginBottom: '1.5rem', color: '#94A3B8' }}>
          No questions found for the selected criteria. Please try different options.
        </p>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: '#14B8A6',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '0.5rem',
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
      maxWidth: '900px',
      margin: '0 auto',
      padding: '1.5rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            fontSize: '1.1rem',
            color: '#F8FAFC',
            fontWeight: 600
          }}>
            Question {activeQuestionIndex + 1} of {totalQuestions}
          </div>
          
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#1E293B',
            borderRadius: '0.5rem',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <span style={{ 
              fontSize: '0.9rem', 
              color: '#3B82F6',
              fontWeight: 500
            }}>
              Test Mode
            </span>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#1E293B',
          borderRadius: '0.5rem',
          border: `1px solid ${timeLeft && timeLeft < 300 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
        }}>
          <Clock size={16} color={getTimeColor()} />
          <span style={{ 
            fontSize: '1rem', 
            color: getTimeColor(),
            fontWeight: 600
          }}>
            {timeLeft ? formatTime(timeLeft) : '00:00'}
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '0.5rem',
        backgroundColor: '#374151',
        borderRadius: '0.25rem',
        marginBottom: '1.5rem',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#3B82F6',
          borderRadius: '0.25rem',
          transition: 'width 0.3s ease'
        }} />
      </div>
      
      {/* Question display */}
      <QuestionDisplay
        question={activeQuestion}
        userAnswer={userAnswers[activeQuestion.id] || null}
        onAnswer={handleAnswer}
        showFeedback={false}
        selectedLanguage={selectedLanguage}
        timeLeft={timeLeft || undefined}
        showHint={true}
      />
      
      {/* Question navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
        gap: '0.5rem',
        marginTop: '2rem',
        marginBottom: '2rem',
        maxWidth: '600px',
        margin: '2rem auto'
      }}>
        {questions.map((question: AptitudeQuestion, index: number) => {
          const isAnswered = !!userAnswers[question.id];
          const isActive = index === activeQuestionIndex;
          
          return (
            <button
              key={question.id}
              onClick={() => goToQuestion(index)}
              style={{
                width: '50px',
                height: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isActive
                  ? '#3B82F6'
                  : isAnswered
                    ? '#10B981'
                    : '#374151',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#F8FAFC',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = isAnswered ? '#059669' : '#4B5563';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = isAnswered ? '#10B981' : '#374151';
                }
              }}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      
      {/* Submit test section */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: '#1E293B',
        borderRadius: '0.75rem',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          marginBottom: '1rem'
        }}>
          <div style={{
            fontSize: '1.1rem',
            color: '#F8FAFC',
            marginBottom: '0.5rem',
            fontWeight: 600
          }}>
            Test Progress
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginBottom: '1rem'
          }}>
            <div>
              <span style={{ color: '#94A3B8' }}>Answered: </span>
              <span style={{ color: '#10B981', fontWeight: 600 }}>{answeredCount}</span>
              <span style={{ color: '#94A3B8' }}>/{totalQuestions}</span>
            </div>
            <div>
              <span style={{ color: '#94A3B8' }}>Remaining: </span>
              <span style={{ color: '#F59E0B', fontWeight: 600 }}>{totalQuestions - answeredCount}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmitTest}
          style={{
            padding: '1rem 2rem',
            backgroundColor: answeredCount === totalQuestions ? '#10B981' : '#3B82F6',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '0 auto',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = answeredCount === totalQuestions ? '#059669' : '#2563EB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = answeredCount === totalQuestions ? '#10B981' : '#3B82F6';
          }}
        >
          {answeredCount < totalQuestions && (
            <AlertCircle size={18} />
          )}
          {answeredCount === totalQuestions ? (
            <>
              <CheckCircle size={18} />
              Submit Test
            </>
          ) : (
            'Submit Test'
          )}
        </button>
        
        {/* Warning if not all questions answered */}
        {answeredCount < totalQuestions && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            color: '#EF4444',
            fontSize: '0.9rem'
          }}>
            {totalQuestions - answeredCount} question(s) remaining. You can submit now or answer the remaining questions.
          </div>
        )}
      </div>
    </div>
  );
};

export default TestMode;
import React, { useState, useCallback } from 'react';
import { Target, Play, CheckCircle, XCircle, RefreshCw, Trophy, Brain } from 'lucide-react';
import LoadingIndicator from '../LoadingIndicator';
import ErrorMessage from '../ErrorMessage';

interface Question {
  question: string;
  options: { [key: string]: string };
  correct_answer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

interface QuizProps {
  initialTopic?: string;
}

const Quiz: React.FC<QuizProps> = ({ initialTopic = '' }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [quizState, setQuizState] = useState<'setup' | 'loading' | 'active' | 'completed' | 'results'>('setup');
  const [score, setScore] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const generateQuiz = useCallback(async () => {
    if (!topic.trim()) return;

    setQuizState('loading');
    setError(null);

    try {
      const response = await fetch('https://prepnx-backend.vercel.app/api/quiz/practice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'a1b2c3d4e5f6g7h8i9j0'
        },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
          num_questions: numQuestions
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setQuestions(data.questions || []);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setQuizState('active');
        setShowExplanation(false);
      } else {
        throw new Error(data.message || 'Failed to generate quiz');
      }
    } catch (err) {
      console.error('❌ Quiz generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
      setQuizState('setup');
    }
  }, [topic, difficulty, numQuestions]);

  const handleAnswerSelect = (option: string) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
  };

  const goToNextQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const goToPreviousQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    setQuizState('loading');

    try {
      const answersArray = questions.map((_, index) => userAnswers[index] || '');
      
      const response = await fetch('https://prepnx-backend.vercel.app/api/quiz/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'a1b2c3d4e5f6g7h8i9j0'
        },
        body: JSON.stringify({
          questions,
          answers: answersArray
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setScore(data.score);
        setResults(data.results);
        setQuizState('results');
      } else {
        throw new Error(data.message || 'Failed to validate quiz');
      }
    } catch (err) {
      console.error('❌ Quiz submission failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
      setQuizState('active');
    }
  };

  const restartQuiz = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setScore(null);
    setResults([]);
    setQuizState('setup');
    setShowExplanation(false);
    setError(null);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestionIndex];

  // Auto-generated Quiz (from AI Tutor) - Show waiting state when initialTopic provided
  if (initialTopic && initialTopic.trim() && quizState === 'setup') {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        minHeight: '600px',
        position: 'relative'
      }}>
        {/* Always visible difficulty selector */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <span style={{ color: '#FFD700', fontSize: '0.9rem' }}>Difficulty:</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            style={{
              padding: '0.25rem 0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '0.25rem',
              color: '#EDEDED',
              fontSize: '0.8rem'
            }}
          >
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Hard</option>
          </select>
        </div>

        {/* Centered content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center'
        }}>
          <Target size={64} style={{ color: '#FFD700', marginBottom: '2rem', opacity: 0.8 }} />
          <h3 style={{ color: '#FFD700', fontSize: '1.5rem', marginBottom: '1rem' }}>
            Ready to Generate Quiz
          </h3>
          <p style={{ color: '#B19CD9', fontSize: '1.1rem', marginBottom: '1rem', maxWidth: '400px' }}>
            Topic: <strong>{initialTopic}</strong>
          </p>
          <p style={{ color: '#B19CD9', marginBottom: '2rem', opacity: 0.8 }}>
            Click Generate Quiz to create {numQuestions} {difficulty} level questions
          </p>
          
          {/* Generate Quiz Button */}
          <button
            onClick={generateQuiz}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#2E1A47',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Play size={20} />
            Generate Quiz
          </button>

          {/* Number of Questions Selector */}
          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#B19CD9', fontSize: '0.9rem' }}>Questions:</span>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              style={{
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                color: '#EDEDED',
                fontSize: '0.9rem'
              }}
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  // Manual Setup Phase (when no initialTopic)
  if (quizState === 'setup') {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        minHeight: '600px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <Target size={32} style={{ color: '#FFD700' }} />
          <div>
            <h2 style={{ color: '#FFD700', fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>
              AI Quiz Generator
            </h2>
            <p style={{ color: '#B19CD9', fontSize: '1rem', margin: 0 }}>
              Test your knowledge with AI-generated questions
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
          <div>
            <label style={{ color: '#FFD700', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Quiz Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic (e.g. World War I, Photosynthesis, Machine Learning...)"
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                color: '#EDEDED',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#FFD700', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#EDEDED',
                  fontSize: '1rem'
                }}
              >
                <option value="easy" style={{ background: '#2E1A47' }}>🟢 Easy</option>
                <option value="medium" style={{ background: '#2E1A47' }}>🟡 Medium</option>
                <option value="hard" style={{ background: '#2E1A47' }}>🔴 Hard</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ color: '#FFD700', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Questions
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#EDEDED',
                  fontSize: '1rem'
                }}
              >
                <option value={3} style={{ background: '#2E1A47' }}>3 Questions</option>
                <option value={5} style={{ background: '#2E1A47' }}>5 Questions</option>
                <option value={10} style={{ background: '#2E1A47' }}>10 Questions</option>
                <option value={15} style={{ background: '#2E1A47' }}>15 Questions</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateQuiz}
            disabled={!topic.trim()}
            style={{
              padding: '1rem 2rem',
              background: topic.trim() 
                ? 'linear-gradient(45deg, #FFD700, #B19CD9)'
                : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '0.75rem',
              color: topic.trim() ? '#2E1A47' : '#B19CD9',
              cursor: topic.trim() ? 'pointer' : 'not-allowed',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center'
            }}
          >
            <Play size={20} />
            Generate Quiz
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '1.5rem' }}>
            <ErrorMessage message={error} />
          </div>
        )}
      </div>
    );
  }

  // Loading Phase
  if (quizState === 'loading') {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        minHeight: '600px'
      }}>
        <LoadingIndicator 
          message="Generating AI Quiz..."
          subMessage={`Creating ${numQuestions} ${difficulty} questions about "${topic}"`}
        />
      </div>
    );
  }

  // Active Quiz Phase
  if (quizState === 'active' && currentQuestion) {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        minHeight: '600px'
      }}>
        {/* Quiz Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Target size={32} style={{ color: '#FFD700' }} />
            <div>
              <h3 style={{ color: '#FFD700', margin: 0, fontSize: '1.2rem' }}>
                {topic}
              </h3>
              <p style={{ color: '#B19CD9', margin: 0, fontSize: '0.9rem' }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 215, 0, 0.3)'
          }}>
            <span style={{ color: '#FFD700', fontWeight: '600', fontSize: '0.9rem' }}>
              {difficulty.toUpperCase()} • {currentQuestion.topic}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Question */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '2rem',
          borderRadius: '0.75rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          <h4 style={{
            color: '#EDEDED',
            fontSize: '1.3rem',
            lineHeight: '1.6',
            margin: 0
          }}>
            {currentQuestion.question}
          </h4>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {Object.entries(currentQuestion.options).map(([key, value]) => {
            const isSelected = selectedAnswer === key;
            const isCorrect = currentQuestion.correct_answer === key;
            const isWrong = showExplanation && selectedAnswer === key && !isCorrect;
            const shouldHighlightCorrect = showExplanation && isCorrect;

            return (
              <button
                key={key}
                onClick={() => !showExplanation && handleAnswerSelect(key)}
                disabled={showExplanation}
                style={{
                  padding: '1.5rem',
                  background: shouldHighlightCorrect 
                    ? 'rgba(16, 185, 129, 0.2)'
                    : isWrong 
                    ? 'rgba(239, 68, 68, 0.2)'
                    : isSelected 
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: shouldHighlightCorrect 
                    ? '1px solid rgba(16, 185, 129, 0.5)'
                    : isWrong 
                    ? '1px solid rgba(239, 68, 68, 0.5)'
                    : isSelected 
                    ? '1px solid rgba(59, 130, 246, 0.5)'
                    : '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '0.75rem',
                  color: '#EDEDED',
                  cursor: showExplanation ? 'default' : 'pointer',
                  fontSize: '1rem',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: shouldHighlightCorrect 
                    ? '#10B981'
                    : isWrong 
                    ? '#EF4444'
                    : isSelected 
                    ? '#3B82F6'
                    : 'rgba(255, 215, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: shouldHighlightCorrect || isWrong ? 'white' : '#FFD700',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {showExplanation ? (
                    shouldHighlightCorrect ? (
                      <CheckCircle size={16} />
                    ) : isWrong ? (
                      <XCircle size={16} />
                    ) : (
                      key
                    )
                  ) : (
                    key
                  )}
                </span>
                <span style={{ flex: 1 }}>{value}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Brain size={20} style={{ color: '#3B82F6' }} />
              <span style={{ color: '#3B82F6', fontWeight: '600' }}>Explanation</span>
            </div>
            <p style={{ color: '#EDEDED', margin: 0, lineHeight: '1.6' }}>
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            style={{
              padding: '0.75rem 1.5rem',
              background: currentQuestionIndex === 0 
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(177, 156, 217, 0.2)',
              border: '1px solid rgba(177, 156, 217, 0.3)',
              borderRadius: '0.5rem',
              color: currentQuestionIndex === 0 ? '#6B7280' : '#B19CD9',
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            ← Previous
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {selectedAnswer && !showExplanation && (
              <button
                onClick={() => setShowExplanation(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#3B82F6',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Brain size={16} />
                Show Answer
              </button>
            )}

            {(showExplanation || !selectedAnswer) && (
              <button
                onClick={goToNextQuestion}
                disabled={!selectedAnswer}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !selectedAnswer 
                    ? 'rgba(255, 255, 255, 0.1)'
                    : currentQuestionIndex === questions.length - 1
                    ? 'linear-gradient(45deg, #10B981, #34D399)'
                    : 'linear-gradient(45deg, #FFD700, #B19CD9)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: !selectedAnswer ? '#6B7280' : '#2E1A47',
                  cursor: !selectedAnswer ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {currentQuestionIndex === questions.length - 1 ? (
                  <>
                    <Trophy size={16} />
                    Finish Quiz
                  </>
                ) : (
                  'Next →'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results Phase
  if (quizState === 'results' && score && results) {
    const percentage = score.percentage;
    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
    const gradeColor = percentage >= 90 ? '#10B981' : percentage >= 80 ? '#3B82F6' : percentage >= 70 ? '#F59E0B' : percentage >= 60 ? '#EF4444' : '#DC2626';

    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        minHeight: '600px'
      }}>
        {/* Results Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <Trophy size={48} style={{ color: gradeColor, marginBottom: '1rem' }} />
          <h2 style={{ color: '#FFD700', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
            Quiz Completed!
          </h2>
          <p style={{ color: '#B19CD9', fontSize: '1.1rem', margin: '0.5rem 0 0 0' }}>
            {topic} • {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
          </p>
        </div>

        {/* Score Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ color: '#10B981', fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {score.correct}/{score.total}
            </div>
            <div style={{ color: '#EDEDED', fontSize: '0.9rem' }}>Correct Answers</div>
          </div>

          <div style={{
            background: `rgba(${gradeColor.replace('#', '')}, 0.1)`,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: `1px solid ${gradeColor}40`,
            textAlign: 'center'
          }}>
            <div style={{ color: gradeColor, fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {percentage}%
            </div>
            <div style={{ color: '#EDEDED', fontSize: '0.9rem' }}>Score</div>
          </div>

          <div style={{
            background: `rgba(${gradeColor.replace('#', '')}, 0.1)`,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: `1px solid ${gradeColor}40`,
            textAlign: 'center'
          }}>
            <div style={{ color: gradeColor, fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {grade}
            </div>
            <div style={{ color: '#EDEDED', fontSize: '0.9rem' }}>Grade</div>
          </div>
        </div>

        {/* Question Results */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid rgba(255, 215, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            Detailed Results
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.map((result, index) => (
              <div key={index} style={{
                background: result.is_correct 
                  ? 'rgba(16, 185, 129, 0.05)'
                  : 'rgba(239, 68, 68, 0.05)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: result.is_correct 
                  ? '1px solid rgba(16, 185, 129, 0.2)'
                  : '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {result.is_correct ? (
                    <CheckCircle size={16} style={{ color: '#10B981' }} />
                  ) : (
                    <XCircle size={16} style={{ color: '#EF4444' }} />
                  )}
                  <span style={{ 
                    color: result.is_correct ? '#10B981' : '#EF4444',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Question {index + 1} • {result.topic}
                  </span>
                </div>
                <div style={{ color: '#EDEDED', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {result.question}
                </div>
                <div style={{ color: '#B19CD9', fontSize: '0.8rem' }}>
                  Your answer: {result.user_answer} | Correct: {result.correct_answer}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={restartQuiz}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#2E1A47',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RefreshCw size={20} />
            Try Another Quiz
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default Quiz;
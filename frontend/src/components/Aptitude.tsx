import React, { useState, useCallback } from 'react';
import { TrendingUp, Play, CheckCircle, XCircle, RefreshCw, Trophy, Brain } from 'lucide-react';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';

interface Question {
  question: string;
  options: { [key: string]: string };
  correct_answer: string;
  explanation: string;
  difficulty: string;
  category: string;
}

const Aptitude: React.FC = () => {
  const [category, setCategory] = useState('quantitative');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [testState, setTestState] = useState<'setup' | 'loading' | 'active' | 'results'>('setup');
  const [score, setScore] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const aptitudeCategories = [
    { code: 'quantitative', name: 'Quantitative Aptitude', icon: '🔢' },
    { code: 'logical', name: 'Logical Reasoning', icon: '🧩' },
    { code: 'verbal', name: 'Verbal Ability', icon: '📝' },
    { code: 'data-interpretation', name: 'Data Interpretation', icon: '📊' },
    { code: 'analytical', name: 'Analytical Reasoning', icon: '🔍' },
    { code: 'general', name: 'General Aptitude', icon: '💡' }
  ];

  const generateTest = useCallback(async () => {
    setTestState('loading');
    setError(null);

    try {
      const response = await fetch('https://prepnx-backend.vercel.app/api/quiz/practice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'a1b2c3d4e5f6g7h8i9j0'
        },
        body: JSON.stringify({
          topic: aptitudeCategories.find(c => c.code === category)?.name || 'Aptitude',
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
        setTestState('active');
        setShowExplanation(false);
      } else {
        throw new Error(data.message || 'Failed to generate test');
      }
    } catch (err) {
      console.error('❌ Test generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate test');
      setTestState('setup');
    }
  }, [category, difficulty, numQuestions, aptitudeCategories]);

  const handleAnswerSelect = (option: string) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
  };

  const goToNextQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitTest();
    }
  };

  const goToPreviousQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitTest = async () => {
    setTestState('loading');

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
        setTestState('results');
      } else {
        throw new Error(data.message || 'Failed to validate test');
      }
    } catch (err) {
      console.error('❌ Test submission failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit test');
      setTestState('active');
    }
  };

  const restartTest = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setScore(null);
    setResults([]);
    setTestState('setup');
    setShowExplanation(false);
    setError(null);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestionIndex];
  const selectedCategory = aptitudeCategories.find(c => c.code === category);

  // Setup Phase
  if (testState === 'setup') {
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
          <TrendingUp size={32} style={{ color: '#FFD700' }} />
          <div>
            <h2 style={{ color: '#FFD700', fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>
              Aptitude Test
            </h2>
            <p style={{ color: '#B19CD9', fontSize: '1rem', margin: 0 }}>
              Practice aptitude questions across different categories
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
          <div>
            <label style={{ color: '#FFD700', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Aptitude Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                color: '#EDEDED',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              {aptitudeCategories.map((cat) => (
                <option key={cat.code} value={cat.code} style={{ background: '#2E1A47' }}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
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
                  fontSize: '1rem',
                  cursor: 'pointer'
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
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                <option value={5} style={{ background: '#2E1A47' }}>5 Questions</option>
                <option value={10} style={{ background: '#2E1A47' }}>10 Questions</option>
                <option value={15} style={{ background: '#2E1A47' }}>15 Questions</option>
                <option value={20} style={{ background: '#2E1A47' }}>20 Questions</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateTest}
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
              gap: '0.5rem',
              justifyContent: 'center'
            }}
          >
            <Play size={20} />
            Start Aptitude Test
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
  if (testState === 'loading') {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        minHeight: '600px'
      }}>
        <LoadingIndicator
          message="Generating Aptitude Test..."
          subMessage={`Creating ${numQuestions} ${difficulty} level ${selectedCategory?.name} questions`}
        />
      </div>
    );
  }

  // Active Test Phase
  if (testState === 'active' && currentQuestion) {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        minHeight: '600px'
      }}>
        {/* Test Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <TrendingUp size={32} style={{ color: '#FFD700' }} />
            <div>
              <h3 style={{ color: '#FFD700', margin: 0, fontSize: '1.2rem' }}>
                {selectedCategory?.icon} {selectedCategory?.name}
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
              {difficulty.toUpperCase()}
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
                    Finish Test
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
  if (testState === 'results' && score && results) {
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
            Test Completed!
          </h2>
          <p style={{ color: '#B19CD9', fontSize: '1.1rem', margin: '0.5rem 0 0 0' }}>
            {selectedCategory?.icon} {selectedCategory?.name} • {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
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
          marginBottom: '2rem',
          maxHeight: '400px',
          overflowY: 'auto'
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
                    Question {index + 1}
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
            onClick={restartTest}
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
            Try Another Test
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default Aptitude;

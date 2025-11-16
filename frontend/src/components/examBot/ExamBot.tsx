import React, { useState, useEffect, useRef } from 'react';
import { Brain, Clock, Target, Trophy, Play, CheckCircle, XCircle, Flag, RotateCcw, Eye, BookOpen } from 'lucide-react';
import LoadingIndicator from '../LoadingIndicator';
import ErrorMessage from '../ErrorMessage';

interface ExamBotProps {
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

interface Question {
  question: string;
  options: { [key: string]: string };
  correct_answer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

interface TestSession {
  examType: string;
  subject: string;
  difficulty: string;
  numQuestions: number;
  timeLimit: number;
  questions: Question[];
  startTime: number;
}

interface UserAnswer {
  answer: string;
  timeSpent: number;
  flagged: boolean;
}

const ExamBot: React.FC<ExamBotProps> = ({
  selectedLanguage = 'english',
  isAuthenticated = false
}) => {
  const [mode, setMode] = useState<'setup' | 'test' | 'review' | 'results'>('setup');
  const [examType, setExamType] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: UserAnswer }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const API_BASE = 'https://prepnx-backend.vercel.app/api/quiz';

  const examTypes = [
    { id: 'upsc', name: 'UPSC CSE', icon: '🏛️', subjects: ['History', 'Geography', 'Polity', 'Economy', 'Science', 'Current Affairs'], color: '#3B82F6' },
    { id: 'ssc', name: 'SSC CGL/CHSL', icon: '📋', subjects: ['General Knowledge', 'Reasoning', 'Quantitative Aptitude', 'English'], color: '#10B981' },
    { id: 'banking', name: 'Banking', icon: '🏦', subjects: ['Banking Awareness', 'Reasoning', 'Quantitative Aptitude', 'English'], color: '#F59E0B' },
    { id: 'railway', name: 'Railway', icon: '🚂', subjects: ['General Awareness', 'Mathematics', 'Reasoning', 'Technical Ability'], color: '#8B5CF6' },
    { id: 'gate', name: 'GATE', icon: '⚙️', subjects: ['Engineering Mathematics', 'Aptitude', 'Technical Subject'], color: '#EC4899' },
    { id: 'neet', name: 'NEET', icon: '⚕️', subjects: ['Physics', 'Chemistry', 'Biology'], color: '#14B8A6' }
  ];

  const difficulties = [
    { id: 'easy', name: 'Easy', description: 'Foundation level', color: '#10B981', time: 1 },
    { id: 'medium', name: 'Medium', description: 'Intermediate level', color: '#F59E0B', time: 1.5 },
    { id: 'hard', name: 'Hard', description: 'Advanced level', color: '#EF4444', time: 2 }
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && mode === 'test') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [timeLeft, mode]);

  const startTest = async () => {
    if (!examType || !subject) {
      setError('Please select exam type and subject');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedExam = examTypes.find(e => e.id === examType);
      const selectedDiff = difficulties.find(d => d.id === difficulty);
      const timeLimit = numQuestions * (selectedDiff?.time || 1.5) * 60;

      const response = await fetch(`${API_BASE}/practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'a1b2c3d4e5f6g7h8i9j0'
        },
        body: JSON.stringify({
          topic: `${selectedExam?.name} - ${subject}`,
          difficulty,
          num_questions: numQuestions
        })
      });

      const data = await response.json();

      if (data.status === 'success' && data.questions) {
        setTestSession({
          examType: selectedExam?.name || '',
          subject,
          difficulty,
          numQuestions,
          timeLimit,
          questions: data.questions,
          startTime: Date.now()
        });
        setTimeLeft(timeLimit);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setMode('test');
      } else {
        setError(data.message || 'Failed to generate test');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (mode !== 'test') return;

    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        answer: option,
        timeSpent: testSession ? Math.floor((Date.now() - testSession.startTime) / 1000) : 0,
        flagged: prev[currentQuestionIndex]?.flagged || false
      }
    }));
  };

  const toggleFlag = () => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        ...prev[currentQuestionIndex],
        answer: prev[currentQuestionIndex]?.answer || '',
        timeSpent: prev[currentQuestionIndex]?.timeSpent || 0,
        flagged: !prev[currentQuestionIndex]?.flagged
      }
    }));
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmitTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setMode('results');
  };

  const calculateScore = () => {
    if (!testSession) return { correct: 0, incorrect: 0, unanswered: 0, total: 0, percentage: 0 };

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    testSession.questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      if (!userAnswer || !userAnswer.answer) {
        unanswered++;
      } else if (userAnswer.answer === question.correct_answer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const total = testSession.questions.length;
    const percentage = (correct / total) * 100;

    return { correct, incorrect, unanswered, total, percentage };
  };

  const resetTest = () => {
    setMode('setup');
    setExamType('');
    setSubject('');
    setDifficulty('medium');
    setNumQuestions(10);
    setTestSession(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeLeft(0);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (!testSession) return '#10B981';
    const percentage = (timeLeft / testSession.timeLimit) * 100;
    if (percentage > 50) return '#10B981';
    if (percentage > 25) return '#F59E0B';
    return '#EF4444';
  };

  // Setup View
  if (mode === 'setup') {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minHeight: '600px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '2px solid rgba(255, 215, 0, 0.2)'
        }}>
          <Brain size={40} style={{ color: '#FFD700' }} />
          <div>
            <h2 style={{
              color: '#FFD700',
              fontSize: '2rem',
              fontWeight: '700',
              margin: 0,
              marginBottom: '0.5rem',
              background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Exam Bot
            </h2>
            <p style={{
              color: '#B19CD9',
              fontSize: '1.05rem',
              margin: 0
            }}>
              Practice with exam-style questions and timed tests
            </p>
          </div>
        </div>

        {/* Exam Type Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            color: '#FFD700',
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Target size={20} />
            Select Exam Type
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {examTypes.map(exam => (
              <div
                key={exam.id}
                onClick={() => {
                  setExamType(exam.id);
                  setSubject('');
                }}
                style={{
                  padding: '1.5rem',
                  background: examType === exam.id
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: examType === exam.id
                    ? `2px solid ${exam.color}`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  if (examType !== exam.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (examType !== exam.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {exam.icon}
                </div>
                <h4 style={{
                  color: '#EDEDED',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {exam.name}
                </h4>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Selection */}
        {examType && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              color: '#FFD700',
              fontSize: '1.2rem',
              fontWeight: '600',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <BookOpen size={20} />
              Select Subject
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem'
            }}>
              {examTypes.find(e => e.id === examType)?.subjects.map(subj => (
                <div
                  key={subj}
                  onClick={() => setSubject(subj)}
                  style={{
                    padding: '1rem',
                    background: subject === subj
                      ? 'rgba(255, 215, 0, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: subject === subj
                      ? '2px solid #FFD700'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    color: '#EDEDED',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (subject !== subj) {
                      e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (subject !== subj) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  {subj}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Configuration */}
        {examType && subject && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 215, 0, 0.1)'
          }}>
            <h3 style={{
              color: '#FFD700',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1.5rem'
            }}>
              Test Configuration
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  color: '#B19CD9',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '0.5rem',
                    color: '#EDEDED',
                    fontSize: '0.95rem'
                  }}
                >
                  {difficulties.map(diff => (
                    <option key={diff.id} value={diff.id} style={{ background: '#2E1A47' }}>
                      {diff.name} - {diff.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: '#B19CD9',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Number of Questions
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '0.5rem',
                    color: '#EDEDED',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value={5} style={{ background: '#2E1A47' }}>5 Questions</option>
                  <option value={10} style={{ background: '#2E1A47' }}>10 Questions</option>
                  <option value={15} style={{ background: '#2E1A47' }}>15 Questions</option>
                  <option value={20} style={{ background: '#2E1A47' }}>20 Questions</option>
                </select>
              </div>

              <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <div style={{
                  color: '#60A5FA',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem'
                }}>
                  Time Limit
                </div>
                <div style={{
                  color: '#EDEDED',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  {formatTime(numQuestions * (difficulties.find(d => d.id === difficulty)?.time || 1.5) * 60)}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

        <button
          onClick={startTest}
          disabled={!examType || !subject || loading}
          style={{
            width: '100%',
            padding: '1.25rem',
            background: examType && subject
              ? 'linear-gradient(45deg, #FFD700, #B19CD9)'
              : 'rgba(255, 255, 255, 0.1)',
            color: examType && subject ? '#2E1A47' : '#EDEDED',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: examType && subject ? 'pointer' : 'not-allowed',
            fontWeight: '700',
            fontSize: '1.1rem',
            opacity: examType && subject ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}
        >
          {loading ? 'Preparing Test...' : (
            <>
              <Play size={20} />
              Start Test
            </>
          )}
        </button>
      </div>
    );
  }

  // Test, Results, and Review views continue...
  // (Due to length constraints, condensing the remaining views)

  if (mode === 'test' && testSession) {
    const currentQuestion = testSession.questions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];

    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        minHeight: '600px'
      }}>
        {/* Header with timer and progress - Implementation similar to MockInterview */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ color: '#FFD700', margin: 0 }}>{testSession.examType} - {testSession.subject}</h2>
            <p style={{ color: '#B19CD9', fontSize: '0.9rem' }}>Question {currentQuestionIndex + 1} of {testSession.questions.length}</p>
          </div>
          <div style={{
            padding: '0.75rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem',
            border: `2px solid ${getTimeColor()}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Clock size={20} style={{ color: getTimeColor() }} />
            <span style={{ color: getTimeColor(), fontSize: '1.2rem', fontWeight: '700' }}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question display */}
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ color: '#EDEDED', flex: 1 }}>{currentQuestion.question}</h3>
            <button onClick={toggleFlag} style={{
              padding: '0.5rem',
              background: userAnswer?.flagged ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${userAnswer?.flagged ? '#EF4444' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}>
              <Flag size={18} fill={userAnswer?.flagged ? '#EF4444' : 'none'} style={{ color: userAnswer?.flagged ? '#EF4444' : '#B19CD9' }} />
            </button>
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <div
                key={key}
                onClick={() => handleAnswerSelect(key)}
                style={{
                  padding: '1.25rem',
                  background: userAnswer?.answer === key ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: userAnswer?.answer === key ? '2px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: userAnswer?.answer === key ? 'linear-gradient(45deg, #FFD700, #B19CD9)' : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: userAnswer?.answer === key ? '#2E1A47' : '#EDEDED',
                  fontWeight: '600'
                }}>
                  {key}
                </div>
                <span style={{ color: '#EDEDED' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.5rem',
              color: '#EDEDED',
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQuestionIndex === 0 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          {currentQuestionIndex < testSession.questions.length - 1 ? (
            <button
              onClick={() => goToQuestion(currentQuestionIndex + 1)}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#2E1A47',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmitTest}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(45deg, #10B981, #34D399)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle size={18} />
              Submit Test
            </button>
          )}
        </div>
      </div>
    );
  }

  // Results and Review views simplified for brevity
  if (mode === 'results' && testSession) {
    const score = calculateScore();

    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        minHeight: '600px',
        textAlign: 'center'
      }}>
        <Trophy size={60} style={{ color: '#FFD700', margin: '0 auto 1rem' }} />
        <h2 style={{ color: '#FFD700', fontSize: '2rem', marginBottom: '0.5rem' }}>Test Completed!</h2>
        <p style={{ color: '#B19CD9', marginBottom: '2rem' }}>{testSession.examType} - {testSession.subject}</p>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '2rem',
          borderRadius: '0.75rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: '700',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            {score.percentage.toFixed(1)}%
          </div>
          <p style={{ color: '#B19CD9' }}>{score.correct} out of {score.total} correct</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle size={32} style={{ color: '#10B981', margin: '0 auto 0.5rem' }} />
            <div style={{ color: '#10B981', fontSize: '2rem', fontWeight: '700' }}>{score.correct}</div>
            <div style={{ color: '#B19CD9', fontSize: '0.9rem' }}>Correct</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <XCircle size={32} style={{ color: '#EF4444', margin: '0 auto 0.5rem' }} />
            <div style={{ color: '#EF4444', fontSize: '2rem', fontWeight: '700' }}>{score.incorrect}</div>
            <div style={{ color: '#B19CD9', fontSize: '0.9rem' }}>Incorrect</div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Clock size={32} style={{ color: '#F59E0B', margin: '0 auto 0.5rem' }} />
            <div style={{ color: '#F59E0B', fontSize: '2rem', fontWeight: '700' }}>{score.unanswered}</div>
            <div style={{ color: '#B19CD9', fontSize: '0.9rem' }}>Unanswered</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => { setMode('review'); setCurrentQuestionIndex(0); }}
            style={{
              flex: 1,
              padding: '1.25rem',
              background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#2E1A47',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Eye size={20} />
            Review Answers
          </button>
          <button
            onClick={resetTest}
            style={{
              padding: '1.25rem 2rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              color: '#EDEDED',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RotateCcw size={18} />
            New Test
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'review' && testSession) {
    const currentQuestion = testSession.questions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];
    const isCorrect = userAnswer?.answer === currentQuestion.correct_answer;

    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        minHeight: '600px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2 style={{ color: '#FFD700' }}>Review Mode</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setMode('results')} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', color: '#EDEDED', cursor: 'pointer' }}>
              Back to Results
            </button>
            <button onClick={resetTest} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '0.5rem', color: '#FFD700', cursor: 'pointer' }}>
              Exit
            </button>
          </div>
        </div>

        <p style={{ color: '#B19CD9', marginBottom: '1.5rem' }}>Question {currentQuestionIndex + 1} of {testSession.questions.length}</p>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: isCorrect ? 'rgba(16, 185, 129, 0.2)' : userAnswer?.answer ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
          color: isCorrect ? '#10B981' : userAnswer?.answer ? '#EF4444' : '#F59E0B',
          borderRadius: '0.5rem',
          fontWeight: '600',
          marginBottom: '1.5rem'
        }}>
          {isCorrect ? <><CheckCircle size={18} />Correct</> : userAnswer?.answer ? <><XCircle size={18} />Incorrect</> : <><Clock size={18} />Not Answered</>}
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
          <h3 style={{ color: '#EDEDED', marginBottom: '1.5rem' }}>{currentQuestion.question}</h3>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {Object.entries(currentQuestion.options).map(([key, value]) => {
              const isUserAnswer = userAnswer?.answer === key;
              const isCorrectAnswer = key === currentQuestion.correct_answer;

              return (
                <div
                  key={key}
                  style={{
                    padding: '1.25rem',
                    background: isCorrectAnswer ? 'rgba(16, 185, 129, 0.15)' : isUserAnswer && !isCorrect ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: isCorrectAnswer ? '2px solid #10B981' : isUserAnswer && !isCorrect ? '2px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isCorrectAnswer ? '#10B981' : isUserAnswer && !isCorrect ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isCorrectAnswer || (isUserAnswer && !isCorrect) ? 'white' : '#EDEDED'
                  }}>
                    {isCorrectAnswer ? <CheckCircle size={20} /> : isUserAnswer && !isCorrect ? <XCircle size={20} /> : key}
                  </div>
                  <div>
                    <span style={{ color: '#EDEDED' }}>{value}</span>
                    {isUserAnswer && <div style={{ color: '#B19CD9', fontSize: '0.85rem', marginTop: '0.25rem' }}>Your answer</div>}
                    {isCorrectAnswer && <div style={{ color: '#10B981', fontSize: '0.85rem', marginTop: '0.25rem' }}>Correct answer</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {currentQuestion.explanation && (
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <h4 style={{ color: '#60A5FA', marginBottom: '0.75rem' }}>Explanation</h4>
            <p style={{ color: '#EDEDED', margin: 0 }}>{currentQuestion.explanation}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.5rem',
              color: '#EDEDED',
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQuestionIndex === 0 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          <button
            onClick={() => goToQuestion(Math.min(testSession.questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === testSession.questions.length - 1}
            style={{
              padding: '0.75rem 1.5rem',
              background: currentQuestionIndex === testSession.questions.length - 1 ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(45deg, #FFD700, #B19CD9)',
              border: currentQuestionIndex === testSession.questions.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              borderRadius: '0.5rem',
              color: currentQuestionIndex === testSession.questions.length - 1 ? '#EDEDED' : '#2E1A47',
              fontWeight: '700',
              cursor: currentQuestionIndex === testSession.questions.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentQuestionIndex === testSession.questions.length - 1 ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ExamBot;

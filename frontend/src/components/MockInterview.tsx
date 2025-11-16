import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Clock, Award, Target, Brain, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';

interface MockInterviewProps {
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

interface SessionInfo {
  session_id: string;
  subject: string;
  difficulty: string;
  session_type: string;
}

interface Question {
  question_id: string;
  question_text: string;
  audio_base64?: string;
  time_limit: number;
  question_number: number;
}

interface FeedbackData {
  scores: {
    factual_accuracy: number;
    analytical_thinking?: number;
    structure?: number;
    examples?: number;
    overall: number;
  };
  strengths: string[];
  improvements: string[];
  detailed_feedback: string;
}

const MockInterview: React.FC<MockInterviewProps> = ({
  selectedLanguage = 'english',
  isAuthenticated = false
}) => {
  const [mode, setMode] = useState<'setup' | 'interview' | 'feedback' | 'complete'>('setup');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE = 'https://prepnx-backend.vercel.app/api/mock-interview';

  const subjects = [
    { id: 'history', name: 'History', icon: '🏛️', color: '#3B82F6', description: 'Ancient, Medieval & Modern India' },
    { id: 'geography', name: 'Geography', icon: '🌍', color: '#10B981', description: 'Physical & Human Geography' },
    { id: 'polity', name: 'Polity & Governance', icon: '⚖️', color: '#F59E0B', description: 'Constitution & Governance' },
    { id: 'economy', name: 'Economy', icon: '💰', color: '#8B5CF6', description: 'Indian & World Economy' },
    { id: 'science', name: 'Science & Technology', icon: '🔬', color: '#EC4899', description: 'Latest S&T Developments' },
    { id: 'current_affairs', name: 'Current Affairs', icon: '📰', color: '#14B8A6', description: 'National & International' }
  ];

  const difficulties = [
    { id: 'foundation', name: 'Foundation', description: 'Basic concepts (3 min/question)', color: '#10B981', time: 180 },
    { id: 'intermediate', name: 'Intermediate', description: 'Analytical thinking (4 min/question)', color: '#F59E0B', time: 240 },
    { id: 'advanced', name: 'Advanced', description: 'Complex analysis (5 min/question)', color: '#EF4444', time: 300 }
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && mode === 'interview') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleSubmitAnswer();
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

  const startSession = async () => {
    if (!selectedSubject || !selectedDifficulty) {
      setError('Please select subject and difficulty level');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('studentPhone') || 'anonymous';

      const response = await fetch(`${API_BASE}/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          subject: selectedSubject,
          difficulty: selectedDifficulty,
          session_type: 'practice'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSessionInfo({
          session_id: data.data.session_id,
          subject: data.data.session_info.subject,
          difficulty: data.data.session_info.difficulty,
          session_type: data.data.session_info.session_type
        });
        setCurrentQuestion(data.data.first_question);
        setTimeLeft(data.data.first_question.time_limit);
        setQuestionsAsked(1);
        setMode('interview');

        // Play audio if available
        if (data.data.first_question.audio_base64 && audioRef.current) {
          audioRef.current.src = `data:audio/mp3;base64,${data.data.first_question.audio_base64}`;
          audioRef.current.play();
        }
      } else {
        setError(data.error || 'Failed to start interview session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() && !isRecording) {
      setError('Please provide an answer');
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    setLoading(true);
    setError(null);

    try {
      // Submit answer
      const submitResponse = await fetch(`${API_BASE}/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionInfo?.session_id,
          question_id: currentQuestion?.question_id,
          answer_text: answer,
          answer_type: 'text'
        })
      });

      const submitData = await submitResponse.json();

      if (!submitData.success) {
        throw new Error('Failed to submit answer');
      }

      // Get feedback
      const feedbackResponse = await fetch(`${API_BASE}/get-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionInfo?.session_id,
          question_id: currentQuestion?.question_id
        })
      });

      const feedbackData = await feedbackResponse.json();

      if (feedbackData.success) {
        setFeedback(feedbackData.data);
        setMode('feedback');
      } else {
        throw new Error('Failed to get feedback');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process answer');
    } finally {
      setLoading(false);
    }
  };

  const loadNextQuestion = async () => {
    if (questionsAsked >= 5) {
      endSession();
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer('');
    setFeedback(null);

    try {
      const nextQuestionNumber = questionsAsked + 1;

      const response = await fetch(`${API_BASE}/get-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionInfo?.session_id,
          question_number: nextQuestionNumber
        })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentQuestion(data.data.question);
        setTimeLeft(data.data.question.time_limit);
        setQuestionsAsked(nextQuestionNumber);
        setMode('interview');

        // Play audio if available
        if (data.data.question.audio_base64 && audioRef.current) {
          audioRef.current.src = `data:audio/mp3;base64,${data.data.question.audio_base64}`;
          audioRef.current.play();
        }
      } else {
        setError(data.error || 'Failed to load next question');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load next question');
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    try {
      await fetch(`${API_BASE}/end-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionInfo?.session_id
        })
      });
    } catch (err) {
      console.error('Error ending session:', err);
    }

    setMode('complete');
  };

  const resetInterview = () => {
    setMode('setup');
    setSelectedSubject('');
    setSelectedDifficulty('');
    setSessionInfo(null);
    setCurrentQuestion(null);
    setAnswer('');
    setFeedback(null);
    setQuestionsAsked(0);
    setTimeLeft(0);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (timeLeft / (currentQuestion?.time_limit || 180)) * 100;
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
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '2px solid rgba(255, 215, 0, 0.2)'
        }}>
          <Mic size={40} style={{ color: '#FFD700' }} />
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
              UPSC Mock Interview
            </h2>
            <p style={{
              color: '#B19CD9',
              fontSize: '1.05rem',
              margin: 0
            }}>
              AI-powered interview practice with personalized feedback
            </p>
          </div>
        </div>

        {/* Subject Selection */}
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
            <Brain size={20} />
            Select Subject
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {subjects.map(subject => (
              <div
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                style={{
                  padding: '1.5rem',
                  background: selectedSubject === subject.id
                    ? `rgba(${subject.color === '#3B82F6' ? '59, 130, 246' : subject.color === '#10B981' ? '16, 185, 129' : subject.color === '#F59E0B' ? '245, 158, 11' : subject.color === '#8B5CF6' ? '139, 92, 246' : subject.color === '#EC4899' ? '236, 72, 153' : '20, 184, 166'}, 0.2)`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedSubject === subject.id
                    ? `2px solid ${subject.color}`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedSubject !== subject.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSubject !== subject.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>
                  {subject.icon}
                </div>
                <h4 style={{
                  color: '#EDEDED',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem'
                }}>
                  {subject.name}
                </h4>
                <p style={{
                  color: '#B19CD9',
                  fontSize: '0.85rem',
                  margin: 0
                }}>
                  {subject.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
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
            Select Difficulty Level
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {difficulties.map(diff => (
              <div
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                style={{
                  padding: '1.5rem',
                  background: selectedDifficulty === diff.id
                    ? `rgba(${diff.color === '#10B981' ? '16, 185, 129' : diff.color === '#F59E0B' ? '245, 158, 11' : '239, 68, 68'}, 0.2)`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedDifficulty === diff.id
                    ? `2px solid ${diff.color}`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedDifficulty !== diff.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDifficulty !== diff.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <h4 style={{
                  color: diff.color,
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  {diff.name}
                </h4>
                <p style={{
                  color: '#B19CD9',
                  fontSize: '0.9rem',
                  margin: 0
                }}>
                  {diff.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

        {/* Start Button */}
        <button
          onClick={startSession}
          disabled={!selectedSubject || !selectedDifficulty || loading}
          style={{
            width: '100%',
            padding: '1.25rem',
            background: selectedSubject && selectedDifficulty
              ? 'linear-gradient(45deg, #FFD700, #B19CD9)'
              : 'rgba(255, 255, 255, 0.1)',
            color: selectedSubject && selectedDifficulty ? '#2E1A47' : '#EDEDED',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: selectedSubject && selectedDifficulty ? 'pointer' : 'not-allowed',
            fontWeight: '700',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            opacity: selectedSubject && selectedDifficulty ? 1 : 0.5,
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? 'Starting Interview...' : (
            <>
              Start Interview <ArrowRight size={20} />
            </>
          )}
        </button>

        <audio ref={audioRef} style={{ display: 'none' }} />
      </div>
    );
  }

  // Interview View
  if (mode === 'interview') {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minHeight: '600px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{
              color: '#FFD700',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              {sessionInfo?.subject}
            </h2>
            <p style={{
              color: '#B19CD9',
              fontSize: '0.95rem',
              margin: 0
            }}>
              Question {currentQuestion?.question_number} of 5 • {sessionInfo?.difficulty}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem',
            border: `2px solid ${getTimeColor()}`
          }}>
            <Clock size={20} style={{ color: getTimeColor() }} />
            <span style={{
              color: getTimeColor(),
              fontSize: '1.2rem',
              fontWeight: '700'
            }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div style={{
          width: '100%',
          height: '0.5rem',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '0.25rem',
          marginBottom: '2rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(questionsAsked / 5) * 100}%`,
            height: '100%',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Question */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              color: '#EDEDED',
              fontSize: '1.2rem',
              fontWeight: '600',
              lineHeight: '1.6',
              margin: 0,
              flex: 1
            }}>
              {currentQuestion?.question_text}
            </h3>

            {currentQuestion?.audio_base64 && (
              <button
                onClick={() => audioRef.current?.play()}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#3B82F6',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  marginLeft: '1rem'
                }}
              >
                <Volume2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Answer Input */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            color: '#FFD700',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '0.75rem'
          }}>
            Your Answer
          </label>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here... (Minimum 100 words recommended)"
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: '0.75rem',
              color: '#EDEDED',
              fontSize: '1rem',
              lineHeight: '1.6',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            color: '#B19CD9',
            fontSize: '0.9rem'
          }}>
            <span>{answer.trim().split(/\s+/).filter(w => w).length} words</span>
            <span>Recommended: 100-150 words</span>
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

        {/* Submit Button */}
        <button
          onClick={handleSubmitAnswer}
          disabled={!answer.trim() || loading}
          style={{
            width: '100%',
            padding: '1.25rem',
            background: answer.trim()
              ? 'linear-gradient(45deg, #FFD700, #B19CD9)'
              : 'rgba(255, 255, 255, 0.1)',
            color: answer.trim() ? '#2E1A47' : '#EDEDED',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: answer.trim() ? 'pointer' : 'not-allowed',
            fontWeight: '700',
            fontSize: '1.1rem',
            opacity: answer.trim() ? 1 : 0.5
          }}
        >
          {loading ? 'Submitting...' : 'Submit Answer'}
        </button>

        <audio ref={audioRef} style={{ display: 'none' }} />
      </div>
    );
  }

  // Feedback View
  if (mode === 'feedback' && feedback) {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minHeight: '600px'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Award size={40} style={{ color: '#2E1A47' }} />
          </div>

          <h2 style={{
            color: '#FFD700',
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '0.5rem'
          }}>
            Answer Feedback
          </h2>

          <p style={{
            color: '#B19CD9',
            fontSize: '1rem'
          }}>
            Question {currentQuestion?.question_number} of 5
          </p>
        </div>

        {/* Overall Score */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: '700',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            {feedback.scores.overall}/10
          </div>
          <p style={{
            color: '#B19CD9',
            fontSize: '1.1rem',
            margin: 0
          }}>
            Overall Score
          </p>
        </div>

        {/* Detailed Scores */}
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
            marginBottom: '1rem'
          }}>
            Detailed Scores
          </h3>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Object.entries(feedback.scores).filter(([key]) => key !== 'overall').map(([key, value]) => (
              <div key={key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  color: '#EDEDED',
                  fontSize: '0.95rem',
                  textTransform: 'capitalize'
                }}>
                  {key.replace(/_/g, ' ')}
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '100px',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(value / 10) * 100}%`,
                      height: '100%',
                      background: value >= 7 ? '#10B981' : value >= 5 ? '#F59E0B' : '#EF4444'
                    }} />
                  </div>
                  <span style={{
                    color: '#FFD700',
                    fontWeight: '600',
                    minWidth: '40px',
                    textAlign: 'right'
                  }}>
                    {value}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        {feedback.strengths.length > 0 && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1rem',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <h3 style={{
              color: '#10B981',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle size={20} />
              Strengths
            </h3>
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              color: '#EDEDED',
              lineHeight: '1.8'
            }}>
              {feedback.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {feedback.improvements.length > 0 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <h3 style={{
              color: '#F59E0B',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <XCircle size={20} />
              Areas for Improvement
            </h3>
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              color: '#EDEDED',
              lineHeight: '1.8'
            }}>
              {feedback.improvements.map((improvement, index) => (
                <li key={index}>{improvement}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Feedback */}
        {feedback.detailed_feedback && (
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
              marginBottom: '1rem'
            }}>
              Detailed Feedback
            </h3>
            <p style={{
              color: '#B19CD9',
              fontSize: '0.95rem',
              lineHeight: '1.7',
              margin: 0
            }}>
              {feedback.detailed_feedback}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: 'flex',
          gap: '1rem'
        }}>
          {questionsAsked < 5 ? (
            <button
              onClick={loadNextQuestion}
              disabled={loading}
              style={{
                flex: 1,
                padding: '1.25rem',
                background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}
            >
              {loading ? 'Loading...' : (
                <>
                  Next Question <ArrowRight size={20} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={endSession}
              style={{
                flex: 1,
                padding: '1.25rem',
                background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
                color: '#2E1A47',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '1.1rem'
              }}
            >
              Complete Interview
            </button>
          )}

          <button
            onClick={resetInterview}
            style={{
              padding: '1.25rem 2rem',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#EDEDED',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  // Complete View
  if (mode === 'complete') {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <Award size={50} style={{ color: '#2E1A47' }} />
        </div>

        <h2 style={{
          color: '#FFD700',
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '1rem'
        }}>
          Interview Completed!
        </h2>

        <p style={{
          color: '#B19CD9',
          fontSize: '1.2rem',
          marginBottom: '3rem',
          maxWidth: '600px',
          lineHeight: '1.6'
        }}>
          Congratulations on completing your {sessionInfo?.subject} mock interview at {sessionInfo?.difficulty} level.
          You answered {questionsAsked} questions.
        </p>

        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '3rem',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          maxWidth: '600px'
        }}>
          <p style={{
            color: '#EDEDED',
            fontSize: '1rem',
            margin: 0,
            lineHeight: '1.6'
          }}>
            Your responses have been saved. Review your feedback to identify strengths and areas for improvement.
            Keep practicing to excel in your UPSC interview!
          </p>
        </div>

        <button
          onClick={resetInterview}
          style={{
            padding: '1.25rem 3rem',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            color: '#2E1A47',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '1.1rem'
          }}
        >
          Start New Interview
        </button>
      </div>
    );
  }

  return null;
};

export default MockInterview;

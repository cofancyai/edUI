import React, { useState, useEffect } from 'react';
import { Newspaper, Calendar, TrendingUp, Play, RefreshCw, Filter, ExternalLink, Award } from 'lucide-react';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';

interface Article {
  id?: number;
  title: string;
  content: string;
  link: string;
  published_date: string;
  source: string;
  rss_category: string;
  ai_category: string;
  created_at: string;
}

interface QuizQuestion {
  question: string;
  options: { [key: string]: string };
  correct_answer: string;
  explanation?: string;
}

interface CurrentAffairsProps {
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

const CurrentAffairs: React.FC<CurrentAffairsProps> = ({
  selectedLanguage = 'english',
  isAuthenticated = false
}) => {
  const [mode, setMode] = useState<'articles' | 'quiz'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [timeframe, setTimeframe] = useState<number>(7); // days
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  const API_BASE = 'https://prepnx-backend.vercel.app/api/current-affairs';

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch articles when filters change
  useEffect(() => {
    if (mode === 'articles') {
      fetchArticles();
    }
  }, [selectedCategory, timeframe, mode]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      const data = await response.json();
      if (data.status === 'success') {
        setCategories(['All', ...(data.categories || [])]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      params.append('days', timeframe.toString());
      params.append('limit', '50');

      const response = await fetch(`${API_BASE}/articles?${params.toString()}`);
      const data = await response.json();

      if (data.status === 'success') {
        setArticles(data.articles || []);
      } else {
        setError(data.message || 'Failed to fetch articles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    setQuizLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      params.append('timeframe', `${timeframe} days`);

      const response = await fetch(`${API_BASE}/quiz?${params.toString()}`);
      const data = await response.json();

      if (data.status === 'success' && data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        setMode('quiz');
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setQuizCompleted(false);
      } else {
        setError('No quiz questions generated. Try different filters.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (!quizCompleted) {
      setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach((question, index) => {
      if (userAnswers[index] === question.correct_answer) {
        correct++;
      }
    });
    return { correct, total: quizQuestions.length, percentage: (correct / quizQuestions.length) * 100 };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Mode Selection View
  if (mode === 'articles' && articles.length === 0 && !loading) {
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
          <Newspaper size={40} style={{ color: '#FFD700' }} />
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
              Current Affairs
            </h2>
            <p style={{
              color: '#B19CD9',
              fontSize: '1.05rem',
              margin: 0
            }}>
              Stay updated with latest news from trusted sources
            </p>
          </div>
        </div>

        {/* Mode Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Articles Mode */}
          <div
            onClick={fetchArticles}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '1rem',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(45deg, #3B82F6, #60A5FA)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Newspaper size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{
              color: '#60A5FA',
              fontSize: '1.4rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Latest Articles
            </h3>
            <p style={{
              color: '#EDEDED',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              Read curated news from Times of India, The Hindu, and Indian Express
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#60A5FA',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              View Articles →
            </div>
          </div>

          {/* Quiz Mode */}
          <div
            onClick={generateQuiz}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '1rem',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(45deg, #10B981, #34D399)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Play size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{
              color: '#34D399',
              fontSize: '1.4rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Take Quiz
            </h3>
            <p style={{
              color: '#EDEDED',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              Test your knowledge with AI-generated questions from recent news
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#34D399',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Start Quiz →
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div style={{
          background: 'rgba(255, 215, 0, 0.05)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <h3 style={{
            color: '#FFD700',
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <TrendingUp size={20} />
            Sources & Categories
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {[
              { text: 'Times of India', color: '#3B82F6' },
              { text: 'The Hindu', color: '#10B981' },
              { text: 'Indian Express', color: '#F59E0B' },
              { text: 'Politics & Economy', color: '#8B5CF6' },
              { text: 'International Affairs', color: '#EC4899' },
              { text: 'Sports & Science', color: '#14B8A6' }
            ].map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0.5rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: item.color
                }} />
                <span style={{ color: '#EDEDED', fontSize: '0.9rem' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Articles View
  if (mode === 'articles') {
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <Newspaper size={32} style={{ color: '#FFD700' }} />
            <h2 style={{
              color: '#FFD700',
              fontSize: '1.8rem',
              fontWeight: '700',
              margin: 0
            }}>
              Current Affairs
            </h2>
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={generateQuiz}
              disabled={quizLoading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(45deg, #10B981, #34D399)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: quizLoading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: quizLoading ? 0.6 : 1
              }}
            >
              <Play size={18} />
              {quizLoading ? 'Generating...' : 'Take Quiz'}
            </button>

            <button
              onClick={fetchArticles}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 215, 0, 0.1)',
                color: '#FFD700',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            color: '#FFD700'
          }}>
            <Filter size={18} />
            <span style={{ fontWeight: '600' }}>Filters</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {/* Category Filter */}
            <div>
              <label style={{
                display: 'block',
                color: '#B19CD9',
                fontSize: '0.9rem',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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
                {categories.map(cat => (
                  <option key={cat} value={cat} style={{ background: '#2E1A47' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Timeframe Filter */}
            <div>
              <label style={{
                display: 'block',
                color: '#B19CD9',
                fontSize: '0.9rem',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(Number(e.target.value))}
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
                <option value={1} style={{ background: '#2E1A47' }}>Last 24 hours</option>
                <option value={3} style={{ background: '#2E1A47' }}>Last 3 days</option>
                <option value={7} style={{ background: '#2E1A47' }}>Last 7 days</option>
                <option value={30} style={{ background: '#2E1A47' }}>Last 30 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingIndicator message="Loading articles..." />}

        {/* Error State */}
        {error && <ErrorMessage message={error} onRetry={fetchArticles} />}

        {/* Articles List */}
        {!loading && !error && articles.length > 0 && (
          <div style={{
            display: 'grid',
            gap: '1rem',
            maxHeight: '600px',
            overflowY: 'auto',
            paddingRight: '0.5rem'
          }}>
            {articles.map((article, index) => (
              <div
                key={article.id || index}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                  e.currentTarget.style.transform = 'translateX(5px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
                onClick={() => window.open(article.link, '_blank')}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60A5FA',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {article.ai_category || article.rss_category}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(255, 215, 0, 0.1)',
                      color: '#FFD700',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {article.source}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#B19CD9',
                    fontSize: '0.85rem'
                  }}>
                    <Calendar size={14} />
                    {formatDate(article.published_date)}
                  </div>
                </div>

                <h3 style={{
                  color: '#EDEDED',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  lineHeight: '1.4'
                }}>
                  {article.title}
                </h3>

                <p style={{
                  color: '#B19CD9',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  marginBottom: '0.75rem'
                }}>
                  {article.content.substring(0, 200)}...
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#3B82F6',
                  fontSize: '0.85rem',
                  fontWeight: '500'
                }}>
                  Read Full Article <ExternalLink size={14} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Articles */}
        {!loading && !error && articles.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#B19CD9'
          }}>
            <Newspaper size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No articles found for the selected filters</p>
          </div>
        )}
      </div>
    );
  }

  // Quiz View
  if (mode === 'quiz' && quizQuestions.length > 0) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const selectedAnswer = userAnswers[currentQuestionIndex];
    const score = quizCompleted ? calculateScore() : null;

    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minHeight: '600px'
      }}>
        {!quizCompleted ? (
          <>
            {/* Quiz Header */}
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
                  Current Affairs Quiz
                </h2>
                <p style={{
                  color: '#B19CD9',
                  fontSize: '0.95rem',
                  margin: 0
                }}>
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </p>
              </div>

              <button
                onClick={() => {
                  setMode('articles');
                  setQuizQuestions([]);
                  setQuizCompleted(false);
                  setCurrentQuestionIndex(0);
                  setUserAnswers({});
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  color: '#FFD700',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Back to Articles
              </button>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '0.25rem',
              marginBottom: '2rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`,
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
              <h3 style={{
                color: '#EDEDED',
                fontSize: '1.2rem',
                fontWeight: '600',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                {currentQuestion.question}
              </h3>

              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <div
                    key={key}
                    onClick={() => handleAnswerSelect(key)}
                    style={{
                      padding: '1.25rem',
                      background: selectedAnswer === key
                        ? 'rgba(255, 215, 0, 0.15)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: selectedAnswer === key
                        ? '2px solid #FFD700'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAnswer !== key) {
                        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAnswer !== key) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: selectedAnswer === key
                          ? 'linear-gradient(45deg, #FFD700, #B19CD9)'
                          : 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: selectedAnswer === key ? '#2E1A47' : '#EDEDED',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}>
                        {key}
                      </div>
                      <span style={{
                        color: '#EDEDED',
                        fontSize: '1rem',
                        lineHeight: '1.5'
                      }}>
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#EDEDED',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: currentQuestionIndex === 0 ? 0.5 : 1
                }}
              >
                Previous
              </button>

              <button
                onClick={goToNextQuestion}
                disabled={!selectedAnswer}
                style={{
                  padding: '0.75rem 2rem',
                  background: selectedAnswer
                    ? 'linear-gradient(45deg, #FFD700, #B19CD9)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: selectedAnswer ? '#2E1A47' : '#EDEDED',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: selectedAnswer ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '1rem',
                  opacity: selectedAnswer ? 1 : 0.5
                }}
              >
                {currentQuestionIndex === quizQuestions.length - 1 ? 'Submit Quiz' : 'Next Question'}
              </button>
            </div>
          </>
        ) : (
          /* Results View */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem'
            }}>
              <Award size={40} style={{ color: '#2E1A47' }} />
            </div>

            <h2 style={{
              color: '#FFD700',
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '1rem'
            }}>
              Quiz Completed!
            </h2>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.75rem',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid rgba(255, 215, 0, 0.2)'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: '700',
                background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                {score?.percentage.toFixed(0)}%
              </div>
              <p style={{
                color: '#B19CD9',
                fontSize: '1.1rem',
                margin: 0
              }}>
                You got {score?.correct} out of {score?.total} questions correct
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  setMode('articles');
                  setQuizQuestions([]);
                  setQuizCompleted(false);
                  setCurrentQuestionIndex(0);
                  setUserAnswers({});
                }}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
                  color: '#2E1A47',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                Back to Articles
              </button>

              <button
                onClick={generateQuiz}
                disabled={quizLoading}
                style={{
                  padding: '1rem 2rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#EDEDED',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  cursor: quizLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: quizLoading ? 0.6 : 1
                }}
              >
                <RefreshCw size={18} />
                {quizLoading ? 'Generating...' : 'Try Another Quiz'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default CurrentAffairs;

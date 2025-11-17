import React, { useState, useEffect } from 'react';
import {
  Brain, Target, Zap, TrendingUp, BookOpen, Award, BarChart3,
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Trophy,
  Eye, Filter
} from 'lucide-react';
import aptitudeService, { AptitudeCategory, AptitudeTopic, AptitudeQuestion } from '../services/aptitudeService';

interface AptitudeProps {
  studentPhone?: string | null;
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

type ViewMode = 'selectCategory' | 'selectFilters' | 'practice' | 'results' | 'review';

interface TestResults {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
  timeSpent: number;
  accuracy: string;
  questions: AptitudeQuestion[];
  userAnswers: Map<string, { questionId: string; answer: string; timeSpent: number; flagged: boolean }>;
}

const Aptitude: React.FC<AptitudeProps> = ({
  studentPhone,
  selectedLanguage = 'english',
  isAuthenticated = false
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('selectCategory');
  const [categories, setCategories] = useState<AptitudeCategory[]>([]);
  const [topics, setTopics] = useState<AptitudeTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AptitudeCategory | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Practice mode state
  const [attemptedQuestions, setAttemptedQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Map<number, string>>(new Map());
  const [testResults, setTestResults] = useState<TestResults | null>(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aptitudeService.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (category: AptitudeCategory) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedCategory(category);
      const topicsData = await aptitudeService.getTopics(category.id);
      setTopics(topicsData);
      setViewMode('selectFilters');
    } catch (err: any) {
      setError(err.message || 'Failed to load topics');
      console.error('Error loading topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const startPracticeMode = async () => {
    if (!selectedCategory) return;

    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        categoryId: selectedCategory.id,
        limit: 50,
        randomize: true
      };

      if (selectedTopics.length > 0) {
        // If specific topics selected, we'll need to fetch for each and combine
        const allQuestions: AptitudeQuestion[] = [];
        for (const topicId of selectedTopics) {
          const topicQuestions = await aptitudeService.getQuestions({
            ...filters,
            topicId
          });
          allQuestions.push(...topicQuestions);
        }
        setQuestions(allQuestions);
      } else {
        const questionsData = await aptitudeService.getQuestions(filters);
        setQuestions(questionsData);
      }

      if (filters.difficulty) {
        filters.difficulty = selectedDifficulty;
      }

      // Reset practice state
      setCurrentQuestionIndex(0);
      setAttemptedQuestions(new Set());
      setSelectedAnswer(null);
      setPracticeAnswers(new Map());
      setTestResults(null);

      setViewMode('practice');
    } catch (err: any) {
      setError(err.message || 'Failed to load questions');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionIndex: string) => {
    setSelectedAnswer(optionIndex);
    setAttemptedQuestions(prev => new Set(prev).add(currentQuestionIndex));
    setPracticeAnswers(prev => new Map(prev).set(currentQuestionIndex, optionIndex));
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    const previousAnswer = practiceAnswers.get(index);
    setSelectedAnswer(previousAnswer || null);
  };

  const submitPracticeTest = () => {
    let correct = 0;
    let incorrect = 0;
    let skipped = questions.length - attemptedQuestions.size;

    questions.forEach((q, index) => {
      const userAns = practiceAnswers.get(index);
      if (userAns) {
        if (userAns === q.answer) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    const results = {
      correct,
      incorrect,
      skipped,
      total: questions.length,
      timeSpent: 0,
      accuracy: questions.length > 0 ? ((correct / questions.length) * 100).toFixed(1) : '0',
      questions: questions,
      userAnswers: new Map(Array.from(practiceAnswers.entries()).map(([index, answer]) => [
        questions[index].id,
        { questionId: questions[index].id, answer, timeSpent: 0, flagged: false }
      ]))
    };

    setTestResults(results);
    setViewMode('results');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Render Category Selection
  const renderCategorySelection = () => {
    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading categories...</div>;
    if (error) return <div style={{ color: '#EF4444', textAlign: 'center', padding: '2rem' }}>Error: {error}</div>;

    return (
      <div>
        {/* Header */}
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
              marginBottom: '0.5rem'
            }}>
              Aptitude Training
            </h2>
            <p style={{ color: '#B19CD9', fontSize: '1.05rem', margin: 0 }}>
              Select a category to start practicing
            </p>
          </div>
        </div>

        {/* Category Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategorySelect(category)}
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
                fontSize: '3rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {category.icon || '📚'}
              </div>
              <h3 style={{
                color: '#60A5FA',
                fontSize: '1.3rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                textAlign: 'center'
              }}>
                {category.name}
              </h3>
              <p style={{
                color: '#D1D5DB',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                textAlign: 'center'
              }}>
                {category.description || 'Practice questions'}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Filter Selection
  const renderFilterSelection = () => {
    return (
      <div>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => setViewMode('selectCategory')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}
          >
            <ChevronLeft size={20} />
            Back to Categories
          </button>

          <h2 style={{ color: '#FFD700', fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            {selectedCategory?.name}
          </h2>
          <p style={{ color: '#B19CD9', fontSize: '1rem' }}>
            Select topics and difficulty to practice
          </p>
        </div>

        {/* Topics Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#FFD700', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} />
            Topics {topics.length > 0 && `(${topics.length})`}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {topics.map((topic) => {
              const isSelected = selectedTopics.includes(topic.id);
              return (
                <div
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopics(prev =>
                      isSelected ? prev.filter(id => id !== topic.id) : [...prev, topic.id]
                    );
                  }}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: isSelected ? '2px solid rgba(59, 130, 246, 0.6)' : '2px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: isSelected ? '#3B82F6' : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isSelected && <CheckCircle size={16} color="white" />}
                    </div>
                    <span style={{ color: isSelected ? '#60A5FA' : '#D1D5DB', fontSize: '0.95rem', fontWeight: isSelected ? '600' : 'normal' }}>
                      {topic.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {topics.length === 0 && (
            <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No topics available for this category</p>
          )}
        </div>

        {/* Difficulty Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#FFD700', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Difficulty Level
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {['', 'easy', 'medium', 'hard'].map((difficulty) => {
              const isSelected = selectedDifficulty === difficulty;
              const label = difficulty === '' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
              return (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  style={{
                    padding: '0.75rem 2rem',
                    borderRadius: '0.5rem',
                    background: isSelected ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 'rgba(255, 255, 255, 0.05)',
                    border: isSelected ? 'none' : '1px solid rgba(255, 215, 0, 0.3)',
                    color: isSelected ? '#1a1a4e' : '#FFD700',
                    cursor: 'pointer',
                    fontWeight: isSelected ? '700' : '500',
                    fontSize: '1rem',
                    transition: 'all 0.3s'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startPracticeMode}
          disabled={loading}
          style={{
            padding: '1.25rem 3rem',
            borderRadius: '0.75rem',
            background: loading ? 'rgba(156, 163, 175, 0.3)' : 'linear-gradient(135deg, #FFD700, #FFA500)',
            border: 'none',
            color: '#1a1a4e',
            fontSize: '1.25rem',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(255, 215, 0, 0.4)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 215, 0, 0.4)';
            }
          }}
        >
          <Brain size={24} />
          {loading ? 'Loading Questions...' : 'Start Practice'}
        </button>
      </div>
    );
  };

  // Render Practice Mode (similar to ExamBot)
  const renderPractice = () => {
    if (questions.length === 0) {
      return (
        <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>No questions found for selected filters</p>
          <button
            onClick={() => setViewMode('selectFilters')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              color: '#1a1a4e',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Change Filters
          </button>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((attemptedQuestions.size / questions.length) * 100).toFixed(0);

    return (
      <div style={{ display: 'flex', gap: '1.5rem', minHeight: '600px' }}>
        {/* Left Sidebar - Statistics & Navigation */}
        <div style={{
          width: '280px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Statistics */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid rgba(255, 215, 0, 0.2)'
          }}>
            <h3 style={{ color: '#FFD700', fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
              Statistics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ color: '#D1D5DB', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total</div>
                <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>{questions.length}</div>
              </div>
              <div>
                <div style={{ color: '#D1D5DB', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Attempted</div>
                <div style={{ color: '#10B981', fontSize: '1.5rem', fontWeight: 'bold' }}>{attemptedQuestions.size}</div>
              </div>
              <div>
                <div style={{ color: '#D1D5DB', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Pending</div>
                <div style={{ color: '#9CA3AF', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {questions.length - attemptedQuestions.size}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ color: '#D1D5DB', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Progress: {progress}%
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          </div>

          {/* Question Palette */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            flex: 1
          }}>
            <h3 style={{ color: '#FFD700', fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
              Questions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem'
            }}>
              {questions.map((_, index) => {
                const isAttempted = attemptedQuestions.has(index);
                const isCurrent = index === currentQuestionIndex;
                return (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '0.5rem',
                      border: isCurrent ? '2px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: isCurrent
                        ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                        : isAttempted
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: isCurrent ? '#1a1a4e' : isAttempted ? '#10B981' : '#D1D5DB',
                      cursor: 'pointer',
                      fontWeight: isCurrent ? '700' : '500',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* End Test Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to end this practice session?')) {
                submitPracticeTest();
              }
            }}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#EF4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <XCircle size={20} />
            End Test
          </button>
        </div>

        {/* Main Content - Question Display */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '1rem',
            borderBottom: '2px solid rgba(255, 215, 0, 0.2)'
          }}>
            <div>
              <h2 style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
              <p style={{ color: '#B19CD9', fontSize: '0.9rem' }}>
                {selectedCategory?.name}
              </p>
            </div>
            {currentQuestion.difficulty && (
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#3B82F6',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {currentQuestion.difficulty}
              </span>
            )}
          </div>

          {/* Question Text */}
          <div style={{
            padding: '2rem',
            borderRadius: '0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)'
          }}>
            <p style={{ color: 'white', fontSize: '1.125rem', lineHeight: '1.8' }}>
              {currentQuestion.question}
            </p>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentQuestion.options && currentQuestion.options.map((option, index) => {
              const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = selectedAnswer === optionLetter;

              return (
                <div
                  key={index}
                  onClick={() => handleOptionSelect(optionLetter)}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    background: isSelected ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: isSelected ? '2px solid #FFD700' : '2px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {/* Circular Badge */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isSelected ? '#FFD700' : 'rgba(255, 255, 255, 0.1)',
                    color: isSelected ? '#1a1a4e' : '#FFD700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {optionLetter}
                  </div>

                  <span style={{
                    color: isSelected ? '#FFD700' : 'white',
                    fontSize: '1rem',
                    flex: 1,
                    fontWeight: isSelected ? '600' : 'normal'
                  }}>
                    {option}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1.5rem' }}>
            <button
              onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                background: currentQuestionIndex === 0 ? 'rgba(156, 163, 175, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                color: currentQuestionIndex === 0 ? '#9CA3AF' : 'white',
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600'
              }}
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            {currentQuestionIndex === questions.length - 1 && attemptedQuestions.size === questions.length ? (
              <button
                onClick={() => {
                  if (window.confirm('Submit test and view results?')) {
                    submitPracticeTest();
                  }
                }}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '0.5rem',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '700',
                  fontSize: '1rem'
                }}
              >
                <CheckCircle size={20} />
                Submit
              </button>
            ) : (
              <button
                onClick={() => goToQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  background: currentQuestionIndex === questions.length - 1 ? 'rgba(156, 163, 175, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  color: currentQuestionIndex === questions.length - 1 ? '#9CA3AF' : 'white',
                  cursor: currentQuestionIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600'
                }}
              >
                Next
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Results (similar to ExamBot)
  const renderResults = () => {
    if (!testResults) return null;

    const scorePercentage = parseFloat(testResults.accuracy);
    const performanceMessage = scorePercentage >= 80 ? 'Excellent!' : scorePercentage >= 60 ? 'Good Job!' : scorePercentage >= 40 ? 'Keep Practicing!' : 'Don\'t Give Up!';

    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Results Header */}
        <div style={{
          padding: '3rem 2rem',
          borderRadius: '1.5rem',
          background: 'linear-gradient(135deg, rgba(30, 26, 71, 0.95) 0%, rgba(46, 26, 71, 0.95) 100%)',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <Trophy size={80} color="#FFD700" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ color: '#FFD700', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Practice Completed!
          </h2>
          <p style={{ color: '#D1D5DB', fontSize: '1.25rem', marginBottom: '2rem' }}>
            {performanceMessage}
          </p>

          {/* Large Accuracy Circle */}
          <div style={{
            width: '200px',
            height: '200px',
            margin: '0 auto',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)',
            border: '4px solid #FFD700',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(255, 215, 0, 0.4)'
          }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#FFD700', lineHeight: 1 }}>
              {testResults.accuracy}%
            </div>
            <div style={{ fontSize: '0.875rem', color: '#D1D5DB', marginTop: '0.5rem' }}>
              Accuracy
            </div>
          </div>
        </div>

        {/* Score Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {/* Correct */}
          <div style={{
            padding: '1.5rem 2rem',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={36} color="#10B981" />
              </div>
              <div>
                <p style={{ color: '#D1D5DB', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Correct Answers</p>
                <p style={{ color: '#10B981', fontSize: '2rem', fontWeight: 'bold' }}>{testResults.correct}</p>
              </div>
            </div>
            <div style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              fontSize: '1.125rem',
              fontWeight: '600'
            }}>
              {testResults.total > 0 ? Math.round((testResults.correct / testResults.total) * 100) : 0}%
            </div>
          </div>

          {/* Incorrect */}
          <div style={{
            padding: '1.5rem 2rem',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <XCircle size={36} color="#EF4444" />
              </div>
              <div>
                <p style={{ color: '#D1D5DB', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Incorrect Answers</p>
                <p style={{ color: '#EF4444', fontSize: '2rem', fontWeight: 'bold' }}>{testResults.incorrect}</p>
              </div>
            </div>
            <div style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '1.125rem',
              fontWeight: '600'
            }}>
              {testResults.total > 0 ? Math.round((testResults.incorrect / testResults.total) * 100) : 0}%
            </div>
          </div>

          {/* Skipped */}
          {testResults.skipped > 0 && (
            <div style={{
              padding: '1.5rem 2rem',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.15) 0%, rgba(107, 114, 128, 0.15) 100%)',
              border: '2px solid rgba(156, 163, 175, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(156, 163, 175, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clock size={36} color="#9CA3AF" />
                </div>
                <div>
                  <p style={{ color: '#D1D5DB', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Skipped Questions</p>
                  <p style={{ color: '#9CA3AF', fontSize: '2rem', fontWeight: 'bold' }}>{testResults.skipped}</p>
                </div>
              </div>
              <div style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '9999px',
                background: 'rgba(156, 163, 175, 0.3)',
                color: '#9CA3AF',
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>
                {testResults.total > 0 ? Math.round((testResults.skipped / testResults.total) * 100) : 0}%
              </div>
            </div>
          )}
        </div>

        {/* Session Details */}
        <div style={{
          padding: '2rem',
          borderRadius: '1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#FFD700', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Session Details
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <BookOpen size={32} color="#FFD700" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ color: '#D1D5DB', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Questions</p>
              <p style={{ color: 'white', fontSize: '1.75rem', fontWeight: 'bold' }}>{testResults.total}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Trophy size={32} color="#FFD700" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ color: '#D1D5DB', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Your Score</p>
              <p style={{ color: '#FFD700', fontSize: '1.75rem', fontWeight: 'bold' }}>
                {testResults.correct}/{testResults.total}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setViewMode('review')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '1.25rem 2rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#1a1a4e',
              fontSize: '1.125rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 4px 16px rgba(255, 215, 0, 0.4)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 215, 0, 0.4)';
            }}
          >
            <Eye size={24} />
            Review Answers
          </button>

          <button
            onClick={() => {
              setAttemptedQuestions(new Set());
              setPracticeAnswers(new Map());
              setTestResults(null);
              setViewMode('selectFilters');
            }}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '1.25rem 2rem',
              borderRadius: '0.75rem',
              border: '2px solid rgba(255, 215, 0, 0.5)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#FFD700',
              fontSize: '1.125rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <Brain size={24} />
            Practice Again
          </button>
        </div>
      </div>
    );
  };

  // Render Review (similar to ExamBot)
  const renderReview = () => {
    if (!testResults) return null;

    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button
            onClick={() => setViewMode('results')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
            }}
          >
            <ChevronLeft size={20} />
            Back to Results
          </button>

          <h2 style={{ color: '#FFD700', fontSize: '2rem', fontWeight: 'bold', textAlign: 'center' }}>
            Review Answers
          </h2>

          <div style={{ width: '140px' }} />
        </div>

        {/* Questions Review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {testResults.questions.map((question: AptitudeQuestion, index: number) => {
            const userAnswer = testResults.userAnswers.get(question.id);
            const isCorrect = userAnswer?.answer === question.answer;
            const isSkipped = !userAnswer || !userAnswer.answer;

            const borderColor = isCorrect
              ? '2px solid rgba(16, 185, 129, 0.5)'
              : isSkipped
              ? '2px solid rgba(156, 163, 175, 0.4)'
              : '2px solid rgba(239, 68, 68, 0.5)';

            const bgGradient = isCorrect
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)'
              : isSkipped
              ? 'linear-gradient(135deg, rgba(156, 163, 175, 0.08) 0%, rgba(107, 114, 128, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.08) 100%)';

            return (
              <div
                key={question.id}
                style={{
                  padding: '2rem',
                  borderRadius: '1.25rem',
                  background: bgGradient,
                  border: borderColor,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                {/* Question Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: isCorrect
                        ? 'rgba(16, 185, 129, 0.3)'
                        : isSkipped
                        ? 'rgba(156, 163, 175, 0.3)'
                        : 'rgba(239, 68, 68, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isCorrect ? (
                        <CheckCircle size={28} color="#10B981" />
                      ) : isSkipped ? (
                        <Clock size={28} color="#9CA3AF" />
                      ) : (
                        <XCircle size={28} color="#EF4444" />
                      )}
                    </div>

                    <div>
                      <div style={{ color: '#D1D5DB', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        Question {index + 1}
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: isCorrect ? '#10B981' : isSkipped ? '#9CA3AF' : '#EF4444'
                      }}>
                        {isCorrect ? '✓ Correct' : isSkipped ? '⊘ Skipped' : '✗ Incorrect'}
                      </div>
                    </div>
                  </div>

                  {question.difficulty && (
                    <span style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '9999px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#3B82F6',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      {question.difficulty}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <div style={{
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ color: 'white', fontSize: '1.125rem', lineHeight: '1.8' }}>
                    {question.question}
                  </p>
                </div>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {question.options && question.options.map((option, optIndex) => {
                    const optionLetter = String.fromCharCode(65 + optIndex);
                    const isUserAnswer = userAnswer?.answer === optionLetter;
                    const isCorrectAnswer = question.answer === optionLetter;

                    let optionBg, optionBorder, badgeBg, badgeColor;

                    if (isCorrectAnswer) {
                      optionBg = 'rgba(16, 185, 129, 0.2)';
                      optionBorder = '2px solid rgba(16, 185, 129, 0.6)';
                      badgeBg = '#10B981';
                      badgeColor = '#FFFFFF';
                    } else if (isUserAnswer && !isCorrectAnswer) {
                      optionBg = 'rgba(239, 68, 68, 0.2)';
                      optionBorder = '2px solid rgba(239, 68, 68, 0.6)';
                      badgeBg = '#EF4444';
                      badgeColor = '#FFFFFF';
                    } else {
                      optionBg = 'rgba(255, 255, 255, 0.05)';
                      optionBorder = '2px solid rgba(255, 255, 255, 0.1)';
                      badgeBg = 'rgba(255, 255, 255, 0.1)';
                      badgeColor = '#D1D5DB';
                    }

                    return (
                      <div
                        key={optIndex}
                        style={{
                          padding: '1.25rem',
                          borderRadius: '0.75rem',
                          background: optionBg,
                          border: optionBorder,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem'
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: badgeBg,
                          color: badgeColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.125rem',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          {optionLetter}
                        </div>

                        <span style={{
                          color: isCorrectAnswer || isUserAnswer ? (isCorrectAnswer ? '#10B981' : '#EF4444') : 'white',
                          fontSize: '1rem',
                          flex: 1,
                          fontWeight: (isCorrectAnswer || isUserAnswer) ? '600' : 'normal'
                        }}>
                          {option}
                        </span>

                        {isCorrectAnswer && (
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <CheckCircle size={20} color="#10B981" />
                          </div>
                        )}
                        {isUserAnswer && !isCorrectAnswer && (
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <XCircle size={20} color="#EF4444" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Answer Summary */}
                {!isCorrect && (
                  <div style={{
                    padding: '1rem 1.5rem',
                    borderRadius: '0.75rem',
                    background: isSkipped ? 'rgba(156, 163, 175, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: isSkipped ? '1px solid rgba(156, 163, 175, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    marginBottom: '1rem'
                  }}>
                    <p style={{
                      color: isSkipped ? '#9CA3AF' : '#EF4444',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      {isSkipped
                        ? '⊘ You did not answer this question'
                        : `✗ Your Answer: ${userAnswer?.answer} (Incorrect) • Correct Answer: ${question.answer}`
                      }
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {question.detailed_explanation && (
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%)',
                    border: '2px solid rgba(255, 215, 0, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <BookOpen size={20} color="#FFD700" />
                      <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#FFD700' }}>
                        Explanation
                      </p>
                    </div>
                    <p style={{ color: '#D1D5DB', fontSize: '0.9375rem', lineHeight: '1.7' }}>
                      {question.detailed_explanation}
                    </p>
                  </div>
                )}

                {/* Formula & Shortcut */}
                {(question.formula || question.shortcut_method) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    {question.formula && (
                      <div style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)'
                      }}>
                        <p style={{ color: '#A78BFA', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                          Formula:
                        </p>
                        <p style={{ color: '#D1D5DB', fontSize: '0.9rem' }}>
                          {question.formula}
                        </p>
                      </div>
                    )}
                    {question.shortcut_method && (
                      <div style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        <p style={{ color: '#34D399', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                          Shortcut Method:
                        </p>
                        <p style={{ color: '#D1D5DB', fontSize: '0.9rem' }}>
                          {question.shortcut_method}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      minHeight: '600px'
    }}>
      {viewMode === 'selectCategory' && renderCategorySelection()}
      {viewMode === 'selectFilters' && renderFilterSelection()}
      {viewMode === 'practice' && renderPractice()}
      {viewMode === 'results' && renderResults()}
      {viewMode === 'review' && renderReview()}
    </div>
  );
};

export default Aptitude;

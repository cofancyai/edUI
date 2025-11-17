import React, { useState, useEffect } from 'react';
import {
  BookOpen, Calendar, Filter, Bookmark, Play,
  Clock, CheckCircle, XCircle, Flag, RotateCcw, Eye,
  Trophy, TrendingUp, ChevronRight, ChevronLeft, X
} from 'lucide-react';
import LoadingIndicator from '../LoadingIndicator';
import ErrorMessage from '../ErrorMessage';
import { examBotService, supabase, Question, ExamCategory } from '../../services/examBotService';

interface ExamBotProps {
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

interface Filters {
  exam: string;
  subjects: string[];    // Multi-select
  topics: string[];      // Multi-select
  subtopics: string[];   // Multi-select
  years: number[];       // Multi-select
  difficulties: string[]; // Multi-select
}

interface TestSession {
  questions: Question[];
  startTime: number;
  timeLimit?: number;
  filters: Filters;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  timeSpent: number;
  flagged: boolean;
}

type ViewMode = 'selectExam' | 'selectFilters' | 'browse' | 'practice' | 'test' | 'results' | 'review';

const ExamBot: React.FC<ExamBotProps> = () => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('selectExam');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data from Supabase
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    exam: '',
    subjects: [],
    topics: [],
    subtopics: [],
    years: [],
    difficulties: []
  });

  // Test session
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [testResults, setTestResults] = useState<any>(null);

  // Track attempted questions in practice mode
  const [attemptedQuestions, setAttemptedQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Timer for test mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testSession && viewMode === 'test') {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - testSession.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testSession, viewMode]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all exam categories from database
      const allExams = await examBotService.getExamCategories();

      // Get unique exams that have questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('exam');

      const examsWithQuestions = [...new Set(questionsData?.map(q => q.exam))];

      // Filter to only show exams that have questions
      const filteredExams = allExams.filter(exam =>
        examsWithQuestions.includes(exam.category_name)
      );

      setExamCategories(filteredExams);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      setLoading(false);
    }
  };

  // Update available filters when exam changes
  useEffect(() => {
    if (filters.exam) {
      loadExamFilters(filters.exam);
    }
  }, [filters.exam]);

  // No longer needed - we show all available years with checkboxes

  // Update subtopics when topic changes (currently not used in multi-select flow)
  // useEffect(() => {
  //   if (filters.topics.length > 0) {
  //     loadSubtopics(filters.topics[0]);
  //   }
  // }, [filters.topics]);

  const loadExamFilters = async (exam: string) => {
    try {
      setLoading(true);

      // Get available years for this exam
      const years = await examBotService.getAvailableYears(exam);
      setAvailableYears(years);

      // Get available subjects for this exam
      const subjects = await examBotService.getSubjectsByExam(exam);
      setAvailableSubjects(subjects);

      // Topics are not used in current multi-select flow
      // const topicsList = await examBotService.getTopicsByExamAndSubject(exam, '');
      // const topicIds = topicsList.map(t => t.topic_id);
      // const filtered = topics.filter(t => topicIds.includes(t.id));

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading exam filters:', err);
      setLoading(false);
    }
  };

  // Removed unused functions: loadSubtopics, loadYearsForExam, loadYearsForSubject
  // (not needed in current multi-select flow)

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all questions for the exam
      const queryFilters: any = {};
      if (filters.exam) queryFilters.exam = filters.exam;

      let fetchedQuestions = await examBotService.getQuestions(queryFilters);

      // Client-side filtering for multi-select
      if (filters.subjects.length > 0) {
        fetchedQuestions = fetchedQuestions.filter(q => filters.subjects.includes(q.subject));
      }

      if (filters.topics.length > 0) {
        fetchedQuestions = fetchedQuestions.filter(q => filters.topics.includes(q.topic_id));
      }

      if (filters.subtopics.length > 0) {
        fetchedQuestions = fetchedQuestions.filter(q => filters.subtopics.includes(q.subtopic_id));
      }

      if (filters.years.length > 0) {
        fetchedQuestions = fetchedQuestions.filter(q => q.year && filters.years.includes(q.year));
      }

      if (filters.difficulties.length > 0) {
        fetchedQuestions = fetchedQuestions.filter(q => q.difficulty && filters.difficulties.includes(q.difficulty));
      }

      setQuestions(fetchedQuestions);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load questions');
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };

      // Reset dependent filters
      if (key === 'exam') {
        newFilters.subjects = [];
        newFilters.topics = [];
        newFilters.subtopics = [];
        newFilters.years = [];
        newFilters.difficulties = [];
      }

      return newFilters;
    });
  };

  // Helper: Toggle item in array (for multi-select)
  const toggleArrayItem = <T,>(array: T[], item: T): T[] => {
    return array.includes(item) ? array.filter(i => i !== item) : [...array, item];
  };

  const startPracticeMode = async () => {
    if (!filters.exam) {
      setError('Please select an exam first');
      return;
    }

    await loadQuestions();
    setCurrentQuestionIndex(0);
    setAttemptedQuestions(new Set());
    setSelectedAnswer(null);
    setViewMode('practice');
  };

  // startTest function removed - test mode available in test view

  const answerQuestion = (questionId: string, answer: string) => {
    const newAnswers = new Map(userAnswers);
    newAnswers.set(questionId, {
      questionId,
      answer,
      timeSpent: timeElapsed,
      flagged: newAnswers.get(questionId)?.flagged || false
    });
    setUserAnswers(newAnswers);
  };

  const toggleFlag = (questionId: string) => {
    const newAnswers = new Map(userAnswers);
    const existing = newAnswers.get(questionId);
    newAnswers.set(questionId, {
      questionId,
      answer: existing?.answer || '',
      timeSpent: existing?.timeSpent || 0,
      flagged: !existing?.flagged
    });
    setUserAnswers(newAnswers);
  };

  const submitTest = () => {
    if (!testSession) return;

    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    testSession.questions.forEach(q => {
      const userAns = userAnswers.get(q.id);
      if (!userAns || !userAns.answer) {
        skipped++;
      } else if (userAns.answer === q.answer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const results = {
      correct,
      incorrect,
      skipped,
      total: testSession.questions.length,
      timeSpent: timeElapsed,
      accuracy: ((correct / testSession.questions.length) * 100).toFixed(1),
      questions: testSession.questions,
      userAnswers
    };

    setTestResults(results);
    setViewMode('results');
  };

  const toggleBookmark = async (questionId: string) => {
    try {
      // TODO: Implement with Supabase when user auth is set up
      // For now, use localStorage
      const bookmarks = JSON.parse(localStorage.getItem('exambot_bookmarks') || '[]');
      const index = bookmarks.indexOf(questionId);

      if (index > -1) {
        bookmarks.splice(index, 1);
      } else {
        bookmarks.push(questionId);
      }

      localStorage.setItem('exambot_bookmarks', JSON.stringify(bookmarks));

      // Update questions state
      setQuestions(prev => prev.map(q =>
        q.id === questionId ? { ...q, bookmarked: index === -1 } : q
      ));
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Handler: Submit exam selection
  const handleExamSubmit = async () => {
    if (!filters.exam) {
      setError('Please select an exam');
      return;
    }
    setError(null);
    setViewMode('selectFilters');
    await loadExamFilters(filters.exam);
  };

  // Render functions for different views
  // Render: Exam Selection Screen (Step 1) - Dropdown
  const renderExamSelection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          padding: "2rem",
          borderRadius: "1rem",
          background: 'linear-gradient(135deg, rgba(30, 26, 71, 0.95) 0%, rgba(46, 26, 71, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#FFD700' }}>
          Welcome to ExamBot
        </h1>
        <p style={{ color: '#D1D5DB', fontSize: '1.125rem' }}>
          Select an exam to start practicing
        </p>
      </div>

      {/* Exam Selection Form */}
      <div
        style={{
          padding: "2rem",
          borderRadius: "1rem",
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: "block", fontSize: "1rem", fontWeight: '600', color: "#FFD700", marginBottom: "0.75rem" }}>
            Select Exam
          </label>
          <select
            value={filters.exam}
            onChange={(e) => handleFilterChange('exam', e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              fontSize: '1rem',
              borderRadius: "0.5rem",
              outline: "none",
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="" style={{ background: '#1a1a4e', color: 'white' }}>Select Exam</option>
            {examCategories.map(exam => (
              <option key={exam.id} value={exam.category_name} style={{ background: '#1a1a4e', color: 'white' }}>
                {exam.category_name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExamSubmit}
          disabled={!filters.exam}
          style={{
            width: '100%',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: filters.exam ? 'pointer' : 'not-allowed',
            border: 'none',
            background: filters.exam ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'rgba(255, 255, 255, 0.1)',
            color: filters.exam ? '#1a1a4e' : '#666',
            transition: 'all 0.3s',
            boxShadow: filters.exam ? '0 4px 16px rgba(255, 215, 0, 0.3)' : 'none'
          }}
        >
          <ChevronRight size={20} />
          Submit
        </button>
      </div>
    </div>
  );

  // Render: Filter Selection Screen (Step 2) - Multi-Select Checkboxes
  const renderFilterSelection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => {
            setViewMode('selectExam');
            setFilters({
              exam: '',
              subjects: [],
              topics: [],
              subtopics: [],
              years: [],
              difficulties: []
            });
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#FFD700', margin: 0 }}>
            {filters.exam}
          </h1>
          <p style={{ color: '#D1D5DB', fontSize: '0.875rem', margin: 0 }}>
            Select multiple filters (checkboxes) and click Submit
          </p>
        </div>
      </div>

      {/* Filters Container */}
      <div
        style={{
          padding: "2rem",
          borderRadius: "1rem",
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Subjects Multi-Select */}
          {availableSubjects.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#FFD700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={20} />
                Subjects ({filters.subjects.length} selected)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {availableSubjects.map(subject => (
                  <label
                    key={subject}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: filters.subjects.includes(subject) ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${filters.subjects.includes(subject) ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filters.subjects.includes(subject)}
                      onChange={() => setFilters(prev => ({ ...prev, subjects: toggleArrayItem(prev.subjects, subject) }))}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#FFD700',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ color: 'white', fontSize: '0.9375rem' }}>{subject}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Years Multi-Select */}
          {availableYears.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#FFD700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} />
                Years ({filters.years.length} selected)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {availableYears.map(year => (
                  <label
                    key={year}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: filters.years.includes(year) ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${filters.years.includes(year) ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filters.years.includes(year)}
                      onChange={() => setFilters(prev => ({ ...prev, years: toggleArrayItem(prev.years, year) }))}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#FFD700',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ color: 'white', fontSize: '0.9375rem' }}>{year}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Multi-Select */}
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#FFD700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} />
              Difficulty ({filters.difficulties.length} selected)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Easy', 'Medium', 'Hard'].map(difficulty => (
                <label
                  key={difficulty}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: filters.difficulties.includes(difficulty) ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${filters.difficulties.includes(difficulty) ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters.difficulties.includes(difficulty)}
                    onChange={() => setFilters(prev => ({ ...prev, difficulties: toggleArrayItem(prev.difficulties, difficulty) }))}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#FFD700',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ color: 'white', fontSize: '0.9375rem' }}>{difficulty}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Filters Summary */}
        {(filters.subjects.length > 0 || filters.years.length > 0 || filters.difficulties.length > 0) && (
          <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#FFD700', marginBottom: '0.75rem' }}>Selected Filters:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {filters.subjects.map(subject => (
                <span key={subject} style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(255, 215, 0, 0.2)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {subject}
                  <X
                    size={14}
                    onClick={() => setFilters(prev => ({ ...prev, subjects: prev.subjects.filter(s => s !== subject) }))}
                    style={{ cursor: 'pointer' }}
                  />
                </span>
              ))}
              {filters.years.map(year => (
                <span key={year} style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(255, 215, 0, 0.2)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {year}
                  <X
                    size={14}
                    onClick={() => setFilters(prev => ({ ...prev, years: prev.years.filter(y => y !== year) }))}
                    style={{ cursor: 'pointer' }}
                  />
                </span>
              ))}
              {filters.difficulties.map(difficulty => (
                <span key={difficulty} style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(255, 215, 0, 0.2)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {difficulty}
                  <X
                    size={14}
                    onClick={() => setFilters(prev => ({ ...prev, difficulties: prev.difficulties.filter(d => d !== difficulty) }))}
                    style={{ cursor: 'pointer' }}
                  />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button
            onClick={startPracticeMode}
            disabled={loading}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              background: loading ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: loading ? '#666' : '#1a1a4e',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(255, 215, 0, 0.3)'
            }}
          >
            <Play size={20} />
            Start Practice
          </button>

          <button
            onClick={() => {
              setFilters(prev => ({ ...prev, subjects: [], years: [], difficulties: [] }));
            }}
            style={{
              padding: '1rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              transition: 'all 0.3s'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );

  const renderPractice = () => {
    // No questions found case
    if (questions.length === 0) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setViewMode('selectFilters');
                setCurrentQuestionIndex(0);
              }}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                color: 'white'
              }}
            >
              <ChevronLeft size={20} />
              Back
            </button>
          </div>

          <div
            className="p-12 rounded-xl text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <BookOpen size={64} color="#666" className="mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No questions found for selected filters</p>
            <button
              onClick={() => setViewMode('selectFilters')}
              className="mt-4 px-6 py-2 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#1a1a4e'
              }}
            >
              Change Filters
            </button>
          </div>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];

    // Handle option selection
    const handleOptionSelect = (optionIndex: string) => {
      setSelectedAnswer(optionIndex);
      setAttemptedQuestions(prev => new Set(prev).add(currentQuestionIndex));
    };

    // Navigate to specific question
    const goToQuestion = (index: number) => {
      setCurrentQuestionIndex(index);
      setSelectedAnswer(null);
    };

    // Calculate stats
    const pendingCount = questions.length - attemptedQuestions.size;
    const bookmarkedCount = questions.filter(q => q.bookmarked).length;

    return (
      <div style={{ display: 'flex', gap: '1.5rem', minHeight: '600px' }}>
        {/* Left Sidebar: Question Palette */}
        <div style={{ width: '280px', flexShrink: 0 }}>
          {/* Statistics */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              marginBottom: '1.5rem'
            }}
          >
            <h3 style={{ color: '#FFD700', fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Statistics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#D1D5DB', fontSize: '0.875rem' }}>Total</span>
                <span style={{ color: 'white', fontWeight: '600' }}>{questions.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#10B981', fontSize: '0.875rem' }}>Attempted</span>
                <span style={{ color: '#10B981', fontWeight: '600' }}>{attemptedQuestions.size}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#F59E0B', fontSize: '0.875rem' }}>Pending</span>
                <span style={{ color: '#F59E0B', fontWeight: '600' }}>{pendingCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#B19CD9', fontSize: '0.875rem' }}>Bookmarked</span>
                <span style={{ color: '#B19CD9', fontWeight: '600' }}>{bookmarkedCount}</span>
              </div>
            </div>
          </div>

          {/* Question Palette */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              maxHeight: 'calc(100vh - 400px)',
              overflowY: 'auto'
            }}
          >
            <h3 style={{ color: '#FFD700', fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Questions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {questions.map((q, index) => {
                const isAttempted = attemptedQuestions.has(index);
                const isCurrent = index === currentQuestionIndex;
                const isBookmarked = q.bookmarked;

                return (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: isCurrent ? '2px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isCurrent
                        ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                        : isAttempted
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                      color: isCurrent ? '#1a1a4e' : isAttempted ? '#10B981' : 'white',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                  >
                    {index + 1}
                    {isBookmarked && (
                      <span style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '0.625rem' }}>
                        ⭐
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}></div>
                <span style={{ color: '#D1D5DB' }}>Current</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981' }}></div>
                <span style={{ color: '#D1D5DB' }}>Attempted</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}></div>
                <span style={{ color: '#D1D5DB' }}>Unattempted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Question Display */}
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button
              onClick={() => {
                setViewMode('selectFilters');
                setCurrentQuestionIndex(0);
                setAttemptedQuestions(new Set());
                setSelectedAnswer(null);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ChevronLeft size={20} />
              Back to Filters
            </button>

            <h2 style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 'bold' }}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </h2>

            <button
              onClick={() => toggleBookmark(currentQuestion.id)}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer'
              }}
            >
              <Bookmark
                size={24}
                color={currentQuestion.bookmarked ? '#FFD700' : '#666'}
                fill={currentQuestion.bookmarked ? '#FFD700' : 'none'}
              />
            </button>
          </div>

          {/* Question Card */}
          <div
            style={{
              padding: '2rem',
              borderRadius: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid rgba(255, 215, 0, 0.2)',
              marginBottom: '1.5rem'
            }}
          >
            {/* Question Meta */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {currentQuestion.subject && (
                <span style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(177, 156, 217, 0.2)', color: '#B19CD9' }}>
                  {currentQuestion.subject}
                </span>
              )}
              {currentQuestion.year && (
                <span style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' }}>
                  {currentQuestion.year}
                </span>
              )}
              {currentQuestion.difficulty && (
                <span style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}>
                  {currentQuestion.difficulty}
                </span>
              )}
            </div>

            {/* Question Text */}
            <p style={{ color: 'white', fontSize: '1.25rem', lineHeight: '1.8', marginBottom: '2rem' }}>
              {currentQuestion.question}
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentQuestion.options && Array.isArray(currentQuestion.options) ? (
                currentQuestion.options.map((option, optIndex) => {
                  const optionLetter = String.fromCharCode(65 + optIndex);
                  const isSelected = selectedAnswer === optionLetter;

                  return (
                    <div
                      key={optIndex}
                      onClick={() => handleOptionSelect(optionLetter)}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        background: isSelected ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? '2px solid #FFD700' : '2px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
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
                      <span style={{ color: 'white', fontSize: '1rem', flex: 1 }}>
                        {option}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#EF4444' }}>Invalid options format</p>
              )}
            </div>

            {/* Show Answer */}
            {selectedAnswer && (
              <div style={{ marginTop: '2rem' }}>
                <details style={{ cursor: 'pointer' }}>
                  <summary style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255, 215, 0, 0.05)',
                    color: '#FFD700',
                    fontSize: '1rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Eye size={20} />
                    Show Answer & Explanation
                  </summary>
                  <div style={{
                    marginTop: '1rem',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '2px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <p style={{ color: '#10B981', fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                      Correct Answer: {currentQuestion.answer}
                    </p>
                    {currentQuestion.detailed_explanation && (
                      <p style={{ color: '#D1D5DB', fontSize: '1rem', lineHeight: '1.6' }}>
                        {currentQuestion.detailed_explanation}
                      </p>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                  setSelectedAnswer(null);
                }
              }}
              disabled={currentQuestionIndex === 0}
              style={{
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: currentQuestionIndex === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)',
                color: currentQuestionIndex === 0 ? '#666' : 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#FFD700', fontWeight: '600', fontSize: '1.125rem' }}>
                {currentQuestionIndex + 1} / {questions.length}
              </p>
            </div>

            <button
              onClick={() => {
                if (currentQuestionIndex < questions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setSelectedAnswer(null);
                }
              }}
              disabled={currentQuestionIndex === questions.length - 1}
              style={{
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: currentQuestionIndex === questions.length - 1
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: currentQuestionIndex === questions.length - 1 ? '#666' : '#1a1a4e',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: currentQuestionIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTest = () => {
    if (!testSession) return null;

    const currentQuestion = testSession.questions[currentQuestionIndex];
    const userAnswer = userAnswers.get(currentQuestion.id);
    const remainingTime = testSession.timeLimit ? testSession.timeLimit - timeElapsed : null;

    return (
      <div className="space-y-6">
        {/* Test Header */}
        <div
          className="p-4 rounded-xl flex items-center justify-between"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center gap-4">
            <Clock size={24} color="#FFD700" />
            <div>
              <p className="text-sm text-gray-400">Time {remainingTime !== null ? 'Remaining' : 'Elapsed'}</p>
              <p className="text-2xl font-bold" style={{ color: remainingTime && remainingTime < 300 ? '#EF4444' : '#FFD700' }}>
                {remainingTime !== null ? formatTime(Math.max(0, remainingTime)) : formatTime(timeElapsed)}
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">Question</p>
            <p className="text-2xl font-bold" style={{ color: '#FFD700' }}>
              {currentQuestionIndex + 1} / {testSession.questions.length}
            </p>
          </div>

          <button
            onClick={submitTest}
            className="px-6 py-2 rounded-lg font-semibold"
            style={{
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: 'white'
            }}
          >
            Submit Test
          </button>
        </div>

        {/* Question */}
        <div
          className="p-8 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-400">Question {currentQuestionIndex + 1}</span>
                {currentQuestion.difficulty && (
                  <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(currentQuestion.difficulty)}`} style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                    {currentQuestion.difficulty}
                  </span>
                )}
              </div>
              <p className="text-white text-xl leading-relaxed">{currentQuestion.question}</p>
            </div>

            <button
              onClick={() => toggleFlag(currentQuestion.id)}
              className="ml-4 p-2 rounded-lg transition-all"
              style={{
                background: userAnswer?.flagged ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid ' + (userAnswer?.flagged ? '#EF4444' : 'rgba(255, 255, 255, 0.1)')
              }}
            >
              <Flag
                size={20}
                color={userAnswer?.flagged ? '#EF4444' : '#666'}
                fill={userAnswer?.flagged ? '#EF4444' : 'none'}
              />
            </button>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options && Array.isArray(currentQuestion.options) && currentQuestion.options.map((option, index) => {
              const optionLetter = String.fromCharCode(65 + index);
              const isSelected = userAnswer?.answer === optionLetter;

              return (
                <button
                  key={index}
                  onClick={() => answerQuestion(currentQuestion.id, optionLetter)}
                  className="w-full p-4 rounded-lg text-left transition-all"
                  style={{
                    background: isSelected ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid ' + (isSelected ? '#FFD700' : 'rgba(255, 255, 255, 0.1)'),
                    color: 'white'
                  }}
                >
                  <span className="font-semibold" style={{ color: isSelected ? '#FFD700' : '#B19CD9' }}>
                    {optionLetter}.
                  </span>{' '}
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 rounded-lg flex items-center gap-2 transition-all"
            style={{
              background: currentQuestionIndex > 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: currentQuestionIndex > 0 ? 'white' : '#666',
              cursor: currentQuestionIndex > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          {/* Question Grid */}
          <div style={{display: "flex", flexWrap: "wrap", gap: "0.5rem"}}>
            {testSession.questions.map((q, idx) => {
              const ans = userAnswers.get(q.id);
              const isAnswered = ans && ans.answer;
              const isFlagged = ans?.flagged;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className="w-10 h-10 rounded-lg font-semibold transition-all relative"
                  style={{
                    background: idx === currentQuestionIndex
                      ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                      : isAnswered
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid ' + (isFlagged ? '#EF4444' : 'rgba(255, 255, 255, 0.1)'),
                    color: idx === currentQuestionIndex ? '#1a1a4e' : 'white'
                  }}
                >
                  {idx + 1}
                  {isFlagged && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ background: '#EF4444' }} />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentQuestionIndex(Math.min(testSession.questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === testSession.questions.length - 1}
            className="px-6 py-3 rounded-lg flex items-center gap-2 transition-all"
            style={{
              background: currentQuestionIndex < testSession.questions.length - 1
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: currentQuestionIndex < testSession.questions.length - 1 ? 'white' : '#666',
              cursor: currentQuestionIndex < testSession.questions.length - 1 ? 'pointer' : 'not-allowed'
            }}
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!testResults) return null;

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div
          className="p-8 rounded-2xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 26, 71, 0.95) 0%, rgba(46, 26, 71, 0.95) 100%)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Trophy size={64} color="#FFD700" className="mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#FFD700' }}>
            Test Completed!
          </h2>
          <p className="text-gray-300 text-lg">
            Here's how you performed
          </p>
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            className="p-6 rounded-xl text-center"
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <CheckCircle size={32} color="#10B981" className="mx-auto mb-2" />
            <p className="text-3xl font-bold text-green-400">{testResults.correct}</p>
            <p className="text-gray-300 text-sm">Correct</p>
          </div>

          <div
            className="p-6 rounded-xl text-center"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <XCircle size={32} color="#EF4444" className="mx-auto mb-2" />
            <p className="text-3xl font-bold text-red-400">{testResults.incorrect}</p>
            <p className="text-gray-300 text-sm">Incorrect</p>
          </div>

          <div
            className="p-6 rounded-xl text-center"
            style={{
              background: 'rgba(156, 163, 175, 0.2)',
              border: '1px solid rgba(156, 163, 175, 0.3)'
            }}
          >
            <Clock size={32} color="#9CA3AF" className="mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-400">{testResults.skipped}</p>
            <p className="text-gray-300 text-sm">Skipped</p>
          </div>

          <div
            className="p-6 rounded-xl text-center"
            style={{
              background: 'rgba(255, 215, 0, 0.2)',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}
          >
            <TrendingUp size={32} color="#FFD700" className="mx-auto mb-2" />
            <p className="text-3xl font-bold" style={{ color: '#FFD700' }}>{testResults.accuracy}%</p>
            <p className="text-gray-300 text-sm">Accuracy</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "0.75rem",
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">Total Questions</p>
              <p className="text-2xl font-bold text-white">{testResults.total}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Time Spent</p>
              <p className="text-2xl font-bold text-white">{formatTime(testResults.timeSpent)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg. Time/Q</p>
              <p className="text-2xl font-bold text-white">
                {formatTime(Math.floor(testResults.timeSpent / testResults.total))}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Score</p>
              <p className="text-2xl font-bold" style={{ color: '#FFD700' }}>
                {testResults.correct}/{testResults.total}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setViewMode('review')}
            className="flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#1a1a4e'
            }}
          >
            <Eye size={20} />
            Review Answers
          </button>

          <button
            onClick={() => {
              setTestSession(null);
              setTestResults(null);
              setViewMode('selectFilters');
            }}
            className="flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: 'white'
            }}
          >
            <RotateCcw size={20} />
            New Test
          </button>
        </div>
      </div>
    );
  };

  const renderReview = () => {
    if (!testResults) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewMode('results')}
            className="px-4 py-2 rounded-lg flex items-center gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: 'white'
            }}
          >
            <ChevronLeft size={20} />
            Back to Results
          </button>

          <h2 className="text-2xl font-bold" style={{ color: '#FFD700' }}>
            Review Answers
          </h2>

          <div className="w-32" /> {/* Spacer */}
        </div>

        {/* Questions Review */}
        <div className="space-y-4">
          {testResults.questions.map((question: Question, index: number) => {
            const userAnswer = testResults.userAnswers.get(question.id);
            const isCorrect = userAnswer?.answer === question.answer;
            const isSkipped = !userAnswer || !userAnswer.answer;

            return (
              <div
                key={question.id}
                style={{
                  padding: "1.5rem",
                  borderRadius: "0.75rem",
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid ' + (isCorrect ? 'rgba(16, 185, 129, 0.3)' : isSkipped ? 'rgba(156, 163, 175, 0.3)' : 'rgba(239, 68, 68, 0.3)')
                }}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Q{index + 1}</span>
                    {isCorrect ? (
                      <CheckCircle size={20} color="#10B981" />
                    ) : isSkipped ? (
                      <Clock size={20} color="#9CA3AF" />
                    ) : (
                      <XCircle size={20} color="#EF4444" />
                    )}
                    <span className={`text-sm font-semibold ${
                      isCorrect ? 'text-green-400' : isSkipped ? 'text-gray-400' : 'text-red-400'
                    }`}>
                      {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                    </span>
                  </div>

                  {question.difficulty && (
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(question.difficulty)}`} style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                      {question.difficulty}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <p className="text-white text-lg mb-4">{question.question}</p>

                {/* Options */}
                <div className="space-y-2">
                  {question.options && Array.isArray(question.options) && question.options.map((option, optIndex) => {
                    const optionLetter = String.fromCharCode(65 + optIndex);
                    const isUserAnswer = userAnswer?.answer === optionLetter;
                    const isCorrectAnswer = question.answer === optionLetter;

                    return (
                      <div
                        key={optIndex}
                        className="p-3 rounded-lg"
                        style={{
                          background: isCorrectAnswer
                            ? 'rgba(16, 185, 129, 0.2)'
                            : isUserAnswer
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid ' + (
                            isCorrectAnswer
                              ? 'rgba(16, 185, 129, 0.5)'
                              : isUserAnswer
                              ? 'rgba(239, 68, 68, 0.5)'
                              : 'rgba(255, 255, 255, 0.1)'
                          )
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className={
                            isCorrectAnswer ? 'text-green-400' : isUserAnswer ? 'text-red-400' : 'text-gray-300'
                          }>
                            <span className="font-semibold">{optionLetter}.</span> {option}
                          </span>
                          {isCorrectAnswer && <CheckCircle size={16} color="#10B981" />}
                          {isUserAnswer && !isCorrectAnswer && <XCircle size={16} color="#EF4444" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {question.detailed_explanation && (
                  <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: '#FFD700' }}>Explanation:</p>
                    <p className="text-gray-300 text-sm">{question.detailed_explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Main render
  if (loading && (viewMode === 'selectExam' || viewMode === 'selectFilters')) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadInitialData} />;
  }

  return (
    <div
      className="w-full"
      style={{
        background: 'linear-gradient(135deg, #1a1a4e 0%, #2E1A47 100%)',
        borderRadius: '12px',
        padding: '1.5rem',
        minHeight: 'calc(100vh - 200px)'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {viewMode === 'selectExam' && renderExamSelection()}
        {viewMode === 'selectFilters' && renderFilterSelection()}
        {viewMode === 'practice' && renderPractice()}
        {viewMode === 'test' && renderTest()}
        {viewMode === 'results' && renderResults()}
        {viewMode === 'review' && renderReview()}
      </div>
    </div>
  );
};

export default ExamBot;

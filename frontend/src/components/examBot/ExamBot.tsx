import React, { useState, useEffect } from 'react';
import {
  BookOpen, Calendar, Filter, Search, Bookmark, Play,
  Clock, CheckCircle, XCircle, Flag, RotateCcw, Eye,
  Trophy, TrendingUp, ChevronRight, ChevronLeft, X
} from 'lucide-react';
import LoadingIndicator from '../LoadingIndicator';
import ErrorMessage from '../ErrorMessage';
import { examBotService, Question, ExamCategory, Topic, Subtopic } from '../../services/examBotService_updated';

interface ExamBotProps {
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

interface Filters {
  exam: string;
  topic: string;
  subtopic: string;
  subject: string;
  year: number | null;
  difficulty: string;
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

type ViewMode = 'home' | 'browse' | 'practice' | 'test' | 'results' | 'review';

const ExamBot: React.FC<ExamBotProps> = ({ selectedLanguage = 'en', isAuthenticated = true }) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data from Supabase
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    exam: '',
    topic: '',
    subtopic: '',
    subject: '',
    year: null,
    difficulty: ''
  });

  // Test session
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [testResults, setTestResults] = useState<any>(null);

  // Statistics
  const [stats, setStats] = useState({
    totalQuestions: 0,
    attempted: 0,
    bookmarked: 0
  });

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

      // Load exam categories
      const exams = await examBotService.getExamCategories();
      setExamCategories(exams);

      // Load topics
      const allTopics = await examBotService.getTopics();
      setTopics(allTopics);

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

  // Update subtopics when topic changes
  useEffect(() => {
    if (filters.topic) {
      loadSubtopics(filters.topic);
    }
  }, [filters.topic]);

  const loadExamFilters = async (exam: string) => {
    try {
      setLoading(true);

      // Get available years for this exam
      const years = await examBotService.getAvailableYears(exam);
      setAvailableYears(years);

      // Get available subjects for this exam
      const subjects = await examBotService.getSubjectsByExam(exam);
      setAvailableSubjects(subjects);

      // Get topics/subtopics for this exam
      const topicsList = await examBotService.getTopicsByExamAndSubject(exam, filters.subject || '');
      // Note: topics are already loaded, but we can filter them

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading exam filters:', err);
      setLoading(false);
    }
  };

  const loadSubtopics = async (topicId: string) => {
    try {
      const subtopicsList = await examBotService.getSubtopics(topicId);
      setSubtopics(subtopicsList);
    } catch (err: any) {
      console.error('Error loading subtopics:', err);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryFilters: any = {};
      if (filters.exam) queryFilters.exam = filters.exam;
      if (filters.topic) queryFilters.topicId = filters.topic;
      if (filters.subtopic) queryFilters.subtopicId = filters.subtopic;
      if (filters.subject) queryFilters.subject = filters.subject;
      if (filters.year) queryFilters.year = filters.year;
      if (filters.difficulty) queryFilters.difficulty = filters.difficulty;

      const fetchedQuestions = await examBotService.getQuestions(queryFilters);
      setQuestions(fetchedQuestions);
      setStats(prev => ({ ...prev, totalQuestions: fetchedQuestions.length }));

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
        newFilters.topic = '';
        newFilters.subtopic = '';
        newFilters.subject = '';
        newFilters.year = null;
      } else if (key === 'topic') {
        newFilters.subtopic = '';
      }

      return newFilters;
    });
  };

  const startPracticeMode = async () => {
    if (!filters.exam) {
      setError('Please select an exam first');
      return;
    }

    await loadQuestions();
    setViewMode('practice');
  };

  const startTest = async (timeLimit?: number) => {
    if (questions.length === 0) {
      setError('No questions available for selected filters');
      return;
    }

    const session: TestSession = {
      questions: [...questions],
      startTime: Date.now(),
      timeLimit,
      filters: { ...filters }
    };

    setTestSession(session);
    setCurrentQuestionIndex(0);
    setUserAnswers(new Map());
    setTimeElapsed(0);
    setViewMode('test');
  };

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

  // Render functions for different views
  const renderHome = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className="relative p-8 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 26, 71, 0.95) 0%, rgba(46, 26, 71, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#FFD700' }}>
            Welcome to ExamBot
          </h1>
          <p className="text-gray-300 text-lg">
            Practice with database-stored questions. Select filters and start practicing!
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <BookOpen size={256} color="#FFD700" />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="p-6 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Questions</p>
              <p className="text-2xl font-bold" style={{ color: '#FFD700' }}>
                {stats.totalQuestions}
              </p>
            </div>
            <BookOpen size={32} color="#FFD700" />
          </div>
        </div>

        <div
          className="p-6 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Attempted</p>
              <p className="text-2xl font-bold" style={{ color: '#FFD700' }}>
                {stats.attempted}
              </p>
            </div>
            <CheckCircle size={32} color="#10B981" />
          </div>
        </div>

        <div
          className="p-6 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Bookmarked</p>
              <p className="text-2xl font-bold" style={{ color: '#FFD700' }}>
                {stats.bookmarked}
              </p>
            </div>
            <Bookmark size={32} color="#B19CD9" />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div
        className="p-6 rounded-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#FFD700' }}>
          <Filter size={24} />
          Select Filters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Exam Filter */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Exam</label>
            <select
              value={filters.exam}
              onChange={(e) => handleFilterChange('exam', e.target.value)}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                color: 'white',
                focusRing: '2px solid #FFD700'
              }}
            >
              <option value="">Select Exam</option>
              {examCategories.map(exam => (
                <option key={exam.id} value={exam.category_name} style={{ background: '#1a1a4e' }}>
                  {exam.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          {filters.exam && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Subject</label>
              <select
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  color: 'white'
                }}
              >
                <option value="">All Subjects</option>
                {availableSubjects.map(subject => (
                  <option key={subject} value={subject} style={{ background: '#1a1a4e' }}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Topic Filter */}
          {filters.exam && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Topic</label>
              <select
                value={filters.topic}
                onChange={(e) => handleFilterChange('topic', e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  color: 'white'
                }}
              >
                <option value="">All Topics</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id} style={{ background: '#1a1a4e' }}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subtopic Filter */}
          {filters.topic && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Subtopic</label>
              <select
                value={filters.subtopic}
                onChange={(e) => handleFilterChange('subtopic', e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  color: 'white'
                }}
              >
                <option value="">All Subtopics</option>
                {subtopics.map(subtopic => (
                  <option key={subtopic.id} value={subtopic.id} style={{ background: '#1a1a4e' }}>
                    {subtopic.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year Filter */}
          {filters.exam && availableYears.length > 0 && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Year</label>
              <select
                value={filters.year || ''}
                onChange={(e) => handleFilterChange('year', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  color: 'white'
                }}
              >
                <option value="">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year} style={{ background: '#1a1a4e' }}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                color: 'white'
              }}
            >
              <option value="">All Difficulties</option>
              <option value="Easy" style={{ background: '#1a1a4e' }}>Easy</option>
              <option value="Medium" style={{ background: '#1a1a4e' }}>Medium</option>
              <option value="Hard" style={{ background: '#1a1a4e' }}>Hard</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={startPracticeMode}
            disabled={!filters.exam || loading}
            className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: filters.exam && !loading
                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              color: filters.exam && !loading ? '#1a1a4e' : '#666',
              cursor: filters.exam && !loading ? 'pointer' : 'not-allowed'
            }}
          >
            <Play size={20} />
            Start Practice
          </button>

          <button
            onClick={() => {
              setFilters({
                exam: '',
                topic: '',
                subtopic: '',
                subject: '',
                year: null,
                difficulty: ''
              });
            }}
            className="px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: 'white'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );

  const renderPractice = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setViewMode('home')}
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

        <h2 className="text-2xl font-bold" style={{ color: '#FFD700' }}>
          Practice Mode
        </h2>

        <button
          onClick={() => startTest(3600)}
          disabled={questions.length === 0}
          className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
          style={{
            background: questions.length > 0
              ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            color: questions.length > 0 ? '#1a1a4e' : '#666',
            cursor: questions.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          <Clock size={20} />
          Start Timed Test
        </button>
      </div>

      {/* Applied Filters */}
      <div
        className="p-4 rounded-lg"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex flex-wrap gap-2">
          {filters.exam && (
            <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(255, 215, 0, 0.2)', color: '#FFD700' }}>
              {filters.exam}
            </span>
          )}
          {filters.subject && (
            <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(177, 156, 217, 0.2)', color: '#B19CD9' }}>
              {filters.subject}
            </span>
          )}
          {filters.topic && topics.find(t => t.id === filters.topic) && (
            <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
              {topics.find(t => t.id === filters.topic)?.name}
            </span>
          )}
          {filters.subtopic && subtopics.find(s => s.id === filters.subtopic) && (
            <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}>
              {subtopics.find(s => s.id === filters.subtopic)?.name}
            </span>
          )}
          {filters.year && (
            <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' }}>
              Year: {filters.year}
            </span>
          )}
          {filters.difficulty && (
            <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(filters.difficulty)}`} style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
              {filters.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
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
            onClick={() => setViewMode('home')}
            className="mt-4 px-6 py-2 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#1a1a4e'
            }}
          >
            Change Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-400">Found {questions.length} questions</p>

          {questions.map((question, index) => (
            <div
              key={question.id}
              className="p-6 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-400">Q{index + 1}</span>
                    {question.year && (
                      <span className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' }}>
                        {question.year}
                      </span>
                    )}
                    {question.difficulty && (
                      <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(question.difficulty)}`} style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                        {question.difficulty}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(177, 156, 217, 0.2)', color: '#B19CD9' }}>
                      {question.subject}
                    </span>
                  </div>
                  <p className="text-white text-lg">{question.question}</p>
                </div>

                <button
                  onClick={() => toggleBookmark(question.id)}
                  className="ml-4 p-2 rounded-lg transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Bookmark
                    size={20}
                    color={question.bookmarked ? '#FFD700' : '#666'}
                    fill={question.bookmarked ? '#FFD700' : 'none'}
                  />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {question.options && Array.isArray(question.options) ? (
                  question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <span className="text-gray-300">{String.fromCharCode(65 + optIndex)}. {option}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-red-400 text-sm">Invalid options format</p>
                )}
              </div>

              {/* Show Answer Button */}
              <div className="mt-4">
                <details className="cursor-pointer">
                  <summary className="text-sm font-semibold flex items-center gap-2" style={{ color: '#FFD700' }}>
                    <Eye size={16} />
                    Show Answer & Explanation
                  </summary>
                  <div className="mt-3 p-4 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <p className="text-green-400 font-semibold mb-2">
                      Correct Answer: {question.answer}
                    </p>
                    {question.detailed_explanation && (
                      <p className="text-gray-300 text-sm">{question.detailed_explanation}</p>
                    )}
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
          <div className="flex flex-wrap gap-2">
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
          className="p-6 rounded-xl"
          style={{
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
              setViewMode('home');
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
                className="p-6 rounded-xl"
                style={{
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
  if (loading && viewMode === 'home') {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadInitialData} />;
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: 'linear-gradient(135deg, #1a1a4e 0%, #2E1A47 100%)'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {viewMode === 'home' && renderHome()}
        {viewMode === 'practice' && renderPractice()}
        {viewMode === 'test' && renderTest()}
        {viewMode === 'results' && renderResults()}
        {viewMode === 'review' && renderReview()}
      </div>
    </div>
  );
};

export default ExamBot;

import React, { useState, useEffect, useRef } from 'react';
import { Brain, Clock, Target, Trophy, Play, CheckCircle, XCircle, Flag, RotateCcw, Eye, BookOpen, Bookmark, Filter, Calendar, Award, TrendingUp, List, Search } from 'lucide-react';
import LoadingIndicator from '../LoadingIndicator';
import ErrorMessage from '../ErrorMessage';

interface ExamBotProps {
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

interface Question {
  id: string;
  question: string;
  options: { [key: string]: string };
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  chapter: string;
  subject: string;
  exam_type: string;
  year?: number;
  bookmarked?: boolean;
  attempted?: boolean;
  correct_on_first_try?: boolean;
}

interface TestSession {
  mode: string;
  examType: string;
  subject: string;
  chapter?: string;
  topic?: string;
  year?: number;
  difficulty?: string;
  questions: Question[];
  startTime: number;
  timeLimit?: number;
}

interface UserAnswer {
  answer: string;
  timeSpent: number;
  flagged: boolean;
}

// Mock database structure - Replace with Supabase queries later
const MOCK_DATABASE = {
  exams: [
    {
      id: 'upsc',
      name: 'UPSC CSE',
      icon: '🏛️',
      subjects: [
        { id: 'history', name: 'History', chapters: ['Ancient India', 'Medieval India', 'Modern India', 'World History'] },
        { id: 'geography', name: 'Geography', chapters: ['Physical Geography', 'Human Geography', 'Indian Geography', 'World Geography'] },
        { id: 'polity', name: 'Polity', chapters: ['Constitution', 'Parliament', 'Executive', 'Judiciary'] },
        { id: 'economy', name: 'Economy', chapters: ['Basic Concepts', 'Indian Economy', 'World Economy', 'Banking'] },
        { id: 'science', name: 'Science & Technology', chapters: ['Physics', 'Chemistry', 'Biology', 'Technology'] }
      ]
    },
    {
      id: 'ssc',
      name: 'SSC CGL/CHSL',
      icon: '📋',
      subjects: [
        { id: 'gk', name: 'General Knowledge', chapters: ['History', 'Geography', 'Science', 'Current Affairs'] },
        { id: 'reasoning', name: 'Reasoning', chapters: ['Verbal Reasoning', 'Non-Verbal Reasoning', 'Analytical Reasoning'] },
        { id: 'quant', name: 'Quantitative Aptitude', chapters: ['Arithmetic', 'Algebra', 'Geometry', 'Data Interpretation'] },
        { id: 'english', name: 'English', chapters: ['Grammar', 'Vocabulary', 'Comprehension', 'Writing'] }
      ]
    },
    {
      id: 'banking',
      name: 'Banking (IBPS/SBI)',
      icon: '🏦',
      subjects: [
        { id: 'banking_awareness', name: 'Banking Awareness', chapters: ['Banking Basics', 'RBI Functions', 'Banking Terms', 'Financial Awareness'] },
        { id: 'reasoning', name: 'Reasoning', chapters: ['Puzzles', 'Seating Arrangement', 'Syllogism', 'Coding-Decoding'] },
        { id: 'quant', name: 'Quantitative Aptitude', chapters: ['Number System', 'Simplification', 'Data Interpretation', 'Approximation'] }
      ]
    }
  ],

  // Mock questions - In real app, this comes from Supabase
  questions: [] as Question[]
};

// Generate mock questions for demonstration
const generateMockQuestions = (examType: string, subject: string, chapter?: string, count: number = 10): Question[] => {
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    questions.push({
      id: `${examType}_${subject}_${chapter || 'general'}_${i + 1}`,
      question: `Sample ${chapter || subject} question ${i + 1} for ${examType.toUpperCase()}?`,
      options: {
        A: `Option A for question ${i + 1}`,
        B: `Option B for question ${i + 1}`,
        C: `Option C for question ${i + 1}`,
        D: `Option D for question ${i + 1}`
      },
      correct_answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      explanation: `This is the explanation for question ${i + 1}. In a real database, this would contain detailed explanation of the correct answer.`,
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
      topic: chapter || subject,
      chapter: chapter || 'General',
      subject: subject,
      exam_type: examType,
      year: Math.random() > 0.5 ? 2015 + Math.floor(Math.random() * 9) : undefined,
      bookmarked: false,
      attempted: false
    });
  }
  return questions;
};

const ExamBot: React.FC<ExamBotProps> = ({
  selectedLanguage = 'english',
  isAuthenticated = false
}) => {
  const [view, setView] = useState<'home' | 'browse' | 'pyq' | 'practice' | 'test' | 'review' | 'results'>('home');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [practiceMode, setPracticeMode] = useState<'chapter' | 'topic' | 'year' | 'bookmarked' | 'random'>('chapter');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: UserAnswer }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && view === 'test') {
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
  }, [timeLeft, view]);

  // Simulated Supabase fetch - Replace with actual Supabase query
  const fetchQuestionsFromDatabase = (filters: any) => {
    setLoading(true);

    // TODO: Replace with actual Supabase query
    // const { data, error } = await supabase
    //   .from('questions')
    //   .select('*')
    //   .eq('exam_type', filters.examType)
    //   .eq('subject', filters.subject)
    //   .eq('chapter', filters.chapter)

    setTimeout(() => {
      const mockQuestions = generateMockQuestions(
        filters.examType,
        filters.subject,
        filters.chapter,
        filters.count || 10
      );
      setAvailableQuestions(mockQuestions);
      setLoading(false);
    }, 1000);
  };

  const startPractice = () => {
    if (!selectedExam || !selectedSubject) {
      setError('Please select exam and subject');
      return;
    }

    fetchQuestionsFromDatabase({
      examType: selectedExam,
      subject: selectedSubject,
      chapter: selectedChapter,
      mode: practiceMode,
      year: selectedYear,
      count: 10
    });

    setView('practice');
  };

  const startTest = (questions: Question[], timeLimit?: number) => {
    const exam = MOCK_DATABASE.exams.find(e => e.id === selectedExam);

    setTestSession({
      mode: practiceMode,
      examType: exam?.name || '',
      subject: selectedSubject,
      chapter: selectedChapter,
      year: selectedYear || undefined,
      questions,
      startTime: Date.now(),
      timeLimit
    });

    setCurrentQuestionIndex(0);
    setUserAnswers({});
    if (timeLimit) setTimeLeft(timeLimit);
    setView('test');
  };

  const handleAnswerSelect = (option: string) => {
    if (view !== 'test' && view !== 'practice') return;

    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        answer: option,
        timeSpent: testSession ? Math.floor((Date.now() - testSession.startTime) / 1000) : 0,
        flagged: prev[currentQuestionIndex]?.flagged || false
      }
    }));
  };

  const toggleBookmark = (questionId: string) => {
    // TODO: Update in Supabase
    // await supabase
    //   .from('user_question_progress')
    //   .upsert({ user_id, question_id: questionId, bookmarked: true })

    setAvailableQuestions(prev =>
      prev.map(q => q.id === questionId ? { ...q, bookmarked: !q.bookmarked } : q)
    );
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
    setView('results');
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

  const resetToHome = () => {
    setView('home');
    setSelectedExam('');
    setSelectedSubject('');
    setSelectedChapter('');
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
    if (!testSession?.timeLimit) return '#10B981';
    const percentage = (timeLeft / testSession.timeLimit) * 100;
    if (percentage > 50) return '#10B981';
    if (percentage > 25) return '#F59E0B';
    return '#EF4444';
  };

  // HOME VIEW
  if (view === 'home') {
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
              Exam Bot - Question Bank
            </h2>
            <p style={{
              color: '#B19CD9',
              fontSize: '1.05rem',
              margin: 0
            }}>
              Practice with organized question bank and previous year papers
            </p>
          </div>
        </div>

        {/* Main Options */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Browse Question Bank */}
          <div
            onClick={() => setView('browse')}
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
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
              <BookOpen size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{
              color: '#60A5FA',
              fontSize: '1.4rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Browse Question Bank
            </h3>
            <p style={{
              color: '#EDEDED',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              Explore questions organized by exam, subject, chapter, and topic
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#60A5FA',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Browse Questions →
            </div>
          </div>

          {/* Previous Year Papers */}
          <div
            onClick={() => setView('pyq')}
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
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
              <Calendar size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{
              color: '#34D399',
              fontSize: '1.4rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Previous Year Papers
            </h3>
            <p style={{
              color: '#EDEDED',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              Practice with authentic previous year exam questions (2015-2024)
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#34D399',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              View Papers →
            </div>
          </div>

          {/* Bookmarked Questions */}
          <div
            onClick={() => {
              setPracticeMode('bookmarked');
              // Fetch bookmarked questions
              setView('browse');
            }}
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '2px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '1rem',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(245, 158, 11, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(45deg, #F59E0B, #FBBF24)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Bookmark size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{
              color: '#FBBF24',
              fontSize: '1.4rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Bookmarked Questions
            </h3>
            <p style={{
              color: '#EDEDED',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              Review questions you've saved for later practice
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#FBBF24',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              View Bookmarks →
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          <h3 style={{
            color: '#FFD700',
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <TrendingUp size={20} />
            Available Exams & Questions
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            {MOCK_DATABASE.exams.map(exam => (
              <div key={exam.id} style={{
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{exam.icon}</div>
                <div style={{ color: '#EDEDED', fontWeight: '600', fontSize: '0.9rem' }}>{exam.name}</div>
                <div style={{ color: '#B19CD9', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {exam.subjects.length} Subjects
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // BROWSE VIEW
  if (view === 'browse') {
    const selectedExamData = MOCK_DATABASE.exams.find(e => e.id === selectedExam);
    const selectedSubjectData = selectedExamData?.subjects.find(s => s.id === selectedSubject);

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
          marginBottom: '2rem'
        }}>
          <h2 style={{
            color: '#FFD700',
            fontSize: '1.8rem',
            fontWeight: '700',
            margin: 0
          }}>
            Browse Question Bank
          </h2>
          <button
            onClick={resetToHome}
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
            Back to Home
          </button>
        </div>

        {/* Exam Selection */}
        {!selectedExam && (
          <div>
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
              Select Exam
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {MOCK_DATABASE.exams.map(exam => (
                <div
                  key={exam.id}
                  onClick={() => setSelectedExam(exam.id)}
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{exam.icon}</div>
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
        )}

        {/* Subject Selection */}
        {selectedExam && !selectedSubject && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              color: '#B19CD9',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedExam('')}
            >
              ← {selectedExamData?.name}
            </div>

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
              {selectedExamData?.subjects.map(subject => (
                <div
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  style={{
                    padding: '1rem',
                    background: 'rgba(255, 215, 0, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.1)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    color: '#EDEDED',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.05)';
                  }}
                >
                  {subject.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chapter & Practice Mode Selection */}
        {selectedExam && selectedSubject && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              color: '#B19CD9',
              fontSize: '0.9rem'
            }}>
              <span style={{ cursor: 'pointer' }} onClick={() => setSelectedExam('')}>
                {selectedExamData?.name}
              </span>
              <span>→</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setSelectedSubject('')}>
                {selectedSubjectData?.name}
              </span>
            </div>

            <h3 style={{
              color: '#FFD700',
              fontSize: '1.2rem',
              fontWeight: '600',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <List size={20} />
              Select Chapter (Optional)
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div
                onClick={() => setSelectedChapter('')}
                style={{
                  padding: '1rem',
                  background: !selectedChapter ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: !selectedChapter ? '2px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  color: '#EDEDED',
                  fontWeight: '600'
                }}
              >
                All Chapters
              </div>
              {selectedSubjectData?.chapters.map(chapter => (
                <div
                  key={chapter}
                  onClick={() => setSelectedChapter(chapter)}
                  style={{
                    padding: '1rem',
                    background: selectedChapter === chapter ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedChapter === chapter ? '2px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    color: '#EDEDED',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedChapter !== chapter) {
                      e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedChapter !== chapter) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  {chapter}
                </div>
              ))}
            </div>

            {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

            <button
              onClick={startPractice}
              disabled={loading}
              style={{
                width: '100%',
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
              {loading ? 'Loading Questions...' : (
                <>
                  <Play size={20} />
                  Start Practice
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // PREVIOUS YEAR PAPERS VIEW
  if (view === 'pyq') {
    const years = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            color: '#FFD700',
            fontSize: '1.8rem',
            fontWeight: '700',
            margin: 0
          }}>
            Previous Year Papers
          </h2>
          <button
            onClick={resetToHome}
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
            Back to Home
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {years.map(year => (
            <div
              key={year}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid rgba(255, 215, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <Calendar size={32} style={{ color: '#FFD700' }} />
                <div>
                  <h3 style={{
                    color: '#EDEDED',
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    margin: 0
                  }}>
                    {year}
                  </h3>
                  <p style={{
                    color: '#B19CD9',
                    fontSize: '0.85rem',
                    margin: 0
                  }}>
                    Previous Year Paper
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginBottom: '1rem'
              }}>
                {MOCK_DATABASE.exams.slice(0, 3).map(exam => (
                  <span
                    key={exam.id}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60A5FA',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {exam.icon} {exam.name}
                  </span>
                ))}
              </div>

              <button
                onClick={() => {
                  setSelectedYear(year);
                  setPracticeMode('year');
                  setView('browse');
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'linear-gradient(45deg, #10B981, #34D399)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                Practice {year} Questions
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // PRACTICE VIEW (Question List)
  if (view === 'practice' && availableQuestions.length > 0) {
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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h2 style={{
              color: '#FFD700',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              Practice Questions
            </h2>
            <p style={{
              color: '#B19CD9',
              fontSize: '0.9rem',
              margin: 0
            }}>
              {availableQuestions.length} questions found
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => startTest(availableQuestions, availableQuestions.length * 90)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(45deg, #10B981, #34D399)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Play size={18} />
              Start Test Mode
            </button>

            <button
              onClick={() => setView('browse')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#EDEDED',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Back
            </button>
          </div>
        </div>

        {loading && <LoadingIndicator message="Loading questions..." />}

        <div style={{
          display: 'grid',
          gap: '1rem',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          {availableQuestions.map((question, index) => (
            <div
              key={question.id}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid rgba(255, 215, 0, 0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: question.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.2)' :
                                 question.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' :
                                 'rgba(239, 68, 68, 0.2)',
                      color: question.difficulty === 'easy' ? '#10B981' :
                             question.difficulty === 'medium' ? '#F59E0B' : '#EF4444',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {question.difficulty}
                    </span>
                    {question.year && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#60A5FA',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {question.year}
                      </span>
                    )}
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(139, 92, 246, 0.2)',
                      color: '#A78BFA',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {question.chapter}
                    </span>
                  </div>

                  <h3 style={{
                    color: '#EDEDED',
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    lineHeight: '1.5'
                  }}>
                    Q{index + 1}. {question.question}
                  </h3>
                </div>

                <button
                  onClick={() => toggleBookmark(question.id)}
                  style={{
                    padding: '0.5rem',
                    background: question.bookmarked ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${question.bookmarked ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    marginLeft: '1rem'
                  }}
                >
                  <Bookmark
                    size={18}
                    fill={question.bookmarked ? '#F59E0B' : 'none'}
                    style={{ color: question.bookmarked ? '#F59E0B' : '#B19CD9' }}
                  />
                </button>
              </div>

              <div style={{
                display: 'grid',
                gap: '0.75rem'
              }}>
                {Object.entries(question.options).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <span style={{
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#EDEDED',
                      fontWeight: '600',
                      fontSize: '0.85rem'
                    }}>
                      {key}
                    </span>
                    <span style={{ color: '#EDEDED', fontSize: '0.95rem' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // TEST MODE (same as before, but with database questions)
  if (view === 'test' && testSession) {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ color: '#FFD700', margin: 0, fontSize: '1.3rem' }}>
              {testSession.examType} {testSession.subject && `- ${testSession.subject}`}
            </h2>
            <p style={{ color: '#B19CD9', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
              Question {currentQuestionIndex + 1} of {testSession.questions.length}
              {testSession.chapter && ` • ${testSession.chapter}`}
            </p>
          </div>
          {testSession.timeLimit && (
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
          )}
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
            width: `${((currentQuestionIndex + 1) / testSession.questions.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Question */}
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: currentQuestion.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.2)' :
                             currentQuestion.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: currentQuestion.difficulty === 'easy' ? '#10B981' :
                         currentQuestion.difficulty === 'medium' ? '#F59E0B' : '#EF4444',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {currentQuestion.difficulty}
                </span>
                {currentQuestion.year && (
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60A5FA',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {currentQuestion.year}
                  </span>
                )}
              </div>
              <h3 style={{ color: '#EDEDED', fontSize: '1.1rem', fontWeight: '600', lineHeight: '1.6', margin: 0 }}>
                {currentQuestion.question}
              </h3>
            </div>
            <button onClick={toggleFlag} style={{
              padding: '0.5rem',
              background: userAnswer?.flagged ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${userAnswer?.flagged ? '#EF4444' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              marginLeft: '1rem'
            }}>
              <Flag size={18} fill={userAnswer?.flagged ? '#EF4444' : 'none'} style={{ color: userAnswer?.flagged ? '#EF4444' : '#B19CD9' }} />
            </button>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
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
                  gap: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (userAnswer?.answer !== key) {
                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (userAnswer?.answer !== key) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
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
                <span style={{ color: '#EDEDED', fontSize: '1rem' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
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
              opacity: currentQuestionIndex === 0 ? 0.5 : 1,
              fontWeight: '600'
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

  // RESULTS VIEW (same as before)
  if (view === 'results' && testSession) {
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
        <p style={{ color: '#B19CD9', marginBottom: '2rem' }}>
          {testSession.examType} {testSession.subject && `- ${testSession.subject}`}
          {testSession.chapter && ` - ${testSession.chapter}`}
        </p>

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

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setView('review'); setCurrentQuestionIndex(0); }}
            style={{
              padding: '1.25rem 2rem',
              background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#2E1A47',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Eye size={20} />
            Review Answers
          </button>
          <button
            onClick={resetToHome}
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
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // REVIEW VIEW
  if (view === 'review' && testSession) {
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
            <button onClick={() => setView('results')} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', color: '#EDEDED', cursor: 'pointer', fontWeight: '600' }}>
              Back to Results
            </button>
            <button onClick={resetToHome} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '0.5rem', color: '#FFD700', cursor: 'pointer', fontWeight: '600' }}>
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
              opacity: currentQuestionIndex === 0 ? 0.5 : 1,
              fontWeight: '600'
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

  return <LoadingIndicator message="Loading..." />;
};

export default ExamBot;

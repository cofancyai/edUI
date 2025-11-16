import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Bell, Settings, User, LogOut, Activity, Zap, AlertTriangle, RefreshCw, Play, Trash2, RotateCcw, BarChart3 } from 'lucide-react';
import { supabase } from './utils/supabaseClient';
import { useApiAvailability } from './hooks/useApiAvailability';
import { useMockTest } from './hooks/useMockTest';
import AITutor from './dashboard/AITutor';
import ExamAlert from './dashboard/ExamAlert';
import EditProfile from './dashboard/EditProfile';
import Navigation from './dashboard/Navigation';
import Schemes from './dashboard/Schemes';
import ExamBot from './dashboard/ExamBot';
import Aptitude from './dashboard/Aptitude';
import SyllabusOrientedPreparation from './dashboard/SyllabusOrientedPreparation';
import MockTest from './dashboard/MockTest';
import AnswerEvaluation from './dashboard/AnswerEvaluation';
import CurrentAffairs from './dashboard/CurrentAffairs';
import './dashboard/MenuBar.css';
import VapiUPSCInterview from './VapiUPSCInterview';
import { SUPPORTED_LANGUAGES } from './constants/languages';

// Load Google Fonts for Montserrat
const montserratLink = document.createElement('link');
montserratLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap';
montserratLink.rel = 'stylesheet';
document.head.appendChild(montserratLink);

// Enhanced CSS animations and styles
const styles = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spinReverse {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes slideIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

button {
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.2), -5px -5px 10px rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 7px 7px 15px rgba(0, 0, 0, 0.3), -7px -7px 15px rgba(255, 255, 255, 0.2);
}

.notification-badge {
  animation: pulse 2s infinite;
}

.header-section {
  animation: slideIn 0.5s ease-out;
}

.main-content-area {
  animation: fadeIn 0.3s ease-in;
}

.error-indicator {
  animation: shake 0.5s ease-in-out;
}

.job-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #FFFFFF;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.job-table th,
.job-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(177, 156, 217, 0.2);
  color: #2E1A47;
}

.job-table th {
  background: linear-gradient(45deg, #FFD700, #B19CD9);
  color: #2E1A47;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

.job-table tr:last-child td {
  border-bottom: none;
}

.job-table a {
  color: #2E1A47;
  text-decoration: underline;
  transition: color 0.3s ease;
}

.job-table a:hover {
  color: #FFD700;
}

.quick-action-button {
  transition: all 0.2s ease;
}

.quick-action-button:hover {
  transform: scale(1.05);
}

.test-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.test-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
`;

const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

interface DashboardStats {
  studyStreak: number;
  totalStudyTime: number;
  completedTopics: number;
  activeGoals: number;
}

interface StudentData {
  id: string;
  name: string;
  phone: string;
  [key: string]: any;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  timestamp: string;
  actionable?: boolean;
  action?: string;
}

interface MockTestData {
  mock_test_number: number;
  status: string;
  score_percentage?: number;
  [key: string]: any;
}

// Error Boundary Component for the entire dashboard
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null; errorInfo: string | null }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Dashboard Error Boundary] Caught error:', error);
    console.error('[Dashboard Error Boundary] Error info:', errorInfo);

    this.setState({
      error,
      errorInfo: errorInfo.componentStack || 'No error info available',
    });

    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#2E1A47',
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '600px',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <AlertTriangle size={64} style={{ color: '#EF4444', marginBottom: '1rem' }} />
            <h2 style={{ color: '#EF4444', marginBottom: '1rem' }}>Dashboard Error</h2>
            <p style={{ color: '#EDEDED', marginBottom: '1rem', lineHeight: '1.6' }}>
              Something went wrong with the dashboard. This might be due to:
            </p>
            <ul style={{ color: '#EDEDED', textAlign: 'left', marginBottom: '2rem', lineHeight: '1.6' }}>
              <li>Network connectivity issues</li>
              <li>Research API server not running</li>
              <li>Browser compatibility problems</li>
              <li>Corrupted local storage data</li>
            </ul>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(45deg, #EF4444, #DC2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Clear Data & Reload
              </button>

              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
                  color: '#2E1A47',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Try Again
              </button>
            </div>

            <details style={{ marginTop: '2rem', textAlign: 'left' }}>
              <summary style={{ color: '#B19CD9', cursor: 'pointer', marginBottom: '1rem' }}>
                Show Error Details
              </summary>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                color: '#EDEDED',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
                maxHeight: '200px',
              }}>
                {this.state.error?.toString()}
                {this.state.errorInfo}
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const phone = localStorage.getItem('studentPhone');

  const [selectedMenu, setSelectedMenu] = useState<string | null>('AI Tutor');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [studentName, setStudentName] = useState<string>('Student');
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [query, setQuery] = useState<string>('');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    studyStreak: 0,
    totalStudyTime: 0,
    completedTopics: 0,
    activeGoals: 0,
  });
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [lastActiveTime, setLastActiveTime] = useState<Date>(new Date());
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiConnectionStatus, setApiConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [testFilter, setTestFilter] = useState<string>('available');

  const apiAvailability = useApiAvailability();

  // Initialize mock test hook
  const mockTestHook = useMockTest({ userId: studentData?.id || phone || '' });

  // Enhanced debug logging
  const logDebug = (message: string, data?: any) => {
    console.log(`[StudentDashboard] ${message}`, data ? data : '');
  };

  // Session timer with error handling
  useEffect(() => {
    try {
      const timer = setInterval(() => {
        setSessionTime((prev) => prev + 1);
        setLastActiveTime(new Date());
      }, 60000); // Update every minute

      return () => clearInterval(timer);
    } catch (error) {
      console.error('[StudentDashboard] Session timer error:', error);
    }
  }, []);

  // Handle search query from Study Planner to AI Tutor with error handling
  useEffect(() => {
    try {
      if (selectedMenu === 'AI Tutor') {
        const searchQuery = localStorage.getItem('aiTutorSearchQuery');
        if (searchQuery) {
          localStorage.removeItem('aiTutorSearchQuery');
          setQuery(searchQuery);
          logDebug('Applied search query from Study Planner:', searchQuery);
        }
      }
    } catch (error) {
      console.error('[StudentDashboard] Query handling error:', error);
    }
  }, [selectedMenu]);

  // Enhanced authentication check
  useEffect(() => {
    const checkAuth = () => {
      try {
        const phoneNumber = localStorage.getItem('studentPhone');

        logDebug('=== PHONE-BASED AUTHENTICATION CHECK ===');
        logDebug('Phone number in localStorage:', phoneNumber);

        if (phoneNumber && phoneNumber !== '+91') {
          setIsAuthenticated(true);
          logDebug('âœ… Phone authentication successful:', phoneNumber);
        } else {
          setIsAuthenticated(false);
          logDebug('âŒ No valid phone authentication found');
          setDashboardError('Authentication failed. Please log in again.');
        }
      } catch (error) {
        console.error('[StudentDashboard] Authentication check error:', error);
        setIsAuthenticated(false);
        setDashboardError('Authentication error occurred.');
      }
    };

    checkAuth();
  }, []);

  // Check API connection status
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        setApiConnectionStatus('checking');

        const response = await fetch('http://localhost:8080/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setApiConnectionStatus('connected');
          logDebug('âœ… Research API connected:', data);
        } else {
          throw new Error(`API returned status ${response.status}`);
        }
      } catch (error) {
        setApiConnectionStatus('disconnected');
        logDebug('âŒ Research API disconnected:', error);
        generateApiReconnectionNotification();
      }
    };

    checkApiConnection();

    const interval = setInterval(checkApiConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch student data and stats with enhanced error handling
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!phone) {
        navigate('/student');
        return;
      }

      setIsLoading(true);

      try {
        const { data: student, error } = await supabase
          .from('students')
          .select('*')
          .eq('phone', phone)
          .single();

        if (error) {
          logDebug('Supabase error:', error);
          throw error;
        }

        if (student) {
          setStudentName(student.name);
          setStudentData(student);
          logDebug('Student data loaded:', { name: student.name, id: student.id });

          await loadDashboardStats(student.id);
        }
      } catch (err) {
        console.error('[StudentDashboard] Error fetching student data:', err);
        setDashboardError('Failed to load student data. Some features may not work properly.');

        const fallbackName = localStorage.getItem('studentName');
        if (fallbackName) {
          setStudentName(fallbackName);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [phone, navigate]);

  // Load dashboard statistics with error handling
  const loadDashboardStats = async (studentId: string) => {
    try {
      logDebug('Loading dashboard stats for student:', studentId);

      const lastStudyDate = localStorage.getItem('lastStudyDate');
      const today = new Date().toDateString();
      let streak = parseInt(localStorage.getItem('studyStreak') || '0');

      if (lastStudyDate === today) {
        // Already studied today, keep streak
      } else if (lastStudyDate === new Date(Date.now() - 86400000).toDateString()) {
        streak += 1;
        localStorage.setItem('studyStreak', streak.toString());
        localStorage.setItem('lastStudyDate', today);
      } else if (lastStudyDate !== today) {
        streak = 0;
        localStorage.setItem('studyStreak', '0');
      }

      const totalTime = parseInt(localStorage.getItem('totalStudyTime') || '0');
      const completedTopics = JSON.parse(localStorage.getItem('completed_topics') || '[]').length;
      const activeGoals = parseInt(localStorage.getItem('activeGoals') || '0');

      const newStats: DashboardStats = {
        studyStreak: streak,
        totalStudyTime: totalTime,
        completedTopics,
        activeGoals,
      };

      setDashboardStats(newStats);
      logDebug('Dashboard stats loaded:', newStats);

      generateSmartNotifications(streak, totalTime, completedTopics);
    } catch (error) {
      console.error('[StudentDashboard] Error loading dashboard stats:', error);
      setDashboardError('Failed to load study statistics.');
    }
  };

  // Generate smart notifications with enhanced logic
  const generateSmartNotifications = (streak: number, totalTime: number, completedTopics: number) => {
    try {
      const newNotifications: Notification[] = [];

      if (apiConnectionStatus === 'disconnected') {
        newNotifications.push({
          id: 'api-disconnected',
          type: 'warning',
          title: 'âš ï¸ Research API Offline',
          message: 'Research features may not work properly. Please ensure the Python API is running.',
          priority: 'high',
          timestamp: new Date().toISOString(),
          actionable: true,
        });
      }

      if (streak > 0) {
        newNotifications.push({
          id: 'streak',
          type: 'achievement',
          title: `ðŸ”¥ ${streak} Day Study Streak!`,
          message: 'Keep up the great work! Consistency is key to success.',
          priority: 'medium',
          timestamp: new Date().toISOString(),
        });
      }

      if (completedTopics > 0 && completedTopics % 5 === 0) {
        newNotifications.push({
          id: 'milestone',
          type: 'achievement',
          title: 'ðŸŽ¯ Milestone Reached!',
          message: `You've completed ${completedTopics} topics. Great progress!`,
          priority: 'high',
          timestamp: new Date().toISOString(),
        });
      }

      const healthStatus = apiAvailability.healthStatus || 'unknown';
      if (healthStatus === 'excellent') {
        newNotifications.push({
          id: 'system',
          type: 'update',
          title: 'âœ… All Systems Operational',
          message: 'All AI features are working perfectly.',
          priority: 'low',
          timestamp: new Date().toISOString(),
        });
      } else if (healthStatus === 'poor' || healthStatus === 'critical') {
        newNotifications.push({
          id: 'system-issues',
          type: 'warning',
          title: 'âš ï¸ System Performance Issues',
          message: 'Some features may be slower than usual. We\'re working to resolve this.',
          priority: 'medium',
          timestamp: new Date().toISOString(),
        });
      }

      // Remove duplicates by ID
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const uniqueNotifications = newNotifications.filter((n) => !existingIds.has(n.id));
        return [...prev, ...uniqueNotifications];
      });
      logDebug('Generated notifications:', newNotifications.length);
    } catch (error) {
      console.error('[StudentDashboard] Error generating notifications:', error);
    }
  };

  // Generate API reconnection notification
  const generateApiReconnectionNotification = () => {
    const apiNotification: Notification = {
      id: 'api-reconnect',
      type: 'warning',
      title: 'ðŸ”Œ Research API Disconnected',
      message: 'AI research features are unavailable. Please start the Python API server.',
      priority: 'high',
      timestamp: new Date().toISOString(),
      actionable: true,
      action: 'Retry Connection',
    };

    setNotifications((prev) => {
      const filtered = prev.filter((n) => !n.id.includes('api'));
      return [apiNotification, ...filtered];
    });
  };

  // Handle logout with enhanced cleanup
  const handleLogout = async () => {
    try {
      logDebug('Logging out user');

      await supabase.auth.signOut();

      localStorage.removeItem('studentPhone');

      const sessionEndTime = new Date().toISOString();
      localStorage.setItem('lastSessionEnd', sessionEndTime);

      logDebug('Logout completed, redirecting to login');
      navigate('/student');
    } catch (error) {
      console.error('[StudentDashboard] Error during logout:', error);
      localStorage.removeItem('studentPhone');
      navigate('/student');
    }
  };

  

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Format session time
  const formatSessionTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Get API status indicator
  const getApiStatusIndicator = () => {
    switch (apiConnectionStatus) {
      case 'connected':
        return { color: '#10B981', text: 'âœ… API Connected', icon: <Activity size={16} /> };
      case 'disconnected':
        return { color: '#EF4444', text: 'âŒ API Offline', icon: <AlertTriangle size={16} /> };
      case 'checking':
        return { color: '#F59E0B', text: 'ðŸ”„ Checking...', icon: <RefreshCw size={16} className="animate-spin" /> };
      default:
        return { color: '#6B7280', text: 'â“ Unknown', icon: <AlertTriangle size={16} /> };
    }
  };

  // Retry API connection
  const retryApiConnection = async () => {
    try {
      setApiConnectionStatus('checking');

      const response = await fetch('http://localhost:8080/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setApiConnectionStatus('connected');
        setNotifications((prev) => prev.filter((n) => !n.id.includes('api')));
        logDebug('âœ… API reconnection successful');
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      setApiConnectionStatus('disconnected');
      logDebug('âŒ API reconnection failed:', error);
    }
  };

  // Handle topic search for SyllabusOrientedPreparation
  const handleTopicSearch = useCallback(
    (topicTitle: string) => {
      console.log('Topic search requested:', topicTitle);
      localStorage.setItem('aiTutorSearchQuery', topicTitle);
      setSelectedMenu('AI Tutor');
    },
    [setSelectedMenu]
  );

  const apiStatus = getApiStatusIndicator();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#2E1A47',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              border: '6px solid rgba(255, 215, 0, 0.2)',
              borderLeft: '6px solid #FFD700',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '1rem',
            }}
          />
          <p style={{ color: '#EDEDED', fontSize: '1.1rem' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary
      onError={(error) => {
        setDashboardError(error.message);
        console.error('[StudentDashboard] Component error:', error);
      }}
    >
      <div
        style={{
          minHeight: '100vh',
          background: '#2E1A47',
          padding: '1rem',
          fontFamily: "'Montserrat', sans-serif",
          color: '#EDEDED',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Enhanced Header */}
          <header
            className="header-section"
            style={{
              background: 'linear-gradient(135deg, #2E1A47, #1a1a4e)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#FFF8DC',
                  background: 'linear-gradient(45deg, #FFD700, #FFF8DC)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 0.5rem 0',
                }}
              >
                {getGreeting()}, {studentName}!
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {apiConnectionStatus === 'disconnected' && (
                <button
                  onClick={retryApiConnection}
                  className="error-indicator"
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  title="Retry API connection"
                >
                  <RefreshCw size={14} />
                  Reconnect
                </button>
              )}

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'linear-gradient(45deg, #1a1a4e, #2E1A47)',
                  color: '#EDEDED',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="tamil">Tamil</option>
                <option value="telugu">Telugu</option>
                <option value="kannada">Kannada</option>
                <option value="malayalam">Malayalam</option>
                <option value="marathi">Marathi</option>
                <option value="bengali">Bengali</option>
                <option value="gujarati">Gujarati</option>
                <option value="punjabi">Punjabi</option>
              </select>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(255, 215, 0, 0.1)',
                    color: '#FFD700',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <div
                      className="notification-badge"
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        color: 'white',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                      }}
                    >
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </div>
                  )}
                </button>

                {showNotifications && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.5rem',
                      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      minWidth: '300px',
                      maxWidth: '400px',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      zIndex: 1000,
                      animation: 'slideIn 0.3s ease-out',
                    }}
                  >
                    <h4 style={{ color: '#FFD700', margin: '0 0 1rem 0', fontSize: '1rem' }}>
                      Notifications ({notifications.length})
                    </h4>
                    {notifications.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            style={{
                              padding: '0.75rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '0.5rem',
                              border: `1px solid ${
                                notif.priority === 'high' ? '#EF4444' : notif.priority === 'medium' ? '#F59E0B' : '#10B981'
                              }`,
                            }}
                          >
                            <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                              {notif.title}
                            </div>
                            <div style={{ color: '#EDEDED', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                              {notif.message}
                            </div>
                            {notif.actionable && notif.id.includes('api') && (
                              <button
                                onClick={retryApiConnection}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  background: 'rgba(255, 215, 0, 0.2)',
                                  color: '#FFD700',
                                  border: '1px solid rgba(255, 215, 0, 0.3)',
                                  borderRadius: '0.25rem',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem',
                                }}
                              >
                                Retry Connection
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#B19CD9', fontSize: '0.9rem' }}>
                        No new notifications
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedMenu('Edit Profile')}
                style={{
                  padding: '0.5rem',
                  background: selectedMenu === 'Edit Profile' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.1)',
                  color: selectedMenu === 'Edit Profile' ? '#FFD700' : '#EDEDED',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <User size={18} />
              </button>

              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(45deg, #B19CD9, #FFD700)',
                  color: '#2E1A47',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </header>

          {dashboardError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={20} style={{ color: '#EF4444' }} />
              <span style={{ color: '#EF4444', fontSize: '0.9rem' }}>{dashboardError}</span>
              <button
                onClick={() => setDashboardError(null)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                Ã—
              </button>
            </div>
          )}

          <Navigation selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} isAuthenticated={isAuthenticated} />

          <div className="main-content-area" style={{ marginTop: '0.5rem' }}>
            {selectedMenu === 'AI Tutor' && (
              <AITutor
                selectedLanguage={selectedLanguage}
                initialQuery={query}
                setQuery={setQuery}
                isAuthenticated={isAuthenticated}
              />
            )}

            {selectedMenu === 'Exam Alert' && <ExamAlert />}

            {selectedMenu === 'Edit Profile' && <EditProfile studentPhone={phone} />}

            

            {selectedMenu === 'Exam bot' && (
              <ExamBot selectedLanguage={selectedLanguage} isAuthenticated={isAuthenticated} />
            )}

            {selectedMenu === 'Aptitude' && (
              <Aptitude
                studentPhone={phone}
                selectedLanguage={selectedLanguage}
                isAuthenticated={isAuthenticated}
              />
            )}

            {selectedMenu === 'Syllabus Oriented Preparation' && studentData && (
              <SyllabusOrientedPreparation
                userId={studentData.id}
                isAuthenticated={isAuthenticated}
                setSelectedMenu={setSelectedMenu}
                handleTopicSearch={handleTopicSearch}
              />
            )}

            {selectedMenu === 'Mock Interview' && <VapiUPSCInterview selectedLanguage={selectedLanguage} />}

            {selectedMenu === 'Answer Evaluation' && (
              <AnswerEvaluation
                selectedLanguage={selectedLanguage}
                isAuthenticated={isAuthenticated}
              />
            )}

            {selectedMenu === 'Current Affairs' && (
              <CurrentAffairs
                selectedLanguage={selectedLanguage}
                isAuthenticated={isAuthenticated}
              />
            )}

            {selectedMenu === 'Mock Test' && (
              <div style={{ 
                background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)', 
                borderRadius: '0.75rem', 
                padding: '2rem', 
                border: '1px solid rgba(255, 215, 0, 0.2)' 
              }}>
                {/* Filter Tabs - Only 3 tabs: Available, Paused, Completed */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                  <button
                    onClick={() => {
                      setTestFilter('available');
                      if (mockTestHook.refreshData) {
                        mockTestHook.refreshData();
                      }
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: testFilter === 'available' ? '#3b82f6' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <FileText size={16} />
                    Available Tests
                  </button>
                  <button
                    onClick={() => {
                      setTestFilter('paused');
                      if (mockTestHook.refreshData) {
                        mockTestHook.refreshData();
                      }
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: testFilter === 'paused' ? '#f59e0b' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Zap size={16} />
                    Paused ({mockTestHook.inProgressTests?.filter((t: any) => t.status === 'paused').length || 0})
                  </button>
                  <button
                    onClick={() => {
                      setTestFilter('completed');
                      if (mockTestHook.refreshData) {
                        mockTestHook.refreshData();
                      }
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: testFilter === 'completed' ? '#10b981' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <BarChart3 size={16} />
                    Completed ({mockTestHook.testHistory?.length || 0})
                  </button>
                </div>

                {/* Content based on filter - Use MockTest component with filter */}
                <MockTest 
                  selectedLanguage={selectedLanguage} 
                  isAuthenticated={isAuthenticated}
                  testFilter={testFilter}
                />
              </div>
            )}

            {selectedMenu === 'Schemes' && (
  <Schemes 
    selectedLanguage={selectedLanguage}
    isAuthenticated={isAuthenticated}
  />
)}

          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

export default StudentDashboard;
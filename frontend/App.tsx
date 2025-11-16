import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StudentDashboard from './components/StudentDashboard';
import StudentAuth from './components/auth/StudentAuth';
import AdminLogin from './components/auth/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import TutorAuth from './components/auth/TutorAuth';
import TutorDashboard from './components/TutorDashboard';
import ModeSelection from './components/ModeSelection';
import ManualLearningDashboard from './components/ManualLearningDashboard';
import Debug from './components/Debug';

// Enhanced home page component with three login options
const HomePage = () => (
  <>
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2E1A47 0%, #1e3a8a 50%, #1e293b 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '2rem',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '15%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(177, 156, 217, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0,
      }} />

      {/* Main content */}
      <div style={{ zIndex: 1, position: 'relative' }}>
        <h1 style={{ 
          marginBottom: '1rem',
          fontSize: '3rem',
          fontWeight: '700',
          background: 'linear-gradient(45deg, #FFD700, #FFF8DC, #B19CD9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}>
          Welcome to AI Tutor
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          marginBottom: '3rem',
          color: '#E5E7EB',
          maxWidth: '600px',
          lineHeight: '1.6',
        }}>
          Your comprehensive learning platform with AI-powered tutoring, mock tests, 
          and personalized education for competitive exam preparation.
        </p>

        {/* Login buttons container */}
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {/* Student Login */}
          <a 
            href="/student" 
            style={{
              padding: '1.2rem 2.5rem',
              background: 'linear-gradient(45deg, #7c3aed, #8b5cf6)',
              color: 'white',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '1.1rem',
              boxShadow: '0 8px 25px rgba(124, 58, 237, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: '200px',
              border: '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(124, 58, 237, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.3)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '2rem' }}>ðŸŽ“</span>
            <span>Student Login</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Learn & Practice</span>
          </a>

          {/* Tutor Login */}
          <a 
            href="/tutor" 
            style={{
              padding: '1.2rem 2.5rem',
              background: 'linear-gradient(45deg, #10b981, #34d399)',
              color: 'white',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '1.1rem',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: '200px',
              border: '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '2rem' }}>ðŸ‘¨â€ðŸ«</span>
            <span>Tutor Login</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Teach & Guide</span>
          </a>

          {/* Admin Login */}
          <a 
            href="/admin" 
            style={{
              padding: '1.2rem 2.5rem',
              background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
              color: 'white',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '1.1rem',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: '200px',
              border: '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '2rem' }}>âš™ï¸</span>
            <span>Admin Login</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Manage System</span>
          </a>
        </div>

        {/* Feature highlights */}
        <div style={{
          marginTop: '4rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          maxWidth: '900px',
        }}>
          {[
            { icon: 'ðŸ¤–', title: 'AI-Powered Learning', desc: 'Personalized tutoring with advanced AI' },
            { icon: 'ðŸ“', title: 'Mock Tests', desc: 'Comprehensive practice examinations' },
            { icon: 'ðŸŽ¤', title: 'Interview Practice', desc: 'Voice-based mock interviews' },
            { icon: 'ðŸ“Š', title: 'Progress Tracking', desc: 'Detailed analytics and insights' }
          ].map((feature, index) => (
            <div key={index} style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{feature.icon}</div>
              <h3 style={{ color: '#FFD700', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{feature.title}</h3>
              <p style={{ color: '#E5E7EB', fontSize: '0.9rem', margin: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

const App = () => {
  const location = useLocation();
  
  // Clear authentication data on initial load, but only if on the home page
  useEffect(() => {
    if (location.pathname === '/') {
      localStorage.removeItem('studentPhone');
      localStorage.removeItem('studentName');
      localStorage.removeItem('tutorUsername');
      localStorage.removeItem('tutorId');
      sessionStorage.removeItem('adminLoggedIn');
      console.log("Auth data cleared on homepage visit");
    }
  }, [location.pathname]);
  
  // Check authentication states
  const isStudentLoggedIn = localStorage.getItem('studentPhone') !== null;
  const isTutorLoggedIn = localStorage.getItem('tutorUsername') !== null && localStorage.getItem('tutorId') !== null;
  const isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
  
  // Debug login states
  useEffect(() => {
    console.log("Student login state:", isStudentLoggedIn, localStorage.getItem('studentPhone'));
    console.log("Tutor login state:", isTutorLoggedIn, localStorage.getItem('tutorUsername'));
    console.log("Admin login state:", isAdminLoggedIn, sessionStorage.getItem('adminLoggedIn'));
  }, [isStudentLoggedIn, isTutorLoggedIn, isAdminLoggedIn]);
  
  return (
    <>
      <Routes>
        {/* Root route - show enhanced home page */}
        <Route path="/" element={<HomePage />} />
        
        <Route path="/student" element={<StudentAuth />} />

<Route path="/student/mode-selection" element={
  isStudentLoggedIn ? <ModeSelection /> : <Navigate to="/student" />
} />

<Route path="/student/dashboard" element={
  isStudentLoggedIn ? <StudentDashboard /> : <Navigate to="/student" />
} />

<Route path="/student/manual-dashboard" element={
  isStudentLoggedIn ? <ManualLearningDashboard /> : <Navigate to="/student" />
} />
        
        {/* Tutor routes */}
        <Route path="/tutor" element={
          isTutorLoggedIn ? <Navigate to="/tutor/dashboard" /> : <TutorAuth />
        } />
        <Route path="/tutor/dashboard" element={
          isTutorLoggedIn ? <TutorDashboard /> : <Navigate to="/tutor" />
        } />
        
        {/* Admin routes */}
        <Route path="/admin" element={
          isAdminLoggedIn ? <Navigate to="/admin/dashboard" /> : <AdminLogin />
        } />
        <Route path="/admin/dashboard" element={
          isAdminLoggedIn ? <AdminDashboard /> : <Navigate to="/admin" />
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {/* Debug component - conditionally render for development */}
      {process.env.NODE_ENV !== 'production' && <Debug />}
    </>
  );
};

export default App;
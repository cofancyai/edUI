import React, { useState } from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import AITutor from './AITutor';
import Schemes from './Schemes';
import ExamAlert from './ExamAlert';
import Navigation from './Navigation';
import Quiz from './quiz/Quiz';
import ExamBot from './examBot/ExamBot';
import Aptitude from './Aptitude';
import ComingSoon from './ComingSoon';

const StudentDashboard: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState('AI Tutor');

  const handleGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
      color: '#EDEDED',
      fontFamily: 'Montserrat, sans-serif'
    }}>
      <header style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div>
          <h3 style={{
            color: '#B19CD9',
            fontSize: '1rem',
            fontWeight: '500',
            margin: 0
          }}>
            {handleGreeting()}
          </h3>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            color: '#FFD700',
            fontSize: '2rem',
            fontWeight: '700',
            margin: 0,
            marginBottom: '0.25rem',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Welcome to PrepNX
          </h1>
          <p style={{
            color: '#EDEDED',
            fontSize: '1rem',
            margin: 0,
            opacity: 0.8
          }}>
            Your Learning Journey Starts Here
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button style={{
            padding: '0.5rem',
            background: 'rgba(255, 215, 0, 0.1)',
            color: '#EDEDED',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}>
            <Bell size={18} />
          </button>
          <button style={{
            padding: '0.5rem',
            background: 'rgba(255, 215, 0, 0.1)',
            color: '#EDEDED',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}>
            <User size={18} />
          </button>
          <button style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(45deg, #B19CD9, #FFD700)',
            color: '#2E1A47',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '600'
          }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <Navigation selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} />

      <div style={{ marginTop: '0.5rem', padding: '1rem 2rem' }}>
        {selectedMenu === 'AI Tutor' && (
          <AITutor />
        )}

        {selectedMenu === 'Schemes' && (
          <Schemes selectedLanguage="english" isAuthenticated={true} />
        )}

        {selectedMenu === 'Exam Alert' && (
          <ExamAlert selectedLanguage="english" isAuthenticated={true} />
        )}

        {selectedMenu === 'Exam bot' && (
          <ExamBot selectedLanguage="english" isAuthenticated={true} />
        )}

        {selectedMenu === 'Aptitude' && (
          <Aptitude selectedLanguage="english" isAuthenticated={true} />
        )}

        {selectedMenu === 'Mock Test' && (
          <Quiz />
        )}

        {selectedMenu === 'Current Affairs' && (
          <Quiz initialTopic="Current Affairs" />
        )}

        {!['AI Tutor', 'Schemes', 'Exam Alert', 'Exam bot', 'Aptitude', 'Mock Test', 'Current Affairs'].includes(selectedMenu) && (
          <ComingSoon featureName={selectedMenu} />
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
import React from 'react';
import { 
  BookOpen, 
  Bell, 
  Brain, 
  Target, 
  FileText,
  TrendingUp,
  Mic,
  Award,
  Newspaper,
  Search
} from 'lucide-react';

interface NavigationProps {
  selectedMenu: string | null;
  setSelectedMenu: (menu: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ selectedMenu, setSelectedMenu }) => {
  // Menu items with enhanced styling configuration
  const menuItems = [
    { name: 'AI Tutor', icon: Brain, color: '#3b82f6', description: 'Comprehensive AI-powered learning' },
    { name: 'Schemes', icon: Search, color: '#10b981', description: 'Government schemes finder' },
    { name: 'Exam Alert', icon: Bell, color: '#f59e0b', description: 'Important exam notifications' },
    { name: 'Exam bot', icon: Target, color: '#ef4444', description: 'Practice with exam questions' },
    { name: 'Aptitude', icon: TrendingUp, color: '#8b5cf6', description: 'Aptitude test preparation' },
    { 
      name: 'Syllabus Oriented Preparation', 
      icon: FileText, 
      color: '#06b6d4', 
      description: 'Curriculum-based learning'
    },
    { 
      name: 'Mock Interview', 
      icon: Mic, 
      color: '#d946ef', 
      description: 'AI-powered UPSC interview practice'
    },
    { 
      name: 'Answer Evaluation', 
      icon: Award, 
      color: '#ec4899', 
      description: 'AI-powered handwritten answer evaluation'
    },
    { 
      name: 'Current Affairs', 
      icon: Newspaper, 
      color: '#f97316', 
      description: 'Daily news and quiz'
    },
    { name: 'Mock Test', icon: BookOpen, color: '#84cc16', description: 'Practice examinations' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {/* Main Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #2E1A47, #1a1a4e)',
        borderRadius: '1rem',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        flexWrap: 'wrap',
        gap: '0.75rem',
        border: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedMenu === item.name;

          return (
            <button
              key={item.name}
              onClick={() => setSelectedMenu(item.name)}
              style={{
                padding: '0.875rem 1.5rem',
                margin: '0',
                background: isSelected 
                  ? 'linear-gradient(45deg, #FFD700, #B19CD9)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: isSelected 
                  ? '2px solid #FFD700' 
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: isSelected ? '#2E1A47' : '#EDEDED',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '50px',
                boxShadow: isSelected 
                  ? '0 6px 20px rgba(255, 215, 0, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              title={item.description}
            >
              {/* Background glow effect for selected item */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(177, 156, 217, 0.1))',
                  borderRadius: '0.75rem',
                  animation: 'pulse 2s infinite',
                  zIndex: 0
                }} />
              )}
              
              <Icon size={20} style={{ 
                color: isSelected ? '#2E1A47' : item.color,
                zIndex: 1,
                position: 'relative'
              }} />
              <span style={{ zIndex: 1, position: 'relative' }}>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;

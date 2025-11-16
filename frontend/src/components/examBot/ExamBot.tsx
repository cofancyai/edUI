import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, Award, Brain } from 'lucide-react';

// Note: This is a simplified ExamBot component that will show a "Coming Soon" state
// The full implementation requires useExamBot hook, database integration, and API endpoints

interface ExamBotProps {
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

const ExamBot: React.FC<ExamBotProps> = ({ selectedLanguage = 'english', isAuthenticated = false }) => {
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
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <Brain size={48} style={{ color: '#FFD700' }} />
        <h2 style={{
          color: '#FFD700',
          fontSize: '2rem',
          fontWeight: '700',
          margin: 0,
          background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Exam Bot - Past Year Questions
        </h2>
      </div>

      {/* Description */}
      <p style={{
        color: '#B19CD9',
        fontSize: '1.1rem',
        marginBottom: '2rem',
        maxWidth: '600px',
        lineHeight: '1.6'
      }}>
        Search and practice from thousands of past year questions across various competitive exams.
        Filter by topic, difficulty, and year to create your perfect practice session.
      </p>

      {/* Features */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '800px',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <Search size={32} style={{ color: '#FFD700', marginBottom: '0.5rem' }} />
          <h3 style={{ color: '#EDEDED', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Smart Search</h3>
          <p style={{ color: '#B19CD9', fontSize: '0.9rem', margin: 0 }}>
            Find questions by topic, keyword, or exam name
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <Clock size={32} style={{ color: '#FFD700', marginBottom: '0.5rem' }} />
          <h3 style={{ color: '#EDEDED', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Timed Tests</h3>
          <p style={{ color: '#B19CD9', fontSize: '0.9rem', margin: 0 }}>
            Practice with realistic exam time constraints
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <CheckCircle size={32} style={{ color: '#FFD700', marginBottom: '0.5rem' }} />
          <h3 style={{ color: '#EDEDED', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Detailed Explanations</h3>
          <p style={{ color: '#B19CD9', fontSize: '0.9rem', margin: 0 }}>
            Learn from comprehensive answer explanations
          </p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <div style={{
        background: 'rgba(255, 215, 0, 0.1)',
        padding: '1.5rem 2rem',
        borderRadius: '0.75rem',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        marginTop: '1rem'
      }}>
        <Award size={32} style={{ color: '#FFD700', marginBottom: '0.5rem' }} />
        <h3 style={{ color: '#FFD700', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
          Full Implementation Coming Soon!
        </h3>
        <p style={{ color: '#EDEDED', margin: 0, fontSize: '0.95rem' }}>
          We're building a comprehensive question bank with thousands of past year questions.
          This feature will be available shortly with full search, filtering, and test capabilities.
        </p>
      </div>

      {/* Note */}
      <p style={{
        color: '#6B7280',
        fontSize: '0.85rem',
        marginTop: '2rem',
        fontStyle: 'italic'
      }}>
        Note: This feature requires database integration and API endpoints for full functionality
      </p>
    </div>
  );
};

export default ExamBot;

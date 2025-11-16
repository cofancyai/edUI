// src/components/dashboard/ExamBot/TestResults.tsx

import React from 'react';
import { TestResult } from '../../../types/examBot.types';

interface TestResultsProps {
  result: TestResult;
  onReviewTest: () => void;
  onNewTest: () => void;
  onHomePage: () => void;
}

const TestResults: React.FC<TestResultsProps> = ({
  result,
  onReviewTest,
  onNewTest,
  onHomePage
}) => {
  // Format time taken
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins > 0) {
      return `${mins} min${mins !== 1 ? 's' : ''} ${secs} sec${secs !== 1 ? 's' : ''}`;
    }
    
    return `${secs} second${secs !== 1 ? 's' : ''}`;
  };
  
  // Get score grade and color
  const getScoreGrade = (percentage: number): { grade: string; color: string } => {
    if (percentage >= 90) return { grade: 'Excellent', color: '#27ae60' };
    if (percentage >= 75) return { grade: 'Very Good', color: '#2ecc71' };
    if (percentage >= 60) return { grade: 'Good', color: '#f39c12' };
    if (percentage >= 45) return { grade: 'Average', color: '#e67e22' };
    if (percentage >= 33) return { grade: 'Pass', color: '#e74c3c' };
    return { grade: 'Needs Improvement', color: '#c0392b' };
  };
  
  const scoreGrade = getScoreGrade(result.accuracy);
  
  return (
    <div style={{
      background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
      borderRadius: '0.75rem',
      padding: '2rem',
      color: '#EDEDED',
      maxWidth: '800px',
      margin: '0 auto',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
    }}>
      <h2 style={{ 
        color: '#FFF8DC', 
        fontSize: '1.75rem', 
        marginBottom: '0.5rem',
        textAlign: 'center'
      }}>
        Test Results
      </h2>
      
      <p style={{ textAlign: 'center', color: '#B19CD9', marginBottom: '2rem' }}>
        You have completed your test. Here's how you performed.
      </p>
      
      {/* Score circle */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `conic-gradient(${scoreGrade.color} ${result.accuracy}%, #2E1A47 0)`,
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}>
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: '#1a1a4e',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: 'bold',
              color: scoreGrade.color
            }}>
              {result.accuracy}%
            </div>
            <div style={{ 
              color: scoreGrade.color, 
              fontSize: '1.1rem',
              fontWeight: '500'
            }}>
              {scoreGrade.grade}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#B19CD9', marginBottom: '0.5rem' }}>
            Total Questions
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FFF8DC' }}>
            {result.totalQuestions}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#B19CD9', marginBottom: '0.5rem' }}>
            Correct Answers
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>
            {result.correctAnswers}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#B19CD9', marginBottom: '0.5rem' }}>
            Incorrect Answers
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
            {result.incorrectAnswers}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#B19CD9', marginBottom: '0.5rem' }}>
            Unanswered
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>
            {result.unansweredQuestions}
          </div>
        </div>
      </div>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: '0.9rem', color: '#B19CD9', marginBottom: '0.5rem' }}>
          Time Taken
        </div>
        <div style={{ fontSize: '1.2rem', color: '#FFF8DC' }}>
          {formatTime(result.timeTaken)}
        </div>
      </div>
      
      {/* Action buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <button
          onClick={onReviewTest}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(45deg, #B19CD9, #FFD700)',
            color: '#2E1A47',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
            fontSize: '1rem'
          }}
        >
          Review Answers
        </button>
        
        <button
          onClick={onNewTest}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#EDEDED',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Start New Test
        </button>
        
        <button
          onClick={onHomePage}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            color: '#B19CD9',
            border: '1px solid #B19CD9',
            borderRadius: '0.5rem',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Back to Topics
        </button>
      </div>
    </div>
  );
};

export default TestResults;
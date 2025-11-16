import React from 'react';
import { UserProgress } from '../../../types/examBot.types';

interface ProgressTrackerProps {
  progress: UserProgress;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progress }) => {
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  return (
    <div style={{
      padding: '1.5rem',
      color: '#EDEDED'
    }}>
      <h2 style={{ 
        color: '#FFF8DC', 
        fontSize: '1.5rem', 
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        Your Progress
      </h2>
      
      {/* Summary stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '1rem', color: '#B19CD9', marginBottom: '0.5rem' }}>
            Tests Completed
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFF8DC' }}>
            {progress.totalTests || 0}
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '1rem', color: '#B19CD9', marginBottom: '0.5rem' }}>
            Questions Answered
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFF8DC' }}>
            {progress.totalQuestions || 0}
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '1rem', color: '#B19CD9', marginBottom: '0.5rem' }}>
            Overall Accuracy
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFF8DC' }}>
            {progress.totalQuestions ? Math.round((progress.correctAnswers / progress.totalQuestions) * 100) : 0}%
          </div>
        </div>
      </div>
      
      {/* Topic performance */}
      <div style={{
        background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ color: '#FFF8DC', marginBottom: '1rem' }}>
          Performance by Topic
        </h3>
        
        {progress.topicPerformance && Object.keys(progress.topicPerformance).length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {Object.entries(progress.topicPerformance).map(([topic, data]) => (
              <div
                key={topic}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '1rem',
                  borderRadius: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: '500' }}>{topic}</div>
                  <div style={{ 
                    color:
                      data.accuracy >= 75 ? '#27ae60' :
                      data.accuracy >= 50 ? '#f39c12' : 
                      '#e74c3c',
                    fontWeight: 'bold'
                  }}>
                    {data.accuracy}%
                  </div>
                </div>
                
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#1a1a4e',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${data.accuracy}%`,
                    height: '100%',
                    background: 
                      data.accuracy >= 75 ? '#27ae60' :
                      data.accuracy >= 50 ? '#f39c12' : 
                      '#e74c3c',
                    borderRadius: '4px'
                  }}></div>
                </div>
                
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#B19CD9', 
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Answered: {data.total}</span>
                  <span>Correct: {data.correct}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#B19CD9', fontSize: '0.9rem' }}>
            Complete tests to see your topic performance.
          </p>
        )}
      </div>
      
      {/* Strengths and weaknesses */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ color: '#27ae60', marginBottom: '1rem' }}>
            Your Strengths
          </h3>
          
          {progress.strengths && progress.strengths.length > 0 ? (
            <ul style={{ paddingLeft: '1.5rem' }}>
              {progress.strengths.map((topic, index) => (
                <li key={index} style={{ marginBottom: '0.5rem' }}>
                  {topic}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#B19CD9', fontSize: '0.9rem' }}>
              Complete more tests to identify your strengths.
            </p>
          )}
        </div>
        
        <div style={{
          background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ color: '#e74c3c', marginBottom: '1rem' }}>
            Areas to Improve
          </h3>
          
          {progress.weaknesses && progress.weaknesses.length > 0 ? (
            <ul style={{ paddingLeft: '1.5rem' }}>
              {progress.weaknesses.map((topic, index) => (
                <li key={index} style={{ marginBottom: '0.5rem' }}>
                  {topic}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#B19CD9', fontSize: '0.9rem' }}>
              Complete more tests to identify areas for improvement.
            </p>
          )}
        </div>
      </div>
      
      {/* Recent tests */}
      <div style={{
        background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ color: '#FFF8DC', marginBottom: '1rem' }}>
          Recent Tests
        </h3>
        
        {progress.recentTests && progress.recentTests.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0 8px'
            }}>
              <thead>
                <tr>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '0.5rem 1rem', 
                    color: '#B19CD9',
                    fontWeight: '500',
                    fontSize: '0.9rem'
                  }}>Date</th>
                  <th style={{ 
                    textAlign: 'center', 
                    padding: '0.5rem 1rem', 
                    color: '#B19CD9',
                    fontWeight: '500',
                    fontSize: '0.9rem'
                  }}>Questions</th>
                  <th style={{ 
                    textAlign: 'center', 
                    padding: '0.5rem 1rem', 
                    color: '#B19CD9',
                    fontWeight: '500',
                    fontSize: '0.9rem'
                  }}>Correct</th>
                  <th style={{ 
                    textAlign: 'center', 
                    padding: '0.5rem 1rem', 
                    color: '#B19CD9',
                    fontWeight: '500',
                    fontSize: '0.9rem'
                  }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {progress.recentTests.map((test, index) => {
                  // Safely get date from test object
                  let dateStr: string = 'Unknown date';
                  
                  // Type cast to access properties safely
                  const testAny = test as any;
                  
                  if (testAny.created_at) {
                    dateStr = formatDate(testAny.created_at);
                  } else if (testAny.timestamp) {
                    dateStr = formatDate(testAny.timestamp);
                  } else if (testAny.date) {
                    dateStr = formatDate(testAny.date);
                  } else if (testAny.endTime) {
                    dateStr = formatDate(typeof testAny.endTime === 'string' ? testAny.endTime : testAny.endTime?.toISOString());
                  }
                  
                  return (
                    <tr 
                      key={index}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.5rem'
                      }}
                    >
                      <td style={{ 
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem 0 0 0.5rem'
                      }}>
                        {dateStr}
                      </td>
                      <td style={{ 
                        textAlign: 'center',
                        padding: '0.75rem 1rem'
                      }}>
                        {test.totalQuestions}
                      </td>
                      <td style={{ 
                        textAlign: 'center',
                        padding: '0.75rem 1rem'
                      }}>
                        {test.correctAnswers}
                      </td>
                      <td style={{ 
                        textAlign: 'center',
                        padding: '0.75rem 1rem',
                        borderRadius: '0 0.5rem 0.5rem 0',
                        fontWeight: 'bold',
                        color:
                          test.accuracy >= 75 ? '#27ae60' :
                          test.accuracy >= 50 ? '#f39c12' : 
                          '#e74c3c'
                      }}>
                        {test.accuracy}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#B19CD9', fontSize: '0.9rem' }}>
            No test history yet. Complete a test to see your results here.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;
import React from 'react';
import { AptitudeCategory, AptitudeStats } from '../../../types/aptitude.types';

interface ProgressTrackerProps {
  stats: AptitudeStats;
  categories: AptitudeCategory[];
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ stats, categories }) => {
  // Function to generate colors for different categories
  const getCategoryColor = (index: number, opacity = 1) => {
    const colors = [
      `rgba(255, 99, 132, ${opacity})`,
      `rgba(54, 162, 235, ${opacity})`,
      `rgba(255, 206, 86, ${opacity})`,
      `rgba(75, 192, 192, ${opacity})`,
      `rgba(153, 102, 255, ${opacity})`,
      `rgba(255, 159, 64, ${opacity})`,
    ];
    
    return colors[index % colors.length];
  };
  
  // If no questions attempted yet
  if (stats.total_completed === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#94A3B8'
      }}>
        <p>You haven't completed any aptitude questions yet.</p>
        <p style={{ marginTop: '0.5rem' }}>Start practicing to see your progress!</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Difficulty breakdown */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <h4 style={{
          fontSize: '1rem',
          color: '#B19CD9',
          marginBottom: '1rem'
        }}>
          Performance by Difficulty
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          {Object.entries(stats.by_difficulty).map(([difficulty, data], index) => {
            if (data.total === 0) return null;
            
            return (
              <div
                key={difficulty}
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  border: `1px solid ${difficulty === 'easy' 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : difficulty === 'medium' 
                      ? 'rgba(250, 204, 21, 0.2)' 
                      : difficulty === 'hard' 
                        ? 'rgba(249, 115, 22, 0.2)' 
                        : 'rgba(239, 68, 68, 0.2)'}`
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{
                    fontSize: '0.9rem',
                    color: difficulty === 'easy' 
                      ? '#22c55e' 
                      : difficulty === 'medium' 
                        ? '#facc15' 
                        : difficulty === 'hard' 
                          ? '#f97316' 
                          : '#ef4444',
                    textTransform: 'capitalize'
                  }}>
                    {difficulty.replace('_', ' ')}
                  </span>
                  
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#94A3B8'
                  }}>
                    {data.correct}/{data.total}
                  </span>
                </div>
                
                <div style={{
                  width: '100%',
                  height: '0.35rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.25rem',
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: `${data.accuracy}%`,
                    height: '100%',
                    backgroundColor: difficulty === 'easy' 
                      ? 'rgba(34, 197, 94, 0.5)' 
                      : difficulty === 'medium' 
                        ? 'rgba(250, 204, 21, 0.5)' 
                        : difficulty === 'hard' 
                          ? 'rgba(249, 115, 22, 0.5)' 
                          : 'rgba(239, 68, 68, 0.5)',
                    borderRadius: '0.25rem'
                  }} />
                </div>
                
                <div style={{
                  fontSize: '0.8rem',
                  color: '#EDEDED',
                  textAlign: 'right'
                }}>
                  {Math.round(data.accuracy)}% accuracy
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Recent activity placeholder */}
      <div>
        <h4 style={{
          fontSize: '1rem',
          color: '#B19CD9',
          marginBottom: '1rem'
        }}>
          Recent Activity
        </h4>
        
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.5rem',
          color: '#94A3B8',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          Activity tracking will be available soon!
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
// src/components/dashboard/ExamBot/ExamSettings.tsx

import React, { useState } from 'react';
import { TestConfig } from '../../../types/examBot.types';

interface ExamSettingsProps {
  config: TestConfig;
  updateConfig: (config: Partial<TestConfig>) => void;
  onStartTest: () => void;
  onBack: () => void;
  selectedTopicsCount: number;
}

const ExamSettings: React.FC<ExamSettingsProps> = ({
  config,
  updateConfig,
  onStartTest,
  onBack,
  selectedTopicsCount
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      updateConfig({ questionCount: value });
    }
  };

  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      updateConfig({ timeLimit: value });
    }
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateConfig({ difficulty: e.target.value as 'easy' | 'medium' | 'hard' | 'mixed' });
  };

  const handleRandomizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ randomize: e.target.checked });
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      color: '#EDEDED',
      maxWidth: '600px',
      margin: '0 auto',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
    }}>
      <h2 style={{ 
        color: '#FFF8DC', 
        fontSize: '1.5rem', 
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        Configure Your Test
      </h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ color: '#EDEDED', fontSize: '0.9rem', textAlign: 'center' }}>
          Customize your test parameters for {selectedTopicsCount} selected topic{selectedTopicsCount !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#B19CD9' }}>
          Number of Questions
        </label>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={config.questionCount}
          onChange={handleQuestionCountChange}
          style={{ width: '100%', accentColor: '#FFD700' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem' }}>5</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{config.questionCount} questions</span>
          <span style={{ fontSize: '0.8rem' }}>100</span>
        </div>
      </div>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#B19CD9' }}>
          Time Limit
        </label>
        <input
          type="range"
          min="5"
          max="180"
          step="5"
          value={config.timeLimit}
          onChange={handleTimeLimitChange}
          style={{ width: '100%', accentColor: '#FFD700' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem' }}>5 min</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{config.timeLimit} minutes</span>
          <span style={{ fontSize: '0.8rem' }}>180 min</span>
        </div>
      </div>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          style={{
            background: 'transparent',
            border: '1px solid #B19CD9',
            color: '#B19CD9',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>Advanced Settings</span>
          <span>{isAdvancedOpen ? 'â–²' : 'â–¼'}</span>
        </button>
        
        {isAdvancedOpen && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '0.5rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#B19CD9' }}>
                Difficulty Level
              </label>
              <select
                value={config.difficulty}
                onChange={handleDifficultyChange}
                style={{ 
                  width: '100%',
                  padding: '0.5rem',
                  background: '#2E1A47',
                  border: '1px solid #B19CD9',
                  borderRadius: '0.25rem',
                  color: '#EDEDED'
                }}
              >
                <option value="mixed">Mixed (All Levels)</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="randomize"
                checked={config.randomize}
                onChange={handleRandomizeChange}
                style={{ marginRight: '0.5rem' }}
              />
              <label htmlFor="randomize">
                Randomize Questions
              </label>
            </div>
          </div>
        )}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginTop: '2rem'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#EDEDED',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Back
        </button>
        
        <button
          onClick={onStartTest}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(45deg, #B19CD9, #FFD700)',
            color: '#2E1A47',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
          }}
        >
          Start Test
        </button>
      </div>
    </div>
  );
};

export default ExamSettings;







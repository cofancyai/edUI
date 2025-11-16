// src/components/dashboard/ExamBot/TestFilters.tsx

import React, { useState, useEffect } from 'react';
import { Question } from '../../../types/examBot.types';

interface TestFiltersProps {
  questions: Question[];
  onApplyFilters: (filters: { difficulty: string[], year: number[] }) => void;
}

const TestFilters: React.FC<TestFiltersProps> = ({ questions, onApplyFilters }) => {
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  
  // Extract available difficulties and years from questions
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  useEffect(() => {
    if (questions && questions.length > 0) {
      // Extract unique difficulties
      const difficulties = [...new Set(
        questions
          .map(q => q.difficulty)
          .filter(Boolean)
      )].sort();
      
      // Extract unique years
      const years = [...new Set(
        questions
          .map(q => q.year)
          .filter(Boolean)
      )].sort((a, b) => b - a); // Sort years in descending order
      
      setAvailableDifficulties(difficulties);
      setAvailableYears(years);
    }
  }, [questions]);
  
  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulties(prev => {
      if (prev.includes(difficulty)) {
        return prev.filter(d => d !== difficulty);
      } else {
        return [...prev, difficulty];
      }
    });
  };
  
  const handleYearChange = (year: number) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        return prev.filter(y => y !== year);
      } else {
        return [...prev, year];
      }
    });
  };
  
  const applyFilters = () => {
    onApplyFilters({
      difficulty: selectedDifficulties,
      year: selectedYears
    });
  };
  
  const clearFilters = () => {
    setSelectedDifficulties([]);
    setSelectedYears([]);
    
    // Make sure we call onApplyFilters with empty arrays to reset the filters
    onApplyFilters({ 
      difficulty: [], 
      year: [] 
    });
  };
  
  return (
    <div style={{
      marginBottom: '1rem',
      padding: '1rem',
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '0.5rem'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#B19CD9' }}>Difficulty</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {availableDifficulties.map(difficulty => (
            <button
              key={difficulty}
              onClick={() => handleDifficultyChange(difficulty)}
              style={{
                padding: '0.5rem 1rem',
                background: selectedDifficulties.includes(difficulty) 
                  ? 'rgba(255, 215, 0, 0.2)' 
                  : 'rgba(255, 255, 255, 0.1)',
                border: selectedDifficulties.includes(difficulty)
                  ? '1px solid #FFD700'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.25rem',
                color: selectedDifficulties.includes(difficulty) ? '#FFD700' : '#EDEDED',
                cursor: 'pointer'
              }}
            >
              {difficulty}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#B19CD9' }}>Year</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => handleYearChange(year)}
              style={{
                padding: '0.5rem 1rem',
                background: selectedYears.includes(year) 
                  ? 'rgba(255, 215, 0, 0.2)' 
                  : 'rgba(255, 255, 255, 0.1)',
                border: selectedYears.includes(year)
                  ? '1px solid #FFD700'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.25rem',
                color: selectedYears.includes(year) ? '#FFD700' : '#EDEDED',
                cursor: 'pointer'
              }}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={clearFilters}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.25rem',
            color: '#B19CD9',
            cursor: 'pointer'
          }}
        >
          Clear Filters
        </button>
        
        <button
          onClick={applyFilters}
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(45deg, #B19CD9, #FFD700)',
            border: 'none',
            borderRadius: '0.25rem',
            color: '#2E1A47',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default TestFilters;
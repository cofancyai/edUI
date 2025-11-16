import React from 'react';
import { useMockTest } from '../../../hooks/useMockTest';
import TestSelection from './TestSelection';
import TestInterface from './TestInterface';
import ResultsView from './ResultsView';
import LoadingIndicator from '../shared/LoadingIndicator';
import ErrorMessage from '../shared/ErrorMessage';

interface MockTestProps {
  selectedLanguage: string;
  isAuthenticated?: boolean;
  testFilter?: string; // Add filter prop
}

const MockTest: React.FC<MockTestProps> = ({ selectedLanguage, testFilter = 'available' }) => {
  const userId = localStorage.getItem('studentPhone') || 'anonymous';
  
  const mockTest = useMockTest({ userId });
  
  const {
    isLoading,
    error,
    mode,
    testInProgress,
    resetToSelection
  } = mockTest;

  // Handle loading state
  if (isLoading && mode === 'selection') {
    return <LoadingIndicator message="Loading mock tests..." />;
  }

  // Handle error state
  if (error && mode === 'selection') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ErrorMessage 
          message={error} 
          onRetry={() => mockTest.refreshData()}
        />
      </div>
    );
  }

  // Render based on current mode
  const renderContent = () => {
    switch (mode) {
      case 'selection':
        return (
          <TestSelection 
            mockTest={mockTest} 
            testFilter={testFilter} // Pass filter to TestSelection
          />
        );
      
      case 'test':
        return (
          <TestInterface 
            mockTest={mockTest} 
            selectedLanguage={selectedLanguage}
          />
        );
      
      case 'results':
        return (
          <ResultsView 
            mockTest={mockTest}
            selectedLanguage={selectedLanguage}
          />
        );
      
      default:
        return (
          <TestSelection 
            mockTest={mockTest} 
            testFilter={testFilter} // Pass filter to TestSelection
          />
        );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F172A',
      color: '#F8FAFC',
      fontFamily: 'Inter, sans-serif'
    }}>
      {renderContent()}
    </div>
  );
};

export default MockTest;
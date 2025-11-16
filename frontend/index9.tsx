import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, Award } from 'lucide-react';
import { useExamBot } from '../../../hooks/useExamBot';
import SearchBar from './SearchBar';
import QuestionDisplay from './QuestionDisplay';
import TestResults from './TestResults';
import TestFilters from './TestFilters';
import LoadingIndicator from '../shared/LoadingIndicator';
import ErrorMessage from '../shared/ErrorMessage';

interface ExamBotProps {
  selectedLanguage: string;
  isAuthenticated?: boolean;
}

const ExamBot: React.FC<ExamBotProps> = ({ selectedLanguage }) => {
  const userId = localStorage.getItem('studentPhone') || 'anonymous';
  
  // Ensure setTestSession is returned from useExamBot hook
  // If you see a red mark here, check that useExamBot returns setTestSession
  const {
    isLoading,
    error,
    topicIndex,
    testMode,
    testSession,
    testResult,
    searchQuery,
    searchResults,
    recentSearches,
    activeFilters,
    availableYears,
    performSearch,
    setActiveFilters,
    startTest,
    endTest,
    moveToNextQuestion,
    moveToPreviousQuestion,
    jumpToQuestion,
    currentQuestion,
    submitAnswer,
    isAnswered,
    getUserAnswer,
    flagQuestion,
    unflagQuestion,
    isFlagged,
    goToTestMode,
    goToResults,
    goToSearch,
    goToReview,
    resetExamBot,
    setTestSession // Verify this is included in useExamBot return value
  } = useExamBot({ userId });
  
  const [displayedQuestions, setDisplayedQuestions] = useState<any[]>([]);
  const [questionView, setQuestionView] = useState<'list' | 'practice'>('list');
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [testFilters, setTestFilters] = useState<{ difficulty: string[], year: number[] }>({
    difficulty: [],
    year: []
  });
  
  useEffect(() => {
    if (searchResults.length > 0) {
      setDisplayedQuestions(searchResults.slice(0, 50));
    } else {
      setDisplayedQuestions([]);
    }
  }, [searchResults]);
  
  const applyTestFilters = (questions: any[], filters: { difficulty: string[], year: number[] }) => {
    return questions.filter(question => {
      const matchesDifficulty = filters.difficulty.length === 0 || 
        filters.difficulty.includes(question.difficulty);
      const matchesYear = filters.year.length === 0 || 
        filters.year.includes(question.year);
      return matchesDifficulty && matchesYear;
    });
  };

  const handleTestFilterApply = (filters: { difficulty: string[], year: number[] }) => {
    setTestFilters(filters);
    
    // If we have an active test session, apply filters to the current questions
    if (testSession && setTestSession) {
      const filteredQuestions = applyTestFilters(testSession.questions, filters);
      
      // Update the test session with filtered questions
      setTestSession((prev: any) => {
        if (!prev) return prev;
        
        return {
          ...prev,
          // Only update the questions if there are filtered results
          questions: filteredQuestions.length > 0 ? filteredQuestions : prev.questions,
          // Reset current question index if needed
          currentQuestionIndex: 0
        };
      });
    }
  };
  
  const handleQuestionSelect = (question: any) => {
    setSelectedQuestion(question);
    setQuestionView('practice');
  };
  
  const handleCreateTest = () => {
    if (searchResults.length === 0) {
      alert('Please search for questions first');
      return;
    }
    
    startTest();
  };
  
  const handleReset = () => {
    // Reset everything
    resetExamBot();
    setDisplayedQuestions([]);
    setQuestionView('list');
    setSelectedQuestion(null);
    setTestFilters({ difficulty: [], year: [] });
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator message="Loading questions..." />;
    }
    
    if (error) {
      return <ErrorMessage message={error} />;
    }
    
    switch (testMode) {
      case 'search':
        return renderSearchView();
        
      case 'in-progress':
        if (!testSession || !currentQuestion) {
          return <LoadingIndicator message="Preparing test..." />;
        }
        
        return (
          <>
            <TestFilters 
              questions={testSession.questions}
              onApplyFilters={handleTestFilterApply}
            />
            <QuestionDisplay
              question={currentQuestion}
              currentIndex={testSession.currentQuestionIndex}
              totalQuestions={testSession.questions.length}
              userAnswer={getUserAnswer(testSession.currentQuestionIndex)}
              timeRemaining={testSession.timeRemaining}
              onSubmitAnswer={submitAnswer}
              onNextQuestion={moveToNextQuestion}
              onPrevQuestion={moveToPreviousQuestion}
              onJumpToQuestion={jumpToQuestion}
              onEndTest={endTest}
              isAnswered={isAnswered}
              isFlagged={isFlagged}
              onFlagQuestion={flagQuestion}
              onUnflagQuestion={unflagQuestion}
            />
          </>
        );
        
      case 'results':
        if (!testResult) {
          return <LoadingIndicator message="Calculating results..." />;
        }
        
        return (
          <TestResults
            result={testResult}
            onReviewTest={goToReview}
            onNewTest={goToSearch}
            onHomePage={goToSearch}
          />
        );
        
      case 'review':
        if (!testSession || !currentQuestion) {
          return <LoadingIndicator message="Loading review..." />;
        }
        
        return (
          <QuestionDisplay
            question={currentQuestion}
            currentIndex={testSession.currentQuestionIndex}
            totalQuestions={testSession.questions.length}
            userAnswer={getUserAnswer(testSession.currentQuestionIndex)}
            onSubmitAnswer={() => {}}
            onNextQuestion={moveToNextQuestion}
            onPrevQuestion={moveToPreviousQuestion}
            onJumpToQuestion={jumpToQuestion}
            onEndTest={goToSearch}
            isAnswered={isAnswered}
            reviewMode={true}
          />
        );
        
      default:
        return <ErrorMessage message="Unknown mode" />;
    }
  };
  
  const renderSearchView = () => {
    if (questionView === 'practice' && selectedQuestion) {
      return (
        <div style={{ height: '100%' }}>
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => setQuestionView('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '0.25rem',
                padding: '0.5rem 1rem',
                color: '#EDEDED',
                cursor: 'pointer'
              }}
            >
              â† Back to Questions
            </button>
          </div>
          
          <div style={{ height: 'calc(100% - 3rem)' }}>
            <QuestionDisplay
              question={selectedQuestion}
              currentIndex={0}
              totalQuestions={1}
              onSubmitAnswer={() => {}}
              onNextQuestion={() => {}}
              onPrevQuestion={() => {}}
              onJumpToQuestion={() => {}}
              onEndTest={() => setQuestionView('list')}
              isAnswered={() => false}
              reviewMode={true}
            />
          </div>
        </div>
      );
    }
    
    return (
      <div>
        <SearchBar
          onSearch={performSearch}
          onFilterChange={setActiveFilters}
          topics={topicIndex?.topics || []}
          recentSearches={recentSearches}
          activeFilters={activeFilters}
          searchQuery={searchQuery}
          availableYears={availableYears}
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          marginBottom: '1rem'
        }}>
          <button
            onClick={handleReset}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#EDEDED',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            Reset Everything
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#FFD700' }}>
              {searchResults.length > 0 ? `${searchResults.length} questions found` : 'Search for questions above'}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleCreateTest}
              disabled={searchResults.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: searchResults.length === 0 ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(45deg, #B19CD9, #FFD700)',
                color: searchResults.length === 0 ? '#666' : '#2E1A47',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: searchResults.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              <Clock size={16} />
              <span>Test Mode</span>
            </button>
          </div>
        </div>
        
        {displayedQuestions.length > 0 ? (
          <div style={{
            background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ background: 'linear-gradient(45deg, #1a1a4e, #2E1A47)' }}>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      color: '#FFD700',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      Question
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'center', 
                      color: '#FFD700',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      width: '120px'
                    }}>
                      Difficulty
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'center', 
                      color: '#FFD700',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      width: '100px'
                    }}>
                      Year
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'center', 
                      color: '#FFD700',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      width: '120px'
                    }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedQuestions.map((question, index) => (
                    <tr 
                      key={`${question.id}-${index}`}
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      onClick={() => handleQuestionSelect(question)}
                    >
                      <td style={{ 
                        padding: '1rem', 
                        color: '#EDEDED',
                        fontSize: '0.9rem'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ fontWeight: '500' }}>
                            {question.question.length > 120 
                              ? question.question.substring(0, 120) + '...' 
                              : question.question}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#B19CD9' }}>
                            {question.topic} - {question.subtopic}
                          </div>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'center',
                        fontSize: '0.85rem'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          background: 
                            question.difficulty === 'Easy' ? 'rgba(39, 174, 96, 0.2)' :
                            question.difficulty === 'Medium' ? 'rgba(243, 156, 18, 0.2)' :
                            'rgba(231, 76, 60, 0.2)',
                          color:
                            question.difficulty === 'Easy' ? '#27ae60' :
                            question.difficulty === 'Medium' ? '#f39c12' :
                            '#e74c3c',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {question.difficulty}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'center',
                        color: '#FFD700',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}>
                        {question.year}
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'center'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuestionSelect(question);
                          }}
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '0.25rem',
                            color: '#EDEDED',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {searchResults.length > displayedQuestions.length && (
              <div style={{
                padding: '1rem',
                textAlign: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#B19CD9',
                fontSize: '0.9rem'
              }}>
                Showing {displayedQuestions.length} of {searchResults.length} questions.
                {' '}
                <button
                  onClick={() => setDisplayedQuestions(searchResults.slice(0, displayedQuestions.length + 50))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFD700',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '0.9rem'
                  }}
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        ) : searchQuery ? (
          <div style={{
            background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
            borderRadius: '0.75rem',
            padding: '2rem',
            textAlign: 'center',
            color: '#B19CD9'
          }}>
            <Search size={40} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
            <h3 style={{ color: '#EDEDED', marginBottom: '0.5rem' }}>No questions found</h3>
            <p>Try adjusting your search terms or filters</p>
          </div>
        ) : null}
      </div>
    );
  };
  
  return (
    <div style={{
      background: 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {testMode !== 'search' && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          padding: '0.75rem 1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(45deg, #B19CD9, #FFD700)',
              color: '#2E1A47'
            }}>
              {testMode === 'in-progress' && <Clock size={18} />}
              {testMode === 'results' && <Award size={18} />}
              {testMode === 'review' && <CheckCircle size={18} />}
            </div>
            <span style={{ color: '#EDEDED', fontWeight: '500' }}>
              {testMode === 'in-progress' && 'Test in Progress'}
              {testMode === 'results' && 'Test Results'}
              {testMode === 'review' && 'Review Mode'}
            </span>
          </div>
          
          <button
            onClick={goToSearch}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.25rem',
              color: '#B19CD9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <Search size={14} />
            <span>Return to Search</span>
          </button>
        </div>
      )}
      
      <div style={{ flex: 1 }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default ExamBot;
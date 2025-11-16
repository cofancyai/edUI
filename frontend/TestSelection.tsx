import React from 'react';
import { Clock, Play, RotateCcw, CheckCircle, Timer, FileText, BarChart3 } from 'lucide-react';

interface TestSelectionProps {
  mockTest: any; // Using any for now since it's from the hook
  testFilter?: string; // Add filter prop
}

const TestSelection: React.FC<TestSelectionProps> = ({ mockTest, testFilter = 'available' }) => {
  const {
    availableMockTests,
    testHistory,
    inProgressTests,
    startMockTest,
    resumeMockTest,
    isLoading
  } = mockTest;

  console.log('ðŸ” TESTSELECTION: Current filter:', testFilter);
  console.log('ðŸ” TESTSELECTION: inProgressTests:', inProgressTests);
  console.log('ðŸ” TESTSELECTION: Should show paused section:', testFilter === 'paused' && inProgressTests.length > 0);
  console.log('ðŸ” TESTSELECTION: availableMockTests:', availableMockTests);
  console.log('ðŸ” TESTSELECTION: testHistory:', testHistory);
  

  // Filter available tests to exclude completed and paused tests
  const getFilteredAvailableTests = () => {
    return availableMockTests.filter((test: any) => {
      // Check if test is completed
      // const isCompleted = testHistory.some((h: any) => h.mock_test_number === test.mock_test_number);
      const isCompleted = false;
      // Check if test is paused or in progress
      const isPausedOrInProgress = inProgressTests.some((p: any) => p.mock_test_number === test.mock_test_number);
      
      // Only show tests that are NOT completed AND NOT paused/in-progress
      return !isCompleted && !isPausedOrInProgress;
    });
  };
  console.log('ðŸ” TESTSELECTION: filteredAvailableTests:', getFilteredAvailableTests());

  const filteredAvailableTests = getFilteredAvailableTests();

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#F8FAFC',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #3B82F6, #14B8A6)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          UPSC Mock Tests
        </h1>
        <p style={{
          color: '#94A3B8',
          fontSize: '1.1rem'
        }}>
          Practice with real UPSC exam pattern and get detailed performance analysis
        </p>
      </div>

      {/* PAUSED TESTS SECTION - Only show if filter is 'paused' */}
      {testFilter === 'paused' && (
        <div>
          {inProgressTests.length > 0 ? (
            <div style={{
              backgroundColor: '#1E293B',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid rgba(249, 115, 22, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#F97316',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Timer size={24} />
                Paused Tests
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '1.5rem'
              }}>
                {inProgressTests.map((progress: any) => (
                  <div
                    key={`${progress.user_id}-${progress.mock_test_number}`}
                    style={{
                      backgroundColor: '#0F172A',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      border: '1px solid rgba(249, 115, 22, 0.4)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <h3 style={{
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        color: '#F8FAFC'
                      }}>
                        Mock Test {progress.mock_test_number}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: 'rgba(249, 115, 22, 0.2)',
                        color: '#F97316',
                        borderRadius: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        border: '1px solid rgba(249, 115, 22, 0.3)'
                      }}>
                        {progress.status === 'paused' ? 'Paused' : 'In Progress'}
                      </span>
                    </div>
                    
                    <div style={{
                      marginBottom: '1.5rem',
                      fontSize: '0.9rem',
                      color: '#94A3B8',
                      lineHeight: '1.5'
                    }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        Question: {progress.current_question + 1}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        Time remaining: {Math.floor(progress.time_remaining / 60)} minutes
                      </div>
                      <div>
                        Answered: {Object.keys(progress.answers || {}).length} questions
                      </div>
                    </div>
                    
                    <button
                      onClick={() => resumeMockTest(progress)}
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        backgroundColor: '#F97316',
                        color: '#F8FAFC',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: isLoading ? 0.7 : 1,
                        fontSize: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.backgroundColor = '#EA580C';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.backgroundColor = '#F97316';
                        }
                      }}
                    >
                      <RotateCcw size={18} />
                      Resume Test
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#1E293B',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              marginBottom: '2rem'
            }}>
              <Timer size={48} style={{ color: '#94A3B8', marginBottom: '1rem' }} />
              <h3 style={{ color: '#F8FAFC', marginBottom: '0.5rem', fontSize: '1.2rem' }}>No Paused Tests</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                You don't have any paused tests. Start a new test from the Available Tests tab.
              </p>
            </div>
          )}
        </div>
      )}

      {/* AVAILABLE TESTS SECTION - Only show if filter is 'available' */}
      {testFilter === 'available' && (
        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#3B82F6',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FileText size={24} />
            Available Mock Tests
          </h2>
          
          {filteredAvailableTests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#94A3B8'
            }}>
              <Clock size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {availableMockTests.length === 0 
                  ? 'No mock tests available at the moment.' 
                  : 'All tests are either completed or in progress.'
                }
              </p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {availableMockTests.length === 0 
                  ? 'Please check back later or contact your administrator.'
                  : 'Check the Paused or Completed tabs to see your test history.'
                }
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredAvailableTests.map((test: any) => (
                <div
                  key={test.mock_test_number}
                  style={{
                    backgroundColor: '#0F172A',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      color: '#F8FAFC'
                    }}>
                      Mock Test {test.mock_test_number}
                    </h3>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: '#3B82F6',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      Fresh
                    </span>
                  </div>
                  
                  <div style={{
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem',
                    color: '#94A3B8',
                    lineHeight: '1.5'
                  }}>
                    <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                      <Clock size={14} style={{ marginRight: '0.5rem' }} />
                      {test.time_limit_minutes} minutes
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      Questions: {test.total_questions}
                    </div>
                    <div style={{ color: '#3B82F6', fontWeight: '500' }}>
                      Ready to start
                    </div>
                  </div>
                  
                  <button
                    onClick={() => startMockTest(test.mock_test_number)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      backgroundColor: '#3B82F6',
                      color: '#F8FAFC',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: isLoading ? 0.7 : 1,
                      fontSize: '1rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = '#2563EB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = '#3B82F6';
                      }
                    }}
                  >
                    <Play size={18} />
                    Start Test
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPLETED TESTS SECTION - Only show if filter is 'completed' */}
      {testFilter === 'completed' && (
        <div>
          {testHistory.length > 0 ? (
            <div style={{
              backgroundColor: '#1E293B',
              borderRadius: '1rem',
              padding: '2rem',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#10B981',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <BarChart3 size={24} />
                Completed Test Results
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {testHistory.map((attempt: any) => (
                  <div
                    key={attempt.id}
                    style={{
                      backgroundColor: '#0F172A',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#F8FAFC'
                      }}>
                        Mock Test {attempt.mock_test_number}
                      </span>
                      <span style={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#10B981'
                      }}>
                        {attempt.score_percentage}%
                      </span>
                    </div>
                    
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#94A3B8',
                      lineHeight: '1.5',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        Score: {attempt.correct_answers}/{attempt.total_questions}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        Completed: {new Date(attempt.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        Time: {Math.floor((attempt.time_taken || 0) / 60)}m {(attempt.time_taken || 0) % 60}s
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => startMockTest(attempt.mock_test_number)}
                        disabled={isLoading}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: '#3B82F6',
                          color: '#F8FAFC',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          opacity: isLoading ? 0.7 : 1,
                          fontSize: '0.9rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isLoading) {
                            e.currentTarget.style.backgroundColor = '#2563EB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLoading) {
                            e.currentTarget.style.backgroundColor = '#3B82F6';
                          }
                        }}
                      >
                        <RotateCcw size={16} />
                        Retake
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#1E293B',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle size={48} style={{ color: '#94A3B8', marginBottom: '1rem' }} />
              <h3 style={{ color: '#F8FAFC', marginBottom: '0.5rem', fontSize: '1.2rem' }}>No Completed Tests</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                You haven't completed any tests yet. Start your first test from the Available Tests tab.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestSelection;
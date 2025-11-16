import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, Clock, Brain } from 'lucide-react';
import { supabase } from '../../../utils/supabaseClient';
import { AptitudeQuestion } from '../../../types/aptitude.types';

interface QuestionDisplayProps {
  question: AptitudeQuestion;
  userAnswer: string | null;
  onAnswer: (answer: string) => void;
  showFeedback?: boolean;
  selectedLanguage: string;
  timeLeft?: number;
  showHint?: boolean;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  userAnswer,
  onAnswer,
  showFeedback = false,
  selectedLanguage,
  timeLeft,
  showHint = true
}) => {
  const [hintVisible, setHintVisible] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  // Get AI-generated hint
  const generateAIHint = async () => {
    if (aiHint) {
      setHintVisible(!hintVisible);
      return;
    }

    setIsLoadingHint(true);
    setHintError(null);

    try {
      // Get OpenRouter API key from Supabase
      console.log('Fetching API key from Supabase...');

const { data, error } = await supabase
  .from('credentials')
  .select('config')
  .eq('name', 'VITE_OPENROUTER_API_KEY')
  .eq('is_active', true)
  .single();

console.log('Supabase response:', { data, error });

if (error) {
  console.error('Supabase error:', error);
  throw new Error('API key not found');
}

if (!data || !data.config || !data.config.key) {
  console.error('Invalid credential data:', data);
  throw new Error('Invalid API key configuration');
}

const apiKey = data.config.key;
console.log('API key retrieved:', apiKey ? 'Found' : 'Not found');
console.log('API key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');

      const prompt = `Generate a helpful hint for this aptitude question without giving away the answer:

Question: ${question.question_text}
Topic: ${question.category}
Subtopic: ${question.subcategory}
Difficulty: ${question.difficulty}

Provide a hint that guides thinking without revealing the solution. Keep it under 50 words.`;



console.log('Making API request with key:', apiKey.substring(0, 10) + '...');

const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Aptitude Hint Generator'
  },
  body: JSON.stringify({
    model: "anthropic/claude-3.5-haiku",
    messages: [
      {
        role: "user", 
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 100
  })
});

console.log('Response status:', response.status);

if (!response.ok) {
  const errorText = await response.text();
  console.error('API Error Response:', errorText);
  throw new Error(`API Error: ${response.status} - ${errorText}`);
}

      const data_response = await response.json();
      const hintText = data_response.choices?.[0]?.message?.content;

      if (!hintText) {
        throw new Error('No hint generated');
      }

      setAiHint(hintText);
      setHintVisible(true);

    } catch (error) {
      console.error('Error generating hint:', error);
      setHintError('Failed to generate hint. Try again later.');
      // Fallback to database hint if available
      if (question.hint) {
        setAiHint(question.hint);
        setHintVisible(true);
      }
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = () => {
    switch (question.difficulty?.toLowerCase()) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      case 'very_hard': return '#7C2D12';
      default: return '#6B7280';
    }
  };

  // Check if answer is correct
  const isCorrect = userAnswer === question.correct_answer;
  const hasAnswered = userAnswer !== null && userAnswer !== undefined;

  return (
    <div style={{
      backgroundColor: '#1E293B',
      borderRadius: '0.75rem',
      padding: '2rem',
      border: '1px solid #374151'
    }}>
      {/* Question Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {/* Difficulty Badge */}
          <div style={{
            padding: '0.4rem 0.8rem',
            backgroundColor: getDifficultyColor() + '20',
            border: `1px solid ${getDifficultyColor()}40`,
            borderRadius: '0.35rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: getDifficultyColor()
          }}>
            {question.difficulty?.replace('_', ' ').toUpperCase()}
          </div>

          {/* Category Info */}
          <div style={{
            fontSize: '0.85rem',
            color: '#94A3B8'
          }}>
            {question.category} â€¢ {question.subcategory}
          </div>
        </div>

        {/* Time Left */}
        {timeLeft !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: timeLeft < 60 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${timeLeft < 60 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
            borderRadius: '0.5rem'
          }}>
            <Clock size={14} color={timeLeft < 60 ? '#EF4444' : '#3B82F6'} />
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: timeLeft < 60 ? '#EF4444' : '#3B82F6'
            }}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Question Text */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <p style={{
          fontSize: '1.1rem',
          lineHeight: 1.6,
          color: '#F8FAFC',
          margin: 0,
          fontWeight: 500
        }}>
          {question.question_text}
        </p>

        {/* Question Image */}
        {question.image_url && (
          <div style={{
            marginTop: '1rem',
            textAlign: 'center'
          }}>
            <img
              src={question.image_url}
              alt="Question illustration"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '0.5rem',
                border: '1px solid #374151'
              }}
            />
          </div>
        )}
      </div>

      {/* Answer Options */}
      <div style={{
        marginBottom: '2rem'
      }}>
        {question.question_type === 'multiple_choice' && question.options && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {question.options.map((option) => {
              const isSelected = userAnswer === option.id;
              const isCorrectOption = option.id === question.correct_answer;
              
              let backgroundColor = '#0F172A';
              let borderColor = '#374151';
              let textColor = '#F8FAFC';

              if (hasAnswered && showFeedback) {
                if (isCorrectOption) {
                  backgroundColor = 'rgba(16, 185, 129, 0.1)';
                  borderColor = '#10B981';
                  textColor = '#10B981';
                } else if (isSelected && !isCorrectOption) {
                  backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  borderColor = '#EF4444';
                  textColor = '#EF4444';
                }
              } else if (isSelected) {
                backgroundColor = 'rgba(59, 130, 246, 0.1)';
                borderColor = '#3B82F6';
                textColor = '#3B82F6';
              }

              return (
                <button
                  key={option.id}
                  onClick={() => !hasAnswered && onAnswer(option.id)}
                  disabled={hasAnswered}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    backgroundColor,
                    border: `2px solid ${borderColor}`,
                    borderRadius: '0.5rem',
                    cursor: hasAnswered ? 'default' : 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!hasAnswered && !isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                      e.currentTarget.style.borderColor = '#3B82F6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!hasAnswered && !isSelected) {
                      e.currentTarget.style.backgroundColor = '#0F172A';
                      e.currentTarget.style.borderColor = '#374151';
                    }
                  }}
                >
                  {/* Option ID */}
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    backgroundColor: textColor + '20',
                    border: `1px solid ${textColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: textColor
                  }}>
                    {option.id}
                  </div>

                  {/* Option Text */}
                  <span style={{
                    fontSize: '1rem',
                    color: textColor,
                    flex: 1
                  }}>
                    {option.text}
                  </span>

                  {/* Status Icon */}
                  {hasAnswered && showFeedback && (
                    <div>
                      {isCorrectOption ? (
                        <CheckCircle size={20} color="#10B981" />
                      ) : isSelected ? (
                        <XCircle size={20} color="#EF4444" />
                      ) : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Numerical Input */}
        {question.question_type === 'numerical_input' && (
          <div>
            <input
              type="number"
              value={userAnswer || ''}
              onChange={(e) => !hasAnswered && onAnswer(e.target.value)}
              disabled={hasAnswered}
              placeholder="Enter your answer"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                backgroundColor: '#0F172A',
                border: `2px solid ${hasAnswered && showFeedback ? 
                  (isCorrect ? '#10B981' : '#EF4444') : '#374151'}`,
                borderRadius: '0.5rem',
                color: '#F8FAFC',
                outline: 'none'
              }}
            />
          </div>
        )}

        {/* True/False */}
        {question.question_type === 'true_false' && (
          <div style={{
            display: 'flex',
            gap: '1rem'
          }}>
            {['True', 'False'].map((option) => {
              const isSelected = userAnswer === option;
              const isCorrectOption = option === question.correct_answer;
              
              let backgroundColor = '#0F172A';
              let borderColor = '#374151';
              let textColor = '#F8FAFC';

              if (hasAnswered && showFeedback) {
                if (isCorrectOption) {
                  backgroundColor = 'rgba(16, 185, 129, 0.1)';
                  borderColor = '#10B981';
                  textColor = '#10B981';
                } else if (isSelected && !isCorrectOption) {
                  backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  borderColor = '#EF4444';
                  textColor = '#EF4444';
                }
              } else if (isSelected) {
                backgroundColor = 'rgba(59, 130, 246, 0.1)';
                borderColor = '#3B82F6';
                textColor = '#3B82F6';
              }

              return (
                <button
                  key={option}
                  onClick={() => !hasAnswered && onAnswer(option)}
                  disabled={hasAnswered}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    backgroundColor,
                    border: `2px solid ${borderColor}`,
                    borderRadius: '0.5rem',
                    color: textColor,
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: hasAnswered ? 'default' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hint Section */}
      {showHint && (
        <div style={{
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={generateAIHint}
            disabled={isLoadingHint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              color: '#F59E0B',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '0.5rem',
              cursor: isLoadingHint ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isLoadingHint) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoadingHint) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
              }
            }}
          >
            {isLoadingHint ? (
              <>
                <Brain size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Generating hint...
              </>
            ) : (
              <>
                <HelpCircle size={16} />
                {aiHint ? (hintVisible ? 'Hide Hint' : 'Show Hint') : 'Get AI Hint'}
              </>
            )}
          </button>

          {/* Hint Display */}
          {hintVisible && aiHint && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '0.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <Brain size={16} color="#F59E0B" />
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#F59E0B'
                }}>
                  AI Hint:
                </span>
              </div>
              <p style={{
                color: '#F8FAFC',
                fontSize: '0.9rem',
                lineHeight: 1.4,
                margin: 0
              }}>
                {aiHint}
              </p>
            </div>
          )}

          {/* Hint Error */}
          {hintError && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              color: '#EF4444',
              fontSize: '0.85rem'
            }}>
              {hintError}
            </div>
          )}
        </div>
      )}

      {/* Feedback Section */}
      {hasAnswered && showFeedback && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {isCorrect ? (
              <CheckCircle size={20} color="#10B981" />
            ) : (
              <XCircle size={20} color="#EF4444" />
            )}
            <span style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: isCorrect ? '#10B981' : '#EF4444'
            }}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
          </div>

          {!isCorrect && (
            <div style={{
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: '#F8FAFC'
            }}>
              The correct answer is: <strong style={{ color: '#10B981' }}>{question.correct_answer}</strong>
            </div>
          )}

          {question.explanation && (
            <div>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#3B82F6',
                marginBottom: '0.5rem'
              }}>
                Explanation:
              </div>
              <p style={{
                color: '#F8FAFC',
                fontSize: '0.9rem',
                lineHeight: 1.4,
                margin: 0
              }}>
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;
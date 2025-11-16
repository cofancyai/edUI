import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Search, MapPin, User, DollarSign, Briefcase, Heart, Home, GraduationCap, Shield, ArrowRight, CheckCircle, AlertCircle, Clock, Star, Volume2, VolumeX, RefreshCw, Sparkles } from 'lucide-react';

interface SchemesProps {
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

interface UserProfile {
  demographics: {
    age?: number;
    gender?: string;
    social_category?: string;
    annual_income?: number;
    location?: string;
  };
  intent: {
    primary_goal?: string;
    specific_needs?: string[];
  };
  missing_info: string[];
}

interface Scheme {
  id: number;
  name: string;
  ministry: string;
  category: string;
  relevance_score: number;
  loan_amount?: { min: number; max: number };
  benefits: string[];
  eligibility: string;
  application_url: string;
  match_reasons: string[];
  why_relevant: string;
}

interface SchemesResponse {
  status: string;
  user_profile: UserProfile;
  total_schemes_found: number;
  schemes: Scheme[];
  missing_info: string[];
  processing_time: string;
}

const Schemes: React.FC<SchemesProps> = ({ selectedLanguage = 'english', isAuthenticated = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<SchemesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<any>(null);

  // Example prompts to guide users
  const examplePrompts = [
    "I'm a 25-year-old woman, SC category, annual income 2 lakhs, want to start a business",
    "I'm a farmer with 5 acres, need help with irrigation and crop insurance",
    "I'm a student from OBC category, need education loan for engineering",
    "I'm 60 years old, need pension and healthcare schemes",
    "I'm unemployed, need job training and skill development programs"
  ];

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = selectedLanguage === 'hindi' ? 'hi-IN' : 'en-IN';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [selectedLanguage]);

  // Start voice recognition
  const startListening = () => {
    if (recognitionRef.current) {
      setUserInput('');
      recognitionRef.current.start();
    } else {
      setError('Speech recognition not supported in this browser');
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Text-to-speech for scheme results
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage === 'hindi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      speechSynthesisRef.current = utterance;
    }
  };

  // Stop text-to-speech
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Process user requirements and find schemes
  const handleFindSchemes = async () => {
    if (!userInput.trim()) {
      setError('Please enter your requirements');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      setProcessingStep('Understanding your requirements...');

      const response = await fetch('https://prepnx-backend.vercel.app/api/schemes/find-schemes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userInput,
          language: selectedLanguage
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      setProcessingStep('Finding relevant schemes...');
      const data: SchemesResponse = await response.json();

      if (data.status === 'success') {
        setResults(data);

        const announcement = `Found ${data.total_schemes_found} relevant schemes for you. Top match is ${data.schemes[0]?.name || 'not available'}.`;
        if (selectedLanguage !== 'english') {
          speakText(announcement);
        }
      } else {
        throw new Error('Failed to process request');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error finding schemes:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Format currency amounts
  const formatAmount = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  // Get relevance color based on score
  const getRelevanceColor = (score: number): string => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    if (score >= 50) return '#3B82F6';
    return '#6B7280';
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      minHeight: '600px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <Sparkles size={32} style={{ color: '#FFD700' }} />
        <div>
          <h2 style={{
            color: '#FFD700',
            fontSize: '1.8rem',
            fontWeight: '700',
            margin: 0
          }}>
            Government Schemes Finder
          </h2>
          <p style={{
            color: '#B19CD9',
            fontSize: '1rem',
            margin: 0
          }}>
            AI-powered scheme discovery with voice & text search
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.1)'
      }}>
        {/* Voice/Text Input */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            style={{
              padding: '1rem',
              background: isListening
                ? 'linear-gradient(45deg, #EF4444, #DC2626)'
                : 'linear-gradient(45deg, #10B981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600',
              minWidth: '120px',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: isListening
                ? '0 4px 16px rgba(239, 68, 68, 0.4)'
                : '0 4px 16px rgba(16, 185, 129, 0.3)'
            }}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            {isListening ? 'Stop' : 'Speak'}
          </button>

          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Describe your requirements... (e.g., I'm a 25-year-old woman, SC category, income 2 lakhs, want to start a business)"
              disabled={isProcessing || isListening}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '1rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.75rem',
                color: '#EDEDED',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            {isListening && (
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  borderTop: '2px solid #EF4444',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span style={{
                  color: '#EF4444',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Listening...
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleFindSchemes}
            disabled={isProcessing || !userInput.trim()}
            style={{
              padding: '1rem 2rem',
              background: userInput.trim() && !isProcessing
                ? 'linear-gradient(45deg, #FFD700, #B19CD9)'
                : 'rgba(255, 255, 255, 0.1)',
              color: userInput.trim() && !isProcessing ? '#2E1A47' : '#B19CD9',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: (isProcessing || !userInput.trim()) ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: '160px',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: userInput.trim() && !isProcessing
                ? '0 4px 16px rgba(255, 215, 0, 0.3)'
                : 'none'
            }}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Processing...
              </>
            ) : (
              <>
                <Search size={20} />
                Find Schemes
              </>
            )}
          </button>
        </div>

        {/* Example Prompts */}
        <div>
          <p style={{ color: '#B19CD9', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Try these examples:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {examplePrompts.slice(0, 3).map((prompt, index) => (
              <button
                key={index}
                onClick={() => setUserInput(prompt)}
                disabled={isProcessing}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(177, 156, 217, 0.1)',
                  color: '#B19CD9',
                  border: '1px solid rgba(177, 156, 217, 0.3)',
                  borderRadius: '1rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.background = 'rgba(177, 156, 217, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(177, 156, 217, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(177, 156, 217, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(177, 156, 217, 0.3)';
                }}
              >
                {prompt.length > 60 ? `${prompt.substring(0, 60)}...` : prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <RefreshCw size={24} style={{
              color: '#3B82F6',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ color: '#3B82F6', fontSize: '1.1rem', fontWeight: '600' }}>
              {processingStep}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #3B82F6, #10B981)',
              animation: 'loading 1.5s ease-in-out infinite'
            }} />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} style={{ color: '#EF4444' }} />
          <span style={{ color: '#EF4444', fontSize: '1rem', flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#EF4444',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 215, 0, 0.1)',
          padding: '2rem'
        }}>
          {/* Results Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 215, 0, 0.1)'
          }}>
            <div>
              <h2 style={{
                color: '#FFD700',
                fontSize: '1.6rem',
                fontWeight: '700',
                margin: '0 0 0.5rem 0'
              }}>
                🎯 Found {results.total_schemes_found} Relevant Schemes
              </h2>
              <p style={{ color: '#B19CD9', margin: 0, fontSize: '0.95rem' }}>
                Processed in {results.processing_time} • Relevance scored and ranked
              </p>
            </div>

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600'
                }}
              >
                <VolumeX size={16} />
                Stop Audio
              </button>
            )}
          </div>

          {/* User Profile Summary */}
          {results.user_profile && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <h3 style={{
                color: '#3B82F6',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.2rem'
              }}>
                <User size={20} />
                Your Profile
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {results.user_profile.demographics?.age && (
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ color: '#B19CD9', fontSize: '0.85rem' }}>Age: </span>
                    <span style={{ color: '#EDEDED', fontWeight: '600' }}>
                      {results.user_profile.demographics.age} years
                    </span>
                  </div>
                )}
                {results.user_profile.demographics?.gender && (
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ color: '#B19CD9', fontSize: '0.85rem' }}>Gender: </span>
                    <span style={{ color: '#EDEDED', fontWeight: '600' }}>
                      {results.user_profile.demographics.gender}
                    </span>
                  </div>
                )}
                {results.user_profile.demographics?.social_category && (
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ color: '#B19CD9', fontSize: '0.85rem' }}>Category: </span>
                    <span style={{ color: '#EDEDED', fontWeight: '600' }}>
                      {results.user_profile.demographics.social_category}
                    </span>
                  </div>
                )}
                {results.user_profile.demographics?.annual_income && (
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ color: '#B19CD9', fontSize: '0.85rem' }}>Income: </span>
                    <span style={{ color: '#EDEDED', fontWeight: '600' }}>
                      {formatAmount(results.user_profile.demographics.annual_income)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schemes List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {results.schemes.map((scheme, index) => (
              <div
                key={scheme.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 215, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Relevance Badge */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: getRelevanceColor(scheme.relevance_score),
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  boxShadow: `0 4px 12px ${getRelevanceColor(scheme.relevance_score)}40`
                }}>
                  <Star size={14} fill="currentColor" />
                  {scheme.relevance_score}% Match
                </div>

                {/* Scheme Header */}
                <div style={{ marginBottom: '1rem', paddingRight: '140px' }}>
                  <h3 style={{
                    color: '#FFD700',
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    margin: '0 0 0.5rem 0',
                    lineHeight: '1.4'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📋'} {scheme.name}
                  </h3>
                  <p style={{
                    color: '#B19CD9',
                    fontSize: '0.9rem',
                    margin: '0 0 0.75rem 0'
                  }}>
                    {scheme.ministry} • {scheme.category}
                  </p>
                  <p style={{
                    color: '#10B981',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    💡 {scheme.why_relevant}
                  </p>
                </div>

                {/* Scheme Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '1rem',
                  borderRadius: '0.5rem'
                }}>
                  {scheme.loan_amount && (
                    <div>
                      <span style={{ color: '#B19CD9', fontSize: '0.9rem' }}>💰 Loan Amount: </span>
                      <span style={{ color: '#FFD700', fontWeight: '700' }}>
                        {formatAmount(scheme.loan_amount.min)} - {formatAmount(scheme.loan_amount.max)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span style={{ color: '#B19CD9', fontSize: '0.9rem' }}>✅ Eligibility: </span>
                    <span style={{ color: '#EDEDED', fontWeight: '500' }}>{scheme.eligibility}</span>
                  </div>
                </div>

                {/* Benefits */}
                {scheme.benefits && scheme.benefits.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{
                      color: '#3B82F6',
                      fontWeight: '700',
                      margin: '0 0 0.75rem 0',
                      fontSize: '1rem'
                    }}>
                      🎁 Key Benefits:
                    </p>
                    <div style={{
                      display: 'grid',
                      gap: '0.5rem'
                    }}>
                      {scheme.benefits.map((benefit, idx) => (
                        <div
                          key={idx}
                          style={{
                            color: '#EDEDED',
                            paddingLeft: '1.5rem',
                            position: 'relative',
                            lineHeight: '1.6'
                          }}
                        >
                          <span style={{
                            position: 'absolute',
                            left: '0',
                            color: '#F59E0B',
                            fontWeight: 'bold'
                          }}>•</span>
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => window.open(scheme.application_url, '_blank')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
                      color: '#2E1A47',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.3)';
                    }}
                  >
                    Apply Now <ArrowRight size={16} />
                  </button>

                  <button
                    onClick={() => speakText(`${scheme.name}. ${scheme.why_relevant}. Key benefits include: ${scheme.benefits.join(', ')}`)}
                    disabled={isSpeaking}
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '0.5rem',
                      cursor: isSpeaking ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Missing Info Notice */}
          {results.missing_info && results.missing_info.length > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginTop: '2rem',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <h3 style={{
                color: '#F59E0B',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                💡 Get More Personalized Results
              </h3>
              <p style={{ color: '#EDEDED', marginBottom: '1rem' }}>
                Providing additional information could help us find more relevant schemes:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {results.missing_info.map((info, index) => (
                  <span
                    key={index}
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#F59E0B',
                      padding: '0.5rem 1rem',
                      borderRadius: '1rem',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    {info}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!userInput && !results && !isProcessing && !error && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#B19CD9'
        }}>
          <Sparkles size={80} style={{ marginBottom: '2rem', opacity: 0.5, color: '#FFD700' }} />
          <h3 style={{
            color: '#FFD700',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            fontWeight: '700'
          }}>
            Discover Your Perfect Schemes
          </h3>
          <p style={{
            fontSize: '1.1rem',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto',
            opacity: 0.9
          }}>
            Use voice or text to describe your requirements, and our AI will instantly match you with the most relevant government schemes tailored for you.
          </p>
        </div>
      )}

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes loading {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
};

export default Schemes;

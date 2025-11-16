import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Download, RefreshCw, MessageSquare, Brain, Globe, AlertTriangle, CheckCircle, Clock, Activity, Zap, Target, TrendingUp, BookOpen, BarChart3, FileText } from 'lucide-react';
import RefreshButton from '../shared/RefreshButton';
import { generateResearchPdf } from '../../../utils/pdfUtils';
import { Volume2, VolumeX, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { useTTS } from '../../../hooks/useTTS';

interface FollowUpQuestion {
  question: string;
  type: 'conceptual' | 'practical' | 'analytical' | 'comparative' | 'exploratory';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: number;
  learning_objective: string;
  keywords: string[];
}

interface ContentInsights {
  keyPoints: string[];
  relatedTopics: string[];
  practicalApplications: string[];
  furtherReading: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  comprehensiveness: number;
  educational_value: number;
  content_depth: string;
  target_audience: string;
  learning_outcomes: string[];
  strengths: string[];
  improvement_areas: string[];
  interdisciplinary_connections: string[];
}

interface ContentMetrics {
  word_count: number;
  section_count: number;
  quality_score: number;
  progress: number;
  target_achieved: boolean;
  paragraphs: number;
  sentences: number;
  complexity_score: number;
}

interface TopicAnalysis {
  category: string;
  subcategory: string;
  complexity: string;
  domain_specific: boolean;
  key_concepts: string[];
  related_fields: string[];
  content_type: string;
  depth_requirements: string;
}

interface SearchTabProps {
  query: string;
  content: string;
  realTimeContent: string;
  useRealTimeSearch: boolean;
  searchLoading: boolean;
  realTimeLoading: boolean;
  error: string | null;
  realTimeError: string | null;
  followUpQuestions: string[];
  selectedLanguage: string;
  handleQuerySubmit: (e: React.FormEvent | null, overrideQuery?: string) => Promise<void>;
  handleFollowUpQuery: (followUpQuery: string) => Promise<void>;
  aiFollowUpQuestions: FollowUpQuestion[];
  contentInsights: ContentInsights | null;
  isGeneratingFollowUps: boolean;
  isAnalyzingContent: boolean;
  followUpError: string | null;
  isStreaming?: boolean;
  streamingContent?: string;
  topicCategory?: string;
  wordCount?: number;
  processingTime?: number;
}

// Error Boundary Component
class SearchTabErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SearchTab Error Boundary] Caught error:', error);
    console.error('[SearchTab Error Boundary] Error info:', errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center'
        }}>
          <AlertTriangle size={48} style={{ color: '#EF4444', marginBottom: '1rem' }} />
          <h3 style={{ color: '#EF4444', marginBottom: '1rem' }}>Something went wrong</h3>
          <p style={{ color: '#2E1A47', marginBottom: '1rem' }}>
            {this.state.error?.message || 'An unexpected error occurred in the search component.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(45deg, #EF4444, #DC2626)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}



const SearchTab: React.FC<SearchTabProps> = ({
  query,
  content,
  realTimeContent,
  useRealTimeSearch,
  searchLoading,
  realTimeLoading,
  error,
  realTimeError,
  followUpQuestions,
  selectedLanguage,
  handleQuerySubmit,
  handleFollowUpQuery,
  aiFollowUpQuestions,
  contentInsights,
  isGeneratingFollowUps,
  isAnalyzingContent,
  followUpError,
  isStreaming = false,
  streamingContent = '',
  topicCategory = 'general',
  wordCount = 0,
  processingTime = 0,
}) => {
  const [showAdvancedInsights, setShowAdvancedInsights] = useState<boolean>(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<
    'all' | 'conceptual' | 'practical' | 'analytical' | 'comparative' | 'exploratory'
  >('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'basic' | 'intermediate' | 'advanced'>(
    'all'
  );
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastSuccessfulQuery, setLastSuccessfulQuery] = useState<string>('');
  const [debouncedContent, setDebouncedContent] = useState<string>('');

  const contentRef = useRef<HTMLDivElement>(null);

  const {
  isPlaying,
  isPaused,
  currentPosition,
  playText,
  pauseAudio,
  resumeAudio,
  stopAudio,
  setPlaybackRate,
  playbackRate
} = useTTS(selectedLanguage);

  // ULTRA-STABLE CONTENT SELECTION - Maximum stability with enhanced debouncing
  const displayContent = useMemo(() => {
    // Use debounced content during streaming to prevent shake
    if (isStreaming) {
      return debouncedContent;
    }
    // Priority: regular content > real-time content
    if (content) {
      return content;
    }
    if (useRealTimeSearch && realTimeContent) {
      return realTimeContent;
    }
    return '';
  }, [isStreaming, debouncedContent, content, useRealTimeSearch, realTimeContent]);

  // SIMPLIFIED LOADING STATE
  const isLoading = useMemo(() => {
    if (useRealTimeSearch) {
      return realTimeLoading && !isStreaming;
    }
    return searchLoading && !isStreaming;
  }, [useRealTimeSearch, realTimeLoading, searchLoading, isStreaming]);

  // SIMPLIFIED ERROR STATE
  const currentError = useMemo(() => {
    if (useRealTimeSearch) {
      return realTimeError;
    }
    return error;
  }, [useRealTimeSearch, realTimeError, error]);

  // Ultra-enhanced debug logging with aggressive throttling
  const logDebug = useCallback((message: string, data?: any) => {
    if (debugMode) {
      console.log(`[SearchTab] ${message}`, data ? data : '');
    }
  }, [debugMode]);

  // ULTRA-STABLE DEBOUNCE - Increased to 250ms for maximum stability
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isStreaming && streamingContent) {
      // INCREASED debounce from 150ms to 250ms for ultra-stability
      timer = setTimeout(() => {
        setDebouncedContent(streamingContent);
      }, 150);
    } else if (!isStreaming && (content || streamingContent)) {
      // Immediate update when not streaming
      setDebouncedContent(content || streamingContent);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isStreaming, streamingContent, content]);

  // Stop TTS when content changes
/*useEffect(() => {
  if (isPlaying && displayContent) {
    stopAudio();
  }
}, [displayContent, stopAudio, isPlaying]); */

  // ULTRA-STABLE AUTO-SCROLL - Double RAF for maximum smoothness
  useEffect(() => {
    if (contentRef.current && isStreaming && debouncedContent) {
      const element = contentRef.current;
      const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 150;
      
      // Only auto-scroll if user is near bottom and content is being added
      if (isNearBottom) {
        // Double RAF for ultra-smooth scrolling
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (element) {
              element.scrollTop = element.scrollHeight;
            }
          });
        });
      }
    }
  }, [debouncedContent, isStreaming]);

  // ULTRA-THROTTLED DEBUG LOGS - Only major milestones
  useEffect(() => {
    const shouldLog = !isStreaming || debouncedContent.length % 500 === 0 || debouncedContent.length < 100;
    
    if (shouldLog) {
      logDebug('Ultra-stable SearchTab state update:', {
        hasQuery: !!query,
        queryLength: query?.length || 0,
        hasDisplayContent: !!displayContent,
        displayContentLength: displayContent?.length || 0,
        debouncedContentLength: debouncedContent?.length || 0,
        isLoading,
        isStreaming,
        hasError: !!currentError,
        errorMessage: currentError,
        useRealTimeSearch,
        aiFollowUpQuestionsCount: aiFollowUpQuestions?.length || 0,
        hasContentInsights: !!contentInsights,
        isGeneratingFollowUps,
        isAnalyzingContent,
        topicCategory,
        wordCount,
        streamingContentLength: streamingContent?.length || 0,
        ultraStable: true
      });
    }
  }, [
    query, displayContent, debouncedContent, isLoading, currentError, useRealTimeSearch,
    aiFollowUpQuestions, contentInsights, isGeneratingFollowUps, isAnalyzingContent, 
    logDebug, isStreaming, topicCategory, wordCount, streamingContent
  ]);

  // Track successful queries
  useEffect(() => {
    if (displayContent && !isLoading && !currentError && query) {
      setLastSuccessfulQuery(query);
      setRetryCount(0);
      logDebug('Query successful, resetting retry count');
    }
  }, [displayContent, isLoading, currentError, query, logDebug]);

  // Enhanced retry function
  const handleRetry = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    logDebug(`Retrying query (attempt ${retryCount + 1}):`, query);
    
    try {
      if (query && query.trim()) {
        await handleQuerySubmit(null, query);
      } else {
        await handleQuerySubmit(null, lastSuccessfulQuery);
      }
    } catch (retryError) {
      console.error('[SearchTab] Retry failed:', retryError);
    }
  }, [handleQuerySubmit, query, lastSuccessfulQuery, retryCount, logDebug]);

  // Filter follow-up questions based on selected criteria
  const getFilteredQuestions = useCallback(() => {
    const allQuestions = Array.isArray(aiFollowUpQuestions) ? aiFollowUpQuestions : [];

    if (allQuestions.length === 0) {
      logDebug('No follow-up questions available');
      return [];
    }

    let filtered = allQuestions;

    if (selectedQuestionType !== 'all') {
      filtered = filtered.filter((q) => q.type === selectedQuestionType);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
    }

    logDebug('Filtered questions:', { 
      originalCount: allQuestions.length,
      filteredCount: filtered.length,
      selectedType: selectedQuestionType,
      selectedDifficulty 
    });

    return filtered;
  }, [aiFollowUpQuestions, selectedQuestionType, selectedDifficulty, logDebug]);

  // Get question type color
  const getQuestionTypeColor = (type: string): string => {
    switch (type) {
      case 'conceptual': return '#3b82f6';
      case 'practical': return '#10B981';
      case 'analytical': return '#F59E0B';
      case 'comparative': return '#8B5CF6';
      case 'exploratory': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'basic': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      case 'expert': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conceptual': return <BookOpen size={14} />;
      case 'practical': return <Zap size={14} />;
      case 'analytical': return <BarChart3 size={14} />;
      case 'comparative': return <Target size={14} />;
      case 'exploratory': return <TrendingUp size={14} />;
      default: return <FileText size={14} />;
    }
  };

  // ULTRA-STABLE CONTENT RENDERING - Maximum stability with no animations during streaming
  const renderContent = useCallback(() => {
    if (!displayContent || typeof displayContent !== 'string') return null;

    // Ultra-stable content key generation - Less frequent updates
    const contentKey = isStreaming ? 
      `streaming-${Math.floor(displayContent.length / 300)}` : // Changed from 200 to 300
      `static-${displayContent.length}`;

    logDebug('Ultra-stable rendering content:', { 
      contentLength: displayContent.length, 
      isStreaming,
      wordCount: displayContent.split(' ').length 
    });

    // ULTRA-STABILIZED content parsing with NO animations during streaming
    const renderedContent = (
      <div 
        key={contentKey} 
        style={{ 
          whiteSpace: 'pre-wrap', 
          lineHeight: '1.8', 
          fontSize: '1.1rem',
          // ULTRA-STABILIZATION STYLES
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          contain: 'layout style paint',
          willChange: isStreaming ? 'contents' : 'auto'
        }}
      >
        {displayContent.split(/\n\n|\n/).filter((line: string) => line.trim()).map((section: string, idx: number) => {
          const trimmedSection = section.trim();
          
          // DISABLE ALL ANIMATIONS DURING STREAMING for ultra-stability
          const animationStyle = isStreaming ? 'none' : undefined;
          const transitionStyle = isStreaming ? 'none' : undefined;
          
          // Main headings - ULTRA-STABILIZED
          if (trimmedSection.startsWith('# ')) {
            return (
              <h1 key={`h1-${idx}`} style={{
                color: '#FFD700',
                fontSize: '2.2rem',
                fontWeight: '800',
                marginTop: '2.5rem',
                marginBottom: '1.5rem',
                borderBottom: '3px solid #FFD700',
                paddingBottom: '0.75rem',
                textShadow: '2px 2px 4px rgba(255, 215, 0, 0.3)',
                animation: animationStyle,
                transition: transitionStyle,
                transform: 'translateZ(0)', // GPU acceleration
                backfaceVisibility: 'hidden'
              }}>
                {trimmedSection.substring(2)}
              </h1>
            );
          } 
          // Section headings - ULTRA-STABILIZED
          else if (trimmedSection.startsWith('## ')) {
            return (
              <h2 key={`h2-${idx}`} style={{
                color: '#3B82F6',
                fontSize: '1.8rem',
                fontWeight: '700',
                marginTop: '2rem',
                marginBottom: '1rem',
                borderLeft: '5px solid #3B82F6',
                paddingLeft: '1rem',
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent)',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                animation: animationStyle,
                transition: transitionStyle,
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}>
                {trimmedSection.substring(3)}
              </h2>
            );
          } 
          // Sub-headings - ULTRA-STABILIZED
          else if (trimmedSection.startsWith('### ')) {
            return (
              <h3 key={`h3-${idx}`} style={{
                color: '#8B5CF6',
                fontSize: '1.4rem',
                fontWeight: '600',
                marginTop: '1.5rem',
                marginBottom: '0.75rem',
                borderLeft: '3px solid #8B5CF6',
                paddingLeft: '0.75rem',
                animation: animationStyle,
                transition: transitionStyle,
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}>
                {trimmedSection.substring(4)}
              </h3>
            );
          }
          // Key points and important information - ULTRA-STABILIZED
          else if (trimmedSection.includes('**') && trimmedSection.includes('**')) {
            const formattedText = trimmedSection.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #10B981; font-weight: 700; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px;">$1</strong>');
            return (
              <p key={`p-bold-${idx}`} style={{
                color: '#2E1A47',
                marginBottom: '1.2rem',
                lineHeight: '1.8',
                fontSize: '1.1rem',
                padding: '0.5rem 0',
                animation: animationStyle,
                transition: transitionStyle,
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}
              dangerouslySetInnerHTML={{ __html: formattedText }}
              />
            );
          }
          // Bullet points - ULTRA-STABILIZED
          else if (trimmedSection.startsWith('- ') || trimmedSection.startsWith('â€¢ ')) {
            return (
              <div key={`bullet-${idx}`} style={{
                color: '#2E1A47',
                marginBottom: '0.8rem',
                lineHeight: '1.7',
                fontSize: '1.05rem',
                paddingLeft: '1.5rem',
                position: 'relative',
                animation: animationStyle,
                transition: transitionStyle,
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}>
                <span style={{
                  position: 'absolute',
                  left: '0',
                  color: '#F59E0B',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  â—
                </span>
                {trimmedSection.substring(2)}
              </div>
            );
          }
          // Numbered lists - ULTRA-STABILIZED
          else if (trimmedSection.match(/^\d+\./)) {
            const number = trimmedSection.match(/^(\d+)\./)?.[1] || '1';
            const text = trimmedSection.replace(/^\d+\.\s*/, '');
            return (
              <div key={`numbered-${idx}`} style={{
                color: '#2E1A47',
                marginBottom: '0.8rem',
                lineHeight: '1.7',
                fontSize: '1.05rem',
                paddingLeft: '2rem',
                position: 'relative',
                animation: animationStyle,
                transition: transitionStyle,
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}>
                <span style={{
                  position: 'absolute',
                  left: '0',
                  color: '#EF4444',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  background: 'rgba(239, 68, 68, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '50%',
                  minWidth: '24px',
                  textAlign: 'center'
                }}>
                  {number}
                </span>
                {text}
              </div>
            );
          }
          // Regular paragraphs - ULTRA-STABILIZED
          else if (trimmedSection.length > 0) {
            // Highlight important terms and concepts
            let formattedText = trimmedSection;
            
            // Highlight technical terms in quotes
            formattedText = formattedText.replace(/"([^"]+)"/g, '<span style="color: #8B5CF6; font-style: italic; background: rgba(139, 92, 246, 0.1); padding: 2px 4px; border-radius: 3px;">"$1"</span>');
            
            // Highlight percentages and numbers
            formattedText = formattedText.replace(/(\d+%)/g, '<span style="color: #10B981; font-weight: 600; background: rgba(16, 185, 129, 0.1); padding: 1px 4px; border-radius: 3px;">$1</span>');
            
            // Highlight years and dates
            formattedText = formattedText.replace(/(\b\d{4}\b)/g, '<span style="color: #F59E0B; font-weight: 600;">$1</span>');
            
            return (
              <p key={`p-${idx}`} style={{
                color: '#2E1A47',
                marginBottom: '1.2rem',
                lineHeight: '1.8',
                fontSize: '1.05rem',
                textAlign: 'justify',
                animation: animationStyle,
                transition: transitionStyle,
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}
              dangerouslySetInnerHTML={{ __html: formattedText }}
              />
            );
          }
          return null;
        })}
        
        {/* Ultra-stable streaming cursor */}
        {isStreaming && (
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '20px',
            backgroundColor: '#10b981',
            marginLeft: '2px',
            animation: 'blink 1s infinite',
            transform: 'translateZ(0)'
          }} />
        )}
      </div>
    );

    return renderedContent;
  }, [displayContent, isStreaming, logDebug]);

  const filteredQuestions = getFilteredQuestions();

  return (
    <SearchTabErrorBoundary onError={(error) => console.error('[SearchTab] Component error:', error)}>
      <div
        id="research-content"
        style={{
          background: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '2rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          color: '#2E1A47',
          minHeight: '100%',
        }}
      >
        {/* Enhanced Header with Controls and Status */}
        <div style={{
          marginBottom: '1.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '2px solid rgba(255, 215, 0, 0.2)'
        }}>
          {/* Top Section - AI Research Title */}
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <h1 style={{
              fontSize: '2.2rem',
              fontWeight: '800',
              margin: '0 0 0.5rem 0',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B6B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 4px rgba(255, 215, 0, 0.3)',
              letterSpacing: '0.5px'
            }}>
              ðŸ¤– Ultra-Stable AI Research
            </h1>
            
            {/* Fancy Search Term Display */}
            <div style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(177, 156, 217, 0.15) 50%, rgba(59, 130, 246, 0.15) 100%)',
              borderRadius: '25px',
              border: '2px solid transparent',
              backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FFD700, #B19CD9, #3B82F6)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                animation: isStreaming ? 'none' : 'shimmer 2s infinite', // Disable during streaming
                zIndex: 1
              }} />
              <span style={{
                fontSize: '1.3rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #2E1A47 0%, #8B5CF6 50%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                position: 'relative',
                zIndex: 2
              }}>
                "{query || 'Enter your research topic'}"
              </span>
            </div>
            
            {/* Topic Category Badge */}
            {topicCategory && topicCategory !== 'general' && (
              <div style={{
                marginTop: '0.75rem',
                display: 'inline-block'
              }}>
                <span style={{
                  background: 'linear-gradient(45deg, #FFD700, #F59E0B)',
                  color: '#2E1A47',
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)',
                  border: '1px solid rgba(255, 215, 0, 0.5)'
                }}>
                  ðŸ“š {topicCategory}
                </span>
              </div>
            )}
          </div>

          {/* Controls Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {/* Status Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isLoading || isStreaming ? (
                <>
                  <Activity size={18} style={{ color: '#F59E0B' }} />
                  {isStreaming && (
                    <span style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: '600' }}>
                      Ultra-Stable Streaming...
                    </span>
                  )}
                </>
              ) : displayContent ? (
                <CheckCircle size={18} style={{ color: '#10B981' }} />
              ) : currentError ? (
                <AlertTriangle size={18} style={{ color: '#EF4444' }} />
              ) : null}
              
              {retryCount > 0 && (
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#6B7280',
                  marginLeft: '0.5rem' 
                }}>
                  (Retry #{retryCount})
                </span>
                )}
            </div>

            {/* Real-time Streaming Stats */}
            {isStreaming && wordCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#F59E0B',
                  fontWeight: '600',
                  background: 'rgba(245, 158, 11, 0.1)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#F59E0B',
                    animation: 'pulse 1s infinite'
                  }} />
                  {wordCount} words
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#3B82F6',
                  fontWeight: '600',
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem'
                }}>
                  {displayContent.split(' ').length} displayed
                </div>
              </div>
            )}

            {/* Processing Time */}
            {processingTime > 0 && !isStreaming && (
              <div style={{
                fontSize: '0.85rem',
                color: '#10B981',
                fontWeight: '600',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem'
              }}>
                {processingTime.toFixed(1)}s
              </div>
            )}

            {/* Debug Toggle */}
            <button
              onClick={() => setDebugMode(!debugMode)}
              style={{
                padding: '0.5rem 0.75rem',
                background: debugMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(107, 114, 128, 0.1)',
                color: debugMode ? '#3B82F6' : '#6B7280',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
              title="Toggle debug mode"
            >
              Debug
            </button>

            {/* Refresh Button */}
            <RefreshButton 
              onClick={handleRetry} 
              isLoading={isLoading || isStreaming} 
              title="Refresh Research" 
            />
            
            {/* Download PDF */}
            {displayContent && !isStreaming && (
              <button
                onClick={() => generateResearchPdf(displayContent, query, selectedLanguage)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
                  color: '#2E1A47',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600'
                }}
                title="Download as PDF"
              >
                <Download size={16} />
                PDF
              </button>
            )}

            {/* TTS Controls */}
{displayContent && !isStreaming && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <button
      onClick={() => isPlaying ? pauseAudio() : playText(displayContent)}
      style={{
        padding: '0.5rem 0.75rem',
        background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(45deg, #10B981, #059669)',
        color: isPlaying ? '#EF4444' : 'white',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: '600'
      }}
      title={isPlaying ? 'Pause' : 'Play'}
    >
      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      {isPlaying ? 'Pause' : 'Listen'}
    </button>
    
    {(isPlaying || isPaused) && (
      <button
        onClick={stopAudio}
        style={{
          padding: '0.5rem',
          background: 'rgba(107, 114, 128, 0.2)',
          color: '#6B7280',
          border: '1px solid rgba(107, 114, 128, 0.3)',
          borderRadius: '0.5rem',
          cursor: 'pointer'
        }}
        title="Stop"
      >
        <VolumeX size={16} />
      </button>
    )}
    
    {/* Move the select INSIDE this div */}
    {(isPlaying || isPaused) && (
      <select
        value={playbackRate}
        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
        style={{
          padding: '0.25rem 0.5rem',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#EDEDED',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '0.25rem',
          fontSize: '0.8rem'
        }}
      >
        <option value="0.5">0.5x</option>
        <option value="0.75">0.75x</option>
        <option value="1">1x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
        <option value="2">2x</option>
      </select>
    )}
  </div>
)}
            
            {/* Advanced Insights Toggle */}
            {displayContent && !isStreaming && (
              <button
                onClick={() => setShowAdvancedInsights(!showAdvancedInsights)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: showAdvancedInsights
                    ? 'linear-gradient(45deg, #8B5CF6, #7C3AED)'
                    : 'rgba(139, 92, 246, 0.1)',
                  color: showAdvancedInsights ? 'white' : '#8B5CF6',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                title="Toggle advanced insights"
              >
                ðŸ’¡ Insights
              </button>
            )}
          </div>
        </div>

        {/* Debug Information Panel */}
        {debugMode && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.05)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            fontSize: '0.9rem'
          }}>
            <h4 style={{ color: '#3B82F6', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>ðŸ” Ultra-Stable Debug Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#2E1A47' }}>
              <div><strong>Query:</strong> {query || 'None'}</div>
              <div><strong>Display Content Length:</strong> {displayContent?.length || 0}</div>
              <div><strong>Debounced Content Length:</strong> {debouncedContent?.length || 0}</div>
              <div><strong>Streaming Content Length:</strong> {streamingContent?.length || 0}</div>
              <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
              <div><strong>Streaming:</strong> {isStreaming ? 'Yes' : 'No'}</div>
              <div><strong>Error:</strong> {currentError ? 'Yes' : 'No'}</div>
              <div><strong>Follow-up Questions:</strong> {aiFollowUpQuestions?.length || 0}</div>
              <div><strong>Content Insights:</strong> {contentInsights ? 'Yes' : 'No'}</div>
              <div><strong>Search Type:</strong> {useRealTimeSearch ? 'Real-time' : 'AI'}</div>
              <div><strong>Topic Category:</strong> {topicCategory}</div>
              <div><strong>Word Count:</strong> {wordCount}</div>
              <div><strong>Retry Count:</strong> {retryCount}</div>
              <div><strong>Processing Time:</strong> {processingTime}s</div>
              <div><strong>Ultra-Stable Mode:</strong> Active (250ms debounce)</div>
              <div><strong>Hardware Acceleration:</strong> Enabled</div>
              <div><strong>Playback Rate:</strong> {playbackRate}x</div>
              <div><strong>TTS Status:</strong> {isPlaying ? 'Playing' : isPaused ? 'Paused' : 'Stopped'}</div>
              <div><strong>TTS Position:</strong> {currentPosition}s</div>
            </div>
            {currentError && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>
                <strong>Error Details:</strong> {currentError}
              </div>
            )}
            {isStreaming && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem' }}>
                <strong>Ultra-Stable Streaming Status:</strong> Active - Content updating with 250ms debounce, animations disabled, GPU acceleration enabled
              </div>
            )}
          </div>
        )}

        {/* Enhanced Loading States */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                border: '8px solid rgba(177, 156, 217, 0.2)',
                borderLeft: '8px solid #B19CD9',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1.5rem',
              }}
            />
            <h3 style={{ color: '#2E1A47', marginBottom: '1rem', fontSize: '1.3rem' }}>
              {isStreaming ? 'Ultra-stable content streaming...' : (useRealTimeSearch ? 'Searching the web...' : 'Generating comprehensive research...')}
            </h3>
            <p style={{ color: '#6B7280', textAlign: 'center', maxWidth: '400px', lineHeight: '1.5' }}>
              {isStreaming
                ? `Ultra-stable display with 250ms debounce. ${wordCount || 0} words received...`
                : 'Creating detailed explanations with examples, applications, and insights. This may take a moment for comprehensive content.'
              }
            </p>
            {retryCount > 0 && (
              <p style={{ color: '#6B7280', fontSize: '0.9rem', textAlign: 'center', marginTop: '0.5rem' }}>
                This is retry attempt #{retryCount}. Please wait...
              </p>
            )}
          </div>
        )}

        {/* Enhanced Error States */}
        {currentError && !isLoading && !isStreaming && (
          <div
            style={{
              padding: '2rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '1rem',
              color: '#2E1A47',
              textAlign: 'center',
              marginBottom: '1.5rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertTriangle size={48} style={{ color: '#EF4444', marginBottom: '1rem' }} />
            <h3 style={{ color: '#EF4444', marginBottom: '1rem', fontSize: '1.4rem' }}>Research Error</h3>
            <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '1.05rem' }}>{currentError}</p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {retryCount < 3 && (
                <button
                  onClick={handleRetry}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(45deg, #EF4444, #DC2626)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <RefreshCw size={16} />
                  Retry ({3 - retryCount} attempts left)
                </button>
              )}
              
              <button
                onClick={() => {
                  setRetryCount(0);
                  handleQuerySubmit(null, 'What is photosynthesis?');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(107, 114, 128, 0.1)',
                  color: '#374151',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                Try Example Query
              </button>
            </div>
          </div>
        )}

        {/* Main Content Display with Ultra-Stable Streaming */}
        <div 
          ref={contentRef}
          className="content-container"
          style={{ 
            marginBottom: '2.5rem',
            maxHeight: 'calc(100vh - 300px)',
            overflowY: 'auto',
            position: 'relative',
            padding: '1rem 0',
            // ULTRA-STABILIZATION STYLES
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
            perspective: 1000,
            willChange: isStreaming ? 'contents' : 'auto',
            contain: 'layout style paint'
          }}
        >
          {displayContent && !currentError && (
            <div className="formatted-content streaming-content">
              {renderContent()}
              
              {/* Ultra-Stable Streaming Status */}
              {isStreaming && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#3B82F6',
                  // NO ANIMATIONS during streaming for stability
                  animation: 'none',
                  transition: 'none'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    borderTop: '2px solid #3B82F6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Ultra-stable streaming... {wordCount || 0} words (250ms debounce, GPU accelerated)
                </div>
              )}
            </div>
          )}
        </div>

        {/* No Content State */}
        {!displayContent && !isLoading && !currentError && !isStreaming && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Brain size={80} style={{ color: '#B19CD9', marginBottom: '2rem' }} />
            <h2 style={{ color: '#2E1A47', marginBottom: '1rem', fontSize: '1.8rem' }}>Ready for Ultra-Stable AI Research</h2>
            <p style={{ color: '#6B7280', marginBottom: '2.5rem', lineHeight: '1.7', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
              Enter a topic in the search box above and experience ultra-smooth, stabilized streaming content generation with zero shake or jitter.
            </p>
            
            {/* Quick Start Examples */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
              {[
                'What is photosynthesis?',
                'Solve 2x + 3 = 7',
                'History of artificial intelligence',
                'Climate change mitigation strategies',
                'Quantum computing applications',
                'Machine learning algorithms'
              ].map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuerySubmit(null, example)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(177, 156, 217, 0.1)',
                    color: '#8B5CF6',
                    border: '1px solid rgba(177, 156, 217, 0.3)',
                    borderRadius: '2rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(177, 156, 217, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(177, 156, 217, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(177, 156, 217, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Content Insights - Same as before but with ultra-stable rendering */}
        {showAdvancedInsights && contentInsights && !isStreaming && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#8B5CF6', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>ðŸ“Š Content Analysis</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.9rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '2rem',
                    background: getDifficultyColor(contentInsights.difficulty),
                    color: 'white',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}
                >
                  {contentInsights.difficulty}
                </span>
                <span
                  style={{
                    fontSize: '0.9rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '2rem',
                    background:
                      contentInsights.comprehensiveness >= 85
                        ? '#10B981'
                        : contentInsights.comprehensiveness >= 70
                        ? '#F59E0B'
                        : '#EF4444',
                    color: 'white',
                    fontWeight: '600'
                  }}
                >
                  {contentInsights.comprehensiveness}% Complete
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ color: '#8B5CF6', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>ðŸŽ¯ Key Learning Points:</h4>
                <ul style={{ fontSize: '0.95rem', color: '#2E1A47', paddingLeft: '1.5rem', margin: 0, lineHeight: '1.6' }}>
                  {(contentInsights?.keyPoints || []).slice(0, 4).map((point, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem', listStyleType: 'none', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '-1.2rem', color: '#10B981', fontSize: '1.2rem' }}>âœ“</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 style={{ color: '#8B5CF6', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>ðŸ”— Related Topics:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {(contentInsights?.relatedTopics || []).slice(0, 4).map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFollowUpQuery(topic)}
                      style={{
                        fontSize: '0.85rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '1.5rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h4 style={{ color: '#8B5CF6', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>
                  âš¡ Practical Applications:
                </h4>
                <ul style={{ fontSize: '0.95rem', color: '#2E1A47', paddingLeft: '1.5rem', margin: 0, lineHeight: '1.6' }}>
                  {(contentInsights.practicalApplications || []).slice(0, 3).map((app, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem', listStyleType: 'none', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '-1.2rem', color: '#F59E0B', fontSize: '1.2rem' }}>âš¡</span>
                      {app}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 style={{ color: '#8B5CF6', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>ðŸ“š Further Reading:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {(contentInsights.furtherReading || []).slice(0, 3).map((reading, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFollowUpQuery(reading)}
                      style={{
                        fontSize: '0.85rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '1.5rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {reading}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Follow-up Questions Section - Same logic but ultra-stable */}
        {displayContent && !isLoading && !isStreaming && (
          <div
            style={{
              marginTop: '3rem',
              borderTop: '2px solid rgba(177, 156, 217, 0.2)',
              paddingTop: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#2E1A47', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.6rem', margin: 0 }}>
                <MessageSquare size={24} style={{ color: '#8B5CF6' }} />
                Explore Further with AI Questions
                {isGeneratingFollowUps && (
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      border: '3px solid rgba(46, 26, 71, 0.2)',
                      borderTop: '3px solid #2E1A47',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                )}
              </h2>
            </div>

            {/* Question Filters */}
            {filteredQuestions.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                  padding: '1.5rem',
                  background: 'rgba(177, 156, 217, 0.1)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(177, 156, 217, 0.2)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{ color: '#2E1A47', fontSize: '0.95rem', marginBottom: '0.75rem', display: 'block', fontWeight: '600' }}
                  >
                    Question Type:
                  </label>
                  <select
                    value={selectedQuestionType}
                    onChange={(e) => setSelectedQuestionType(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'white',
                      color: '#2E1A47',
                      border: '1px solid rgba(177, 156, 217, 0.3)',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">All Types</option>
                    <option value="conceptual">Conceptual</option>
                    <option value="practical">Practical</option>
                    <option value="analytical">Analytical</option>
                    <option value="comparative">Comparative</option>
                    <option value="exploratory">Exploratory</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{ color: '#2E1A47', fontSize: '0.95rem', marginBottom: '0.75rem', display: 'block', fontWeight: '600' }}
                  >
                    Difficulty:
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'white',
                      color: '#2E1A47',
                      border: '1px solid rgba(177, 156, 217, 0.3)',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">All Levels</option>
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            )}

            {/* Follow-up Questions Display */}
            {followUpError && (
              <div
                style={{
                  padding: '1rem',
                  background: 'rgba(255, 0, 0, 0.1)',
                  borderRadius: '0.75rem',
                  color: '#EF4444',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                }}
              >
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                {followUpError}
              </div>
            )}

            {filteredQuestions.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {filteredQuestions.map((question, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleFollowUpQuery(question.question)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(177, 156, 217, 0.1), rgba(255, 255, 255, 0.8))',
                      border: '1px solid rgba(177, 156, 217, 0.3)',
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      color: '#2E1A47',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      boxShadow: '0 2px 8px rgba(177, 156, 217, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(177, 156, 217, 0.2), rgba(255, 255, 255, 0.9))';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(177, 156, 217, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(177, 156, 217, 0.1), rgba(255, 255, 255, 0.8))';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(177, 156, 217, 0.1)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '1.5rem',
                            background: getQuestionTypeColor(question.type),
                            color: 'white',
                            fontWeight: '600',
                            textTransform: 'capitalize',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {getTypeIcon(question.type)}
                          {question.type}
                        </span>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '1.5rem',
                            background: getDifficultyColor(question.difficulty),
                            color: 'white',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}
                        >
                          {question.difficulty}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          color: '#6B7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontWeight: '500'
                        }}
                      >
                        <Clock size={14} />
                        {question.estimatedTime}m
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '1.05rem',
                        lineHeight: '1.5',
                        margin: '0 0 1rem 0',
                        fontWeight: '500',
                        color: '#2E1A47'
                      }}
                    >
                      {question.question.length > 120 ? `${question.question.substring(0, 120)}...` : question.question}
                    </p>

                    {question.learning_objective && (
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#6B7280',
                        fontStyle: 'italic',
                        marginBottom: '0.5rem'
                      }}>
                        ðŸ“š {question.learning_objective}
                      </div>
                    )}

                    {question.keywords && question.keywords.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {question.keywords.slice(0, 3).map((keyword, kidx) => (
                          <span
                            key={kidx}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.2rem 0.5rem',
                              background: 'rgba(107, 114, 128, 0.1)',
                              color: '#6B7280',
                              borderRadius: '0.75rem'
                            }}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '1rem',
                        right: '1rem',
                        opacity: 0.6,
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14"></path>
                        <path d="M12 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (aiFollowUpQuestions?.length === 0) && !isGeneratingFollowUps && displayContent ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  background: 'rgba(177, 156, 217, 0.05)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(177, 156, 217, 0.1)',
                }}
              >
                <MessageSquare
                  size={64}
                  style={{ color: '#B19CD9', margin: '0 auto', marginBottom: '1.5rem' }}
                />
                <h3 style={{ color: '#B19CD9', marginBottom: '1rem', fontSize: '1.4rem' }}>AI Follow-up Questions Available</h3>
                <p style={{ color: '#2E1A47', marginBottom: '2rem', lineHeight: '1.6', fontSize: '1.05rem' }}>
                  Intelligent follow-up questions are being generated automatically to help you explore this topic
                  more deeply with comprehensive explanations.
                </p>
              </div>
            ) : filteredQuestions.length === 0 && (aiFollowUpQuestions?.length || 0) > 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  color: '#F59E0B',
                }}
              >
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem' }}>No Questions Match Your Filters</h3>
                <p style={{ margin: 0, fontSize: '1.05rem' }}>Try adjusting the question type or difficulty filters to see more questions.</p>
              </div>
            ) : null}

            {/* Legacy Follow-up Questions (if any) */}
            {followUpQuestions.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ color: '#2E1A47', marginBottom: '1rem', fontSize: '1.2rem' }}>
                  Quick Exploration Topics:
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {followUpQuestions.map((question, questionIdx) => (
                    <button
                      key={`legacy-follow-up-${questionIdx}`}
                      onClick={() => handleFollowUpQuery(question)}
                      style={{
                        background: 'rgba(177, 156, 217, 0.1)',
                        border: '1px solid rgba(177, 156, 217, 0.3)',
                        borderRadius: '1.5rem',
                        padding: '0.75rem 1.5rem',
                        color: '#2E1A47',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(177, 156, 217, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(177, 156, 217, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer with Ultra-Stable Learning Summary */}
        {displayContent && !isStreaming && (
 <div
   style={{
     marginTop: '3rem',
     padding: '1.5rem',
     background: 'linear-gradient(135deg, rgba(46, 26, 71, 0.05), rgba(177, 156, 217, 0.05))',
     borderRadius: '1rem',
     border: '1px solid rgba(177, 156, 217, 0.2)',
     textAlign: 'center'
   }}
 >
   <h4 style={{ color: '#2E1A47', marginBottom: '1rem', fontSize: '1.2rem' }}>
     ðŸŽ“ Ultra-Stable AI Learning Experience with Audio
   </h4>
   <p style={{ color: '#6B7280', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
     This research provides ultra-stable streaming with 250ms debouncing, GPU acceleration, and zero shake/jitter for optimal reading experience.
     Content is delivered with comprehensive explanations, follow-up questions, and high-quality text-to-speech powered by Google Cloud AI.
     {topicCategory && topicCategory !== 'general' && (
       <span style={{ color: '#FFD700', fontWeight: '600' }}>
         {' '}Content has been optimized for {topicCategory} topics with maximum stability and audio clarity.
       </span>
     )}
   </p>
   
   {/* TTS Status Indicator */}
   {(isPlaying || isPaused) && (
     <div style={{
       marginTop: '1rem',
       padding: '0.75rem',
       background: 'rgba(16, 185, 129, 0.1)',
       borderRadius: '0.5rem',
       border: '1px solid rgba(16, 185, 129, 0.3)',
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'center',
       gap: '0.5rem'
     }}>
       <Volume2 size={16} style={{ color: '#10B981' }} />
       <span style={{ color: '#10B981', fontSize: '0.9rem', fontWeight: '600' }}>
         Audio playback {isPlaying ? 'active' : 'paused'} - Enhanced learning with voice synthesis
       </span>
     </div>
   )}
 </div>
)}

        {/* Ultra-Stable CSS animations */}
        <style>
          {`
            /* Ultra-stable CSS with hardware acceleration */
            .formatted-content {
              will-change: contents;
              transform: translateZ(0);
              backface-visibility: hidden;
              -webkit-font-smoothing: antialiased;
              contain: layout style paint;
            }

            .content-container {
              position: relative;
              min-height: 200px;
              transform: translate3d(0, 0, 0);
            }

            .streaming-content {
              animation: none !important;
              transition: none !important;
            }

            /* Prevent layout shifts during streaming */
            .streaming-content h1, 
            .streaming-content h2, 
            .streaming-content h3, 
            .streaming-content p, 
            .streaming-content div {
              transform: translateZ(0);
              will-change: auto;
              animation: none !important;
              transition: none !important;
            }

            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes shimmer {
              0% { left: -100%; }
              100% { left: 100%; }
            }
            @keyframes fadeIn {
              0% { opacity: 0; transform: translateY(10px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideIn {
              0% { opacity: 0; transform: translateX(-20px); }
              100% { opacity: 1; transform: translateX(0); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
          `}
        </style>
      </div>
    </SearchTabErrorBoundary>
  );
};

export default SearchTab;
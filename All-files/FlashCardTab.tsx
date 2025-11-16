import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RotateCcw, ArrowLeft, ArrowRight, RefreshCw, Download, Volume2, VolumeX, Eye, EyeOff, Shuffle, BookOpen, CheckCircle, X, Star, Lightbulb, Grid, List, Filter, Search, BarChart3, Clock, Layers, Tag } from 'lucide-react';
import RefreshButton from '../shared/RefreshButton';
import LoadingIndicator from '../shared/LoadingIndicator';
import ErrorMessage from '../shared/ErrorMessage';

interface FlashCardTabProps {
  query: string;
  content: string;
  selectedLanguage: string;
}

interface ContentFlashCard {
  id: number;
  content: string;
  type: 'heading' | 'content' | 'definition' | 'example' | 'process' | 'application' | 'fact' | 'concept';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  section: string;
  topic: string;
  hint: string;
  keywords: string[];
  mainTopic: string;
  readingTime: number;
  createdAt: string;
  partOf?: number | null;
}

interface FlashCardResponse {
  success: boolean;
  topic: string;
  total_cards: number;
  flashcards: ContentFlashCard[];
  processing_time: number;
  content_stats: {
    total: number;
    byType: { [key: string]: number };
    byDifficulty: { [key: string]: number };
    bySection: { [key: string]: number };
  };
  processing_info: {
    original_length: number;
    cleaned_length: number;
    chunks_created: number;
    chunks_retained: number;
  };
}

interface StudySession {
  studiedCards: Set<number>;
  bookmarkedCards: Set<number>;
  startTime: number;
  totalCardsViewed: number;
  sessionDuration: number;
}

const FlashCardTab: React.FC<FlashCardTabProps> = ({ query, content, selectedLanguage }) => {
  const [flashcards, setFlashcards] = useState<ContentFlashCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<ContentFlashCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(1.0);
  
  // Study session state
  const [studySession, setStudySession] = useState<StudySession>({
    studiedCards: new Set(),
    bookmarkedCards: new Set(),
    startTime: Date.now(),
    totalCardsViewed: 0,
    sessionDuration: 0
  });
  
  // Filter and search state
  const [currentFilter, setCurrentFilter] = useState<{
    difficulty: 'all' | 'basic' | 'intermediate' | 'advanced';
    type: 'all' | 'heading' | 'content' | 'definition' | 'example' | 'process' | 'application' | 'fact' | 'concept';
    section: 'all' | string;
  }>({
    difficulty: 'all',
    type: 'all',
    section: 'all'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'single' | 'grid' | 'list'>('single');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5);
  const [showStatistics, setShowStatistics] = useState(false);
  const [sortBy, setSortBy] = useState<'order' | 'difficulty' | 'length' | 'section'>('order');
  
  // Refs
  const autoPlayTimerRef = useRef<number | null>(null);
const sessionTimerRef = useRef<number | null>(null);
  
  // Content statistics and insights
  const contentStats = useMemo(() => {
    if (flashcards.length === 0) return null;
    
    const stats = {
      total: flashcards.length,
      studied: studySession.studiedCards.size,
      bookmarked: studySession.bookmarkedCards.size,
      byDifficulty: {} as { [key: string]: number },
      byType: {} as { [key: string]: number },
      bySection: {} as { [key: string]: number },
      totalReadingTime: 0,
      averageLength: 0
    };
    
    flashcards.forEach(card => {
      stats.byDifficulty[card.difficulty] = (stats.byDifficulty[card.difficulty] || 0) + 1;
      stats.byType[card.type] = (stats.byType[card.type] || 0) + 1;
      stats.bySection[card.section] = (stats.bySection[card.section] || 0) + 1;
      stats.totalReadingTime += card.readingTime;
      stats.averageLength += card.content.length;
    });
    
    stats.averageLength = Math.round(stats.averageLength / flashcards.length);
    
    return stats;
  }, [flashcards, studySession.studiedCards, studySession.bookmarkedCards]);
  
  // Available sections for filtering
  const availableSections = useMemo(() => {
    const sections = new Set(flashcards.map(card => card.section));
    return Array.from(sections).sort();
  }, [flashcards]);
  
  // Start session timer
  useEffect(() => {
    sessionTimerRef.current = setInterval(() => {
      setStudySession(prev => ({
        ...prev,
        sessionDuration: Date.now() - prev.startTime
      }));
    }, 1000);
    
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, []);
  
  // Auto-generate flashcards when content changes
  useEffect(() => {
    if (content && content.length > 100 && query) {
      generateFlashcards();
    }
  }, [content, query]);
  
  // Filter and search cards
  useEffect(() => {
    let filtered = [...flashcards];
    
    // Apply filters
    if (currentFilter.difficulty !== 'all') {
      filtered = filtered.filter(card => card.difficulty === currentFilter.difficulty);
    }
    
    if (currentFilter.type !== 'all') {
      filtered = filtered.filter(card => card.type === currentFilter.type);
    }
    
    if (currentFilter.section !== 'all') {
      filtered = filtered.filter(card => card.section === currentFilter.section);
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(card => 
        card.content.toLowerCase().includes(searchLower) ||
        card.keywords.some(keyword => keyword.toLowerCase().includes(searchLower)) ||
        card.section.toLowerCase().includes(searchLower) ||
        card.topic.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'difficulty':
        const difficultyOrder = { 'basic': 1, 'intermediate': 2, 'advanced': 3 };
        filtered.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
        break;
      case 'length':
        filtered.sort((a, b) => a.content.length - b.content.length);
        break;
      case 'section':
        filtered.sort((a, b) => a.section.localeCompare(b.section));
        break;
      default:
        filtered.sort((a, b) => a.id - b.id);
    }
    
    setFilteredCards(filtered);
    
    // Reset current index if needed
    if (currentCardIndex >= filtered.length) {
      setCurrentCardIndex(0);
    }
  }, [flashcards, currentFilter, searchTerm, sortBy, currentCardIndex]);
  
  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlay && filteredCards.length > 0) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentCardIndex(prev => {
          const nextIndex = prev < filteredCards.length - 1 ? prev + 1 : 0;
          markCardAsViewed();
          return nextIndex;
        });
      }, autoPlayInterval * 1000);
      
      return () => {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
        }
      };
    }
  }, [isAutoPlay, filteredCards.length, autoPlayInterval]);
  
  // Generate flashcards from research content
  const generateFlashcards = async () => {
    if (!content || content.length < 100) {
      setError('Content is too short to generate meaningful flashcards (minimum 100 characters)');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8080/api/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          topic: query,
          options: {
            maxChunkLength: 200,
            minChunkLength: 50,
            includeHeadings: true,
            includeLongContent: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: FlashCardResponse = await response.json();

      if (data.success && data.flashcards) {
        setFlashcards(data.flashcards);
        setCurrentCardIndex(0);
        setStudySession(prev => ({
          ...prev,
          studiedCards: new Set(),
          bookmarkedCards: new Set(),
          totalCardsViewed: 0,
          startTime: Date.now()
        }));
        console.log(`Generated ${data.total_cards} content flashcards in ${data.processing_time}s`);
      } else {
        throw new Error('Failed to generate flashcards');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error generating flashcards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const handlePrevCard = () => {
    if (filteredCards.length === 0) return;
    setCurrentCardIndex(prev => {
      const newIndex = prev > 0 ? prev - 1 : filteredCards.length - 1;
      markCardAsViewed();
      return newIndex;
    });
  };

  const handleNextCard = () => {
    if (filteredCards.length === 0) return;
    setCurrentCardIndex(prev => {
      const newIndex = prev < filteredCards.length - 1 ? prev + 1 : 0;
      markCardAsViewed();
      return newIndex;
    });
  };

  const goToCard = (index: number) => {
    if (index >= 0 && index < filteredCards.length) {
      setCurrentCardIndex(index);
      markCardAsViewed();
    }
  };

  // Study session functions
  const markCardAsStudied = (cardId: number) => {
    setStudySession(prev => ({
      ...prev,
      studiedCards: new Set([...prev.studiedCards, cardId])
    }));
  };

  const toggleBookmark = (cardId: number) => {
    setStudySession(prev => {
      const newBookmarks = new Set(prev.bookmarkedCards);
      if (newBookmarks.has(cardId)) {
        newBookmarks.delete(cardId);
      } else {
        newBookmarks.add(cardId);
      }
      return {
        ...prev,
        bookmarkedCards: newBookmarks
      };
    });
  };

  const markCardAsViewed = () => {
    setStudySession(prev => ({
      ...prev,
      totalCardsViewed: prev.totalCardsViewed + 1
    }));
  };

  // Shuffle flashcards
  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentCardIndex(0);
  };

  // Text-to-speech functions
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage === 'hindi' ? 'hi-IN' : 'en-IN';
      utterance.rate = currentPlaybackRate;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Export flashcards
  const exportFlashcards = () => {
    const exportData = filteredCards.map((card, index) => 
      `Card ${index + 1}:
Content: ${card.content}
Type: ${card.type}
Difficulty: ${card.difficulty}
Section: ${card.section}
Topic: ${card.topic}
Keywords: ${card.keywords.join(', ')}
Reading Time: ${card.readingTime} minutes
${card.hint ? `Hint: ${card.hint}` : ''}
---`
    ).join('\n\n');

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${query.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'heading': return 'ðŸ“‹';
      case 'definition': return 'ðŸ“–';
      case 'example': return 'ðŸ’¡';
      case 'process': return 'âš™ï¸';
      case 'application': return 'ðŸ”§';
      case 'fact': return 'ðŸ“Š';
      case 'concept': return 'ðŸ§ ';
      default: return 'ðŸ“';
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'basic': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Format time duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Render single card view
  const renderSingleCard = () => {
    if (filteredCards.length === 0) return null;
    
    const currentCard = filteredCards[currentCardIndex];
    if (!currentCard) return null;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          minHeight: '400px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '20px',
          padding: '2rem',
          border: `3px solid ${getDifficultyColor(currentCard.difficulty)}`,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          transition: 'transform 0.3s ease'
        }}>
          {/* Card Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(currentCard.type)}</span>
              <div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#2E1A47',
                  textTransform: 'capitalize'
                }}>
                  {currentCard.type}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#6B7280'
                }}>
                  {currentCard.section}
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                background: getDifficultyColor(currentCard.difficulty),
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}>
                {currentCard.difficulty}
              </div>
              
              <button
                onClick={() => toggleBookmark(currentCard.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: studySession.bookmarkedCards.has(currentCard.id) ? '#FFD700' : '#CBD5E0'
                }}
              >
                â­
              </button>
            </div>
          </div>

          {/* Card Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              fontSize: '1.1rem',
              lineHeight: '1.8',
              color: '#2E1A47',
              textAlign: 'justify',
              maxHeight: '250px',
              overflowY: 'auto',
              padding: '0 1rem'
            }}>
              {currentCard.content}
            </div>
          </div>

          {/* Card Footer */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: '#6B7280'
          }}>
            <div>
              Card {currentCardIndex + 1} of {filteredCards.length}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14} />
                {currentCard.readingTime}m read
              </div>
              {currentCard.keywords.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Tag size={14} />
                  {currentCard.keywords.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Study Progress Indicator */}
          {studySession.studiedCards.has(currentCard.id) && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#10B981',
              color: 'white',
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              âœ“ Studied
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={handlePrevCard}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <ArrowLeft size={16} />
            Previous
          </button>

          <button
            onClick={() => markCardAsStudied(currentCard.id)}
            disabled={studySession.studiedCards.has(currentCard.id)}
            style={{
              padding: '0.75rem 1.5rem',
              background: studySession.studiedCards.has(currentCard.id) 
                ? 'rgba(16, 185, 129, 0.3)' 
                : 'linear-gradient(45deg, #10B981, #059669)',
              color: studySession.studiedCards.has(currentCard.id) ? '#10B981' : 'white',
              border: studySession.studiedCards.has(currentCard.id) ? '2px solid #10B981' : 'none',
              borderRadius: '25px',
              cursor: studySession.studiedCards.has(currentCard.id) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <CheckCircle size={16} />
            {studySession.studiedCards.has(currentCard.id) ? 'Studied' : 'Mark as Studied'}
          </button>

          <button
            onClick={handleNextCard}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(45deg, #f093fb, #f5576c)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            Next
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Render grid view
  const renderGridView = () => {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
        padding: '1rem'
      }}>
        {filteredCards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => goToCard(index)}
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: `2px solid ${getDifficultyColor(card.difficulty)}`,
              cursor: 'pointer',
              position: 'relative',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            {/* Card Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>{getTypeIcon(card.type)}</span>
                <div>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#2E1A47',
                    textTransform: 'capitalize'
                  }}>
                    {card.type}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#6B7280'
                  }}>
                    {card.section}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <div style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '8px',
                  background: getDifficultyColor(card.difficulty),
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {card.difficulty}
                </div>
                
                {studySession.bookmarkedCards.has(card.id) && (
                  <span style={{ color: '#FFD700', fontSize: '1rem' }}>â­</span>
                )}
              </div>
            </div>

            {/* Card Content */}
            <div style={{
              flex: 1,
              fontSize: '0.9rem',
              lineHeight: '1.6',
              color: '#2E1A47',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical'
            }}>
              {card.content}
            </div>

            {/* Card Footer */}
            <div style={{
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.7rem',
              color: '#6B7280'
            }}>
              <div>{card.readingTime}m read</div>
              <div>#{index + 1}</div>
            </div>

            {/* Study Status Indicators */}
            {studySession.studiedCards.has(card.id) && (
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: '#10B981',
                color: 'white',
                padding: '0.2rem 0.5rem',
                borderRadius: '8px',
                fontSize: '0.6rem',
                fontWeight: '600'
              }}>
                âœ“
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1rem'
      }}>
        {filteredCards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => goToCard(index)}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              border: `1px solid ${getDifficultyColor(card.difficulty)}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            {/* List Item Icon */}
            <div style={{
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px'
            }}>
              {getTypeIcon(card.type)}
            </div>

            {/* List Item Content */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  fontWeight: '600',
                  color: '#2E1A47',
                  textTransform: 'capitalize'
                }}>
                  {card.type}
                </div>
                <div style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '8px',
                  background: getDifficultyColor(card.difficulty),
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {card.difficulty}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#6B7280'
                }}>
                  {card.section}
                </div>
              </div>
              
              <div style={{
                fontSize: '0.9rem',
                color: '#2E1A47',
                lineHeight: '1.5',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {card.content}
              </div>
            </div>

            {/* List Item Metadata */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.25rem',
              minWidth: '80px'
            }}>
              <div style={{
                fontSize: '0.8rem',
                color: '#6B7280'
              }}>
                #{index + 1}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Clock size={12} />
                {card.readingTime}m
              </div>
              
              {/* Status Indicators */}
              <div style={{
                display: 'flex',
                gap: '0.25rem'
              }}>
                {studySession.studiedCards.has(card.id) && (
                  <span style={{ color: '#10B981', fontSize: '0.8rem' }}>âœ“</span>
                )}
                {studySession.bookmarkedCards.has(card.id) && (
                  <span style={{ color: '#FFD700', fontSize: '0.8rem' }}>â­</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <LoadingIndicator 
        message="Processing content into flashcards..." 
        subMessage="Breaking down your research content into digestible study cards" 
      />
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => generateFlashcards()} 
      />
    );
  }

  // No content state
  if (!content || content.length < 100) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%', 
        padding: '2rem',
        textAlign: 'center'
      }}>
        <BookOpen size={64} style={{ color: '#B19CD9', marginBottom: '1rem' }} />
        <h3 style={{ color: '#2E1A47', marginBottom: '1rem' }}>No Research Content Available</h3>
        <p style={{ color: '#6B7280', lineHeight: '1.6', maxWidth: '400px' }}>
          Start a research query in the Search tab to generate content-based flashcards automatically.
        </p>
      </div>
    );
  }

  // No flashcards generated yet
  if (flashcards.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%', 
        padding: '2rem',
        textAlign: 'center'
      }}>
        <Layers size={64} style={{ color: '#FFD700', marginBottom: '1rem' }} />
        <h3 style={{ color: '#2E1A47', marginBottom: '1rem' }}>Ready to Create Content Flashcards</h3>
        <p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '400px' }}>
          Transform your research content about "{query}" into organized, bite-sized flashcards for effective studying.
        </p>
        <RefreshButton
          onClick={() => generateFlashcards()}
          isLoading={isLoading}
          title="Generate Content Flashcards"
        />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1rem', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '600px'
    }}>
      {/* Enhanced Header with Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'white',
        padding: '1.5rem',
        borderRadius: '15px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Left Section - Title and Stats */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ 
            color: '#2E1A47', 
            margin: '0 0 0.5rem 0', 
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>
            ðŸ“š Content Flashcards: {query}
          </h3>
          <div style={{
            display: 'flex',
            gap: '1rem',
            fontSize: '0.9rem',
            color: '#6B7280',
            marginBottom: '1rem'
          }}>
            <span>{filteredCards.length} of {flashcards.length} cards</span>
            <span>â€¢</span>
            <span>{studySession.studiedCards.size} studied</span>
            <span>â€¢</span>
            <span>{studySession.bookmarkedCards.size} bookmarked</span>
            <span>â€¢</span>
            <span>{formatDuration(studySession.sessionDuration)} session</span>
          </div>
          
          {/* Quick Stats */}
          {contentStats && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                padding: '0.25rem 0.75rem',
                background: '#E0F2FE',
                color: '#0369A1',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {contentStats.totalReadingTime}m total reading
              </div>
              <div style={{
                padding: '0.25rem 0.75rem',
                background: '#F0FDF4',
                color: '#15803D',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {Math.round((studySession.studiedCards.size / flashcards.length) * 100)}% progress
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          alignItems: 'flex-start', 
          flexWrap: 'wrap',
          minWidth: '300px'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2rem',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '0.9rem'
              }}
            />
            <Search size={16} style={{
              position: 'absolute',
              left: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6B7280'
            }} />
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '0.25rem' }}>
            <button
              onClick={() => setViewMode('single')}
              style={{
                padding: '0.5rem 0.75rem',
                background: viewMode === 'single' ? '#3b82f6' : 'transparent',
                color: viewMode === 'single' ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Eye size={14} />
              Single
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.5rem 0.75rem',
                background: viewMode === 'grid' ? '#3b82f6' : 'transparent',
                color: viewMode === 'grid' ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Grid size={14} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem 0.75rem',
                background: viewMode === 'list' ? '#3b82f6' : 'transparent',
                color: viewMode === 'list' ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <List size={14} />
              List
            </button>
          </div>

          {/* Statistics Toggle */}
          <button
            onClick={() => setShowStatistics(!showStatistics)}
            style={{
              padding: '0.5rem 0.75rem',
              background: showStatistics ? '#8b5cf6' : '#f1f5f9',
              color: showStatistics ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <BarChart3 size={14} />
            Stats
          </button>

          {/* Audio Control */}
          {viewMode === 'single' && filteredCards.length > 0 && (
            <button
              onClick={() => {
                const currentCard = filteredCards[currentCardIndex];
                if (currentCard) {
                  isSpeaking ? stopSpeaking() : speakText(currentCard.content);
                }
              }}
              style={{
                padding: '0.5rem 0.75rem',
                background: isSpeaking ? '#ef4444' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {isSpeaking ? 'Stop' : 'Listen'}
            </button>
          )}

          {/* Auto Play Toggle */}
          {viewMode === 'single' && (
            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              style={{
                padding: '0.5rem 0.75rem',
                background: isAutoPlay ? '#10b981' : '#f1f5f9',
                color: isAutoPlay ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              {isAutoPlay ? 'â¸ï¸' : 'â–¶ï¸'}
              Auto
            </button>
          )}

          {/* Shuffle Button */}
          <button
            onClick={shuffleCards}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Shuffle size={14} />
            Shuffle
          </button>

          {/* Export Button */}
          <button
            onClick={exportFlashcards}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Download size={14} />
            Export
          </button>

          {/* Regenerate Button */}
          <RefreshButton
            onClick={() => generateFlashcards()}
            isLoading={isLoading}
            title="Regenerate"
          />
        </div>
      </div>

      {/* Filters and Statistics */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Filter Controls */}
        <div style={{
          background: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '15px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          marginBottom: showStatistics ? '1rem' : '0'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} style={{ color: '#6B7280' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2E1A47' }}>Filters:</span>
            </div>

            {/* Difficulty Filter */}
            <select
              value={currentFilter.difficulty}
              onChange={(e) => setCurrentFilter(prev => ({ ...prev, difficulty: e.target.value as any }))}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                background: 'white',
                color: '#2E1A47',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}
            >
              <option value="all">All Difficulties</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {/* Type Filter */}
            <select
              value={currentFilter.type}
              onChange={(e) => setCurrentFilter(prev => ({ ...prev, type: e.target.value as any }))}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                background: 'white',
                color: '#2E1A47',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}
            >
              <option value="all">All Types</option>
              <option value="heading">Headings</option>
              <option value="content">Content</option>
              <option value="definition">Definitions</option>
              <option value="example">Examples</option>
              <option value="process">Processes</option>
              <option value="application">Applications</option>
              <option value="fact">Facts</option>
              <option value="concept">Concepts</option>
            </select>

            {/* Section Filter */}
            {availableSections.length > 1 && (
              <select
                value={currentFilter.section}
                onChange={(e) => setCurrentFilter(prev => ({ ...prev, section: e.target.value }))}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  background: 'white',
                  color: '#2E1A47',
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}
              >
                <option value="all">All Sections</option>
                {availableSections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            )}

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                background: 'white',
                color: '#2E1A47',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}
            >
              <option value="order">Original Order</option>
              <option value="difficulty">By Difficulty</option>
              <option value="length">By Length</option>
              <option value="section">By Section</option>
            </select>

            {/* Clear Filters */}
            {(currentFilter.difficulty !== 'all' || currentFilter.type !== 'all' || currentFilter.section !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setCurrentFilter({ difficulty: 'all', type: 'all', section: 'all' });
                  setSearchTerm('');
                }}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Statistics Panel */}
        {showStatistics && contentStats && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1.5rem',
            borderRadius: '15px',
            color: 'white'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700' }}>
              ðŸ“Š Study Statistics
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {/* Progress Stats */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '1rem',
                borderRadius: '12px'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>Study Progress</h5>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {Math.round((studySession.studiedCards.size / flashcards.length) * 100)}%
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {studySession.studiedCards.size} of {flashcards.length} cards studied
                </div>
              </div>

              {/* Session Time */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '1rem',
                borderRadius: '12px'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>Session Time</h5>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {formatDuration(studySession.sessionDuration)}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {studySession.totalCardsViewed} cards viewed
                </div>
              </div>

              {/* Content Distribution */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '1rem',
                borderRadius: '12px'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>Content Types</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {Object.entries(contentStats.byType).slice(0, 3).map(([type, count]) => (
                    <div key={type} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '0.8rem'
                    }}>
                      <span style={{ textTransform: 'capitalize' }}>{type}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reading Time */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '1rem',
                borderRadius: '12px'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>Reading Time</h5>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {contentStats.totalReadingTime}m
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Avg: {Math.round(contentStats.totalReadingTime / flashcards.length)}m per card
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar for Single View */}
      {viewMode === 'single' && filteredCards.length > 0 && (
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
          marginBottom: '1.5rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((currentCardIndex + 1) / filteredCards.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}

      {/* Main Flashcard Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
      }}>
        {viewMode === 'single' && renderSingleCard()}
        {viewMode === 'grid' && renderGridView()}
        {viewMode === 'list' && renderListView()}
      </div>

      {/* Study Summary Footer */}
      <div style={{
        marginTop: '1.5rem',
        background: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '15px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Study Progress Summary */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#10b981'
            }}>
              {studySession.studiedCards.size}
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Studied
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#3b82f6'
            }}>
              {filteredCards.length}
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Total Cards
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#f59e0b'
            }}>
              {flashcards.length > 0 ? Math.round((studySession.studiedCards.size / flashcards.length) * 100) : 0}%
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Progress
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#8b5cf6'
            }}>
              {studySession.bookmarkedCards.size}
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Bookmarked
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setStudySession(prev => ({ 
              ...prev, 
              studiedCards: new Set(),
              bookmarkedCards: new Set(),
              startTime: Date.now(),
              totalCardsViewed: 0
            }))}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RotateCcw size={14} />
            Reset Progress
          </button>

          {/* Study Complete Celebration */}
          {studySession.studiedCards.size === flashcards.length && flashcards.length > 0 && (
            <div style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(45deg, #10b981, #059669)',
              color: 'white',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'pulse 2s infinite'
            }}>
              <Star size={14} />
              All Content Reviewed! ðŸŽ‰
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { 
              opacity: 1; 
              transform: scale(1);
            }
            50% { 
              opacity: 0.8; 
              transform: scale(1.05);
            }
          }
          
          @keyframes slideIn {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }
          
          .fade-in {
            animation: fadeIn 0.3s ease-in;
          }
          
          .slide-in {
            animation: slideIn 0.5s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default FlashCardTab;
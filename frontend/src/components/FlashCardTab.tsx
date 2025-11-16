import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, RotateCcw, BookOpen, Clock, Layers, Grid, List, FileText } from 'lucide-react';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';

interface FlashCardTabProps {
  query: string;
  content: string;
  selectedLanguage: string;
  isGeneratingContent?: boolean;
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
}

type ViewMode = 'single' | 'grid' | 'list';

const FlashCardTab: React.FC<FlashCardTabProps> = ({ query, content, isGeneratingContent = false }) => {
  const [flashcards, setFlashcards] = useState<ContentFlashCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  
  const audioRef = useRef<HTMLAudioElement>(null);

  

  // Auto-generate flashcards when content changes
  useEffect(() => {
    if (content && content.length > 200 && query && !isGeneratingContent) {
      generateFlashcards();
    }
  }, [content, query, isGeneratingContent]);

  // Generate flashcards from pure AI API
  const generateFlashcards = async () => {
    if (!content || content.length < 200) {
      setError('Content is too short to generate meaningful flashcards');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://prepnx-backend.vercel.app/api/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          topic: query,
          options: {}
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
        setCurrentCardIndex(0);
        setShowDetails(false);
      } else {
        throw new Error('No flashcards were generated from the content');
      }

    } catch (err) {
      console.error('Failed to generate flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  // Get subject-based premium dark colors
  const getSubjectColors = (topic: string) => {
    const topicLower = topic.toLowerCase();
    
    if (/biology|chemistry|physics|science|medical/.test(topicLower)) {
      return {
        primary: '#0f766e',
        secondary: '#14b8a6',
        accent: '#5eead4',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f766e 70%, #14b8a6 100%)',
        cardBg: 'rgba(15, 118, 110, 0.1)',
        textColor: '#f0fdfa'
      };
    }
    
    if (/technology|programming|computer|software/.test(topicLower)) {
      return {
        primary: '#7c3aed',
        secondary: '#a855f7',
        accent: '#c4b5fd',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #7c3aed 70%, #a855f7 100%)',
        cardBg: 'rgba(124, 58, 237, 0.1)',
        textColor: '#faf5ff'
      };
    }
    
    if (/history|culture|social|political/.test(topicLower)) {
      return {
        primary: '#ea580c',
        secondary: '#fb923c',
        accent: '#fed7aa',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #431407 30%, #ea580c 70%, #fb923c 100%)',
        cardBg: 'rgba(234, 88, 12, 0.1)',
        textColor: '#fff7ed'
      };
    }
    
    if (/math|statistics|algebra|geometry/.test(topicLower)) {
      return {
        primary: '#2563eb',
        secondary: '#3b82f6',
        accent: '#93c5fd',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #2563eb 70%, #3b82f6 100%)',
        cardBg: 'rgba(37, 99, 235, 0.1)',
        textColor: '#eff6ff'
      };
    }
    
    return {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      accent: '#c4b5fd',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #312e81 30%, #8b5cf6 70%, #a78bfa 100%)',
      cardBg: 'rgba(139, 92, 246, 0.1)',
      textColor: '#faf5ff'
    };
  };

  const colors = getSubjectColors(query);

  // Get difficulty styling
  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'basic':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)' };
      case 'intermediate':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)' };
      case 'advanced':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)' };
      default:
        return { color: colors.primary, bg: colors.cardBg, border: `${colors.primary}40` };
    }
  };

  // Navigation functions
  const nextPage = () => {
    if (currentCardIndex < flashcards.length - 1) {
      playPageSound();
      setIsPageTurning(true);
      markAsStudied();
      
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
        setShowDetails(false);
        setIsPageTurning(false);
      }, 600);
    }
  };

  const previousPage = () => {
    if (currentCardIndex > 0) {
      playPageSound();
      setIsPageTurning(true);
      
      setTimeout(() => {
        setCurrentCardIndex(prev => prev - 1);
        setShowDetails(false);
        setIsPageTurning(false);
      }, 600);
    }
  };

  const markAsStudied = () => {
    if (flashcards[currentCardIndex]) {
      setStudiedCards(prev => new Set(prev).add(flashcards[currentCardIndex].id));
    }
  };

  const playPageSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const speakContent = () => {
    if (!('speechSynthesis' in window)) return;

    const currentCard = flashcards[currentCardIndex];
    if (!currentCard) return;

    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentCard.content);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const resetProgress = () => {
    setCurrentCardIndex(0);
    setShowDetails(false);
    setIsPageTurning(false);
    setStudiedCards(new Set());
  };

  const goToCard = (index: number) => {
    if (index >= 0 && index < flashcards.length) {
      setIsPageTurning(true);
      setTimeout(() => {
        setCurrentCardIndex(index);
        setShowDetails(false);
        setIsPageTurning(false);
      }, 300);
    }
  };

  // Export functions
  const exportToPDF = async () => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();
    
    // Set up fonts and colors
    doc.setFont('helvetica');
    
    // Title Page
    doc.setFontSize(24);
    doc.setTextColor(88, 92, 246); // Purple color
    doc.text(query, 105, 40, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text('Study Flashcards', 105, 55, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 70, { align: 'center' });
    doc.text(`Total Cards: ${flashcards.length}`, 105, 80, { align: 'center' });
    
    // Start cards from second page or after some space
    let yPosition = 110;
    
    flashcards.forEach((card, index) => {
      // Check if we need a new page
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 30;
      }
      
      // Card number and type
      doc.setFontSize(14);
      doc.setTextColor(88, 92, 246);
      doc.text(`${index + 1}.`, 20, yPosition);
      
      // Difficulty badge
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`[${card.difficulty.toUpperCase()}]`, 35, yPosition);
      
      // Main content
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      yPosition += 8;
      
      const contentLines = doc.splitTextToSize(card.content, 160);
      doc.text(contentLines, 20, yPosition);
      yPosition += contentLines.length * 6;
      
      // Hint section
      if (card.hint) {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        yPosition += 5;
        doc.text('💡 Hint:', 20, yPosition);
        yPosition += 5;
        
        const hintLines = doc.splitTextToSize(card.hint, 160);
        doc.text(hintLines, 20, yPosition);
        yPosition += hintLines.length * 5;
      }
      
      // Keywords
      if (card.keywords && card.keywords.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        yPosition += 5;
        doc.text(`Keywords: ${card.keywords.slice(0, 5).join(', ')}`, 20, yPosition);
        yPosition += 5;
      }
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPosition + 5, 190, yPosition + 5);
      yPosition += 15;
    });
    
    doc.save(`${query.replace(/[^a-zA-Z0-9]/g, '_')}_flashcards.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    alert('PDF export failed. Please try again.');
  }
};

  

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          previousPage();
          break;
        case 'ArrowRight':
        case ' ':
          event.preventDefault();
          if (showDetails) {
            nextPage();
          } else {
            setShowDetails(true);
          }
          break;
        case 's':
          event.preventDefault();
          speakContent();
          break;
        case 'r':
          event.preventDefault();
          resetProgress();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDetails, currentCardIndex, flashcards.length]);

  // Memoized statistics
  const stats = useMemo(() => {
    const contentStats = {
      total: flashcards.length,
      byType: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      bySection: {} as Record<string, number>
    };

    flashcards.forEach(card => {
      contentStats.byType[card.type] = (contentStats.byType[card.type] || 0) + 1;
      contentStats.byDifficulty[card.difficulty] = (contentStats.byDifficulty[card.difficulty] || 0) + 1;
      contentStats.bySection[card.section] = (contentStats.bySection[card.section] || 0) + 1;
    });

    return contentStats;
  }, [flashcards]);

  // Wait for content generation state
  if (isGeneratingContent) {
    return (
      <div className="premium-container wait-state" style={{ background: colors.gradient }}>
        <div className="wait-content">
          <Layers size={80} className="wait-icon" />
          <h3 className="wait-title" style={{ color: colors.textColor }}>
            Content Generation in Progress
          </h3>
          <p className="wait-subtitle" style={{ color: `${colors.textColor}cc` }}>
            Please wait for the content generation to complete before creating flashcards
          </p>
          <div className="wait-progress">
            <div className="wait-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="premium-container loading-state" style={{ background: colors.gradient }}>
        <div className="loading-content">
          <LoadingIndicator />
          <h3 className="loading-title" style={{ color: colors.textColor }}>
            Creating Premium Study Cards...
          </h3>
          <p className="loading-subtitle" style={{ color: `${colors.textColor}cc` }}>
            AI is analyzing your content and crafting personalized flashcards
          </p>
          <div className="loading-progress">
            <div className="loading-bar" style={{ background: colors.primary }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="premium-container error-state" style={{ background: colors.gradient }}>
        <div className="error-content">
          <ErrorMessage message={error} />
          <button onClick={generateFlashcards} className="retry-button" style={{ borderColor: colors.primary, color: colors.textColor }}>
            <RotateCcw size={20} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No content state
  if (!content || content.length < 200) {
    return (
      <div className="premium-container empty-state" style={{ background: colors.gradient }}>
        <div className="empty-content">
          <Layers size={80} className="empty-icon" style={{ color: colors.accent }} />
          <h3 className="empty-title" style={{ color: colors.textColor }}>Premium AI Study Cards</h3>
          <p className="empty-subtitle" style={{ color: `${colors.textColor}cc` }}>
            Generate rich content first to unlock AI-powered, beautifully animated flashcards
          </p>
        </div>
      </div>
    );
  }

  // No flashcards state
  if (flashcards.length === 0) {
    return (
      <div className="premium-container empty-state" style={{ background: colors.gradient }}>
        <div className="empty-content">
          <BookOpen size={80} className="empty-icon" style={{ color: colors.accent }} />
          <h3 className="empty-title" style={{ color: colors.textColor }}>No Study Cards Created</h3>
          <p className="empty-subtitle" style={{ color: `${colors.textColor}cc` }}>
            Unable to generate study cards from the provided content
          </p>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];
  const isStudied = studiedCards.has(currentCard?.id);
  const progressPercentage = ((currentCardIndex + 1) / flashcards.length) * 100;

  return (
    <div className="premium-container" style={{ background: colors.gradient }}>
      {/* Hidden audio */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgaA5jfb" type="audio/wav" />
      </audio>

      {/* Header */}
      <div className="premium-header">
        <div className="header-content">
          <h2 className="header-title" style={{ color: colors.textColor }}>
            <span className="title-icon">📚</span>
            {query}
          </h2>
          <p className="header-subtitle" style={{ color: `${colors.textColor}cc` }}>
            {flashcards.length} AI-Generated Study Cards • {studiedCards.size} Completed
          </p>
        </div>
        
        <div className="header-controls">
          <button 
            onClick={speakContent}
            className="control-button"
            style={{ 
              background: isSpeaking ? colors.primary : 'rgba(255, 255, 255, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: colors.textColor
            }}
            title="Read Aloud (S)"
          >
            {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <button 
            onClick={resetProgress}
            className="control-button"
            style={{ 
              background: 'rgba(255, 255, 255, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: colors.textColor
            }}
            title="Reset Progress (R)"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="view-mode-selector">
        <div className="mode-buttons">
          <button
            onClick={() => setViewMode('single')}
            className={`mode-button ${viewMode === 'single' ? 'active' : ''}`}
            style={{
              background: viewMode === 'single' ? colors.primary : 'rgba(255, 255, 255, 0.1)',
              borderColor: viewMode === 'single' ? colors.primary : 'rgba(255, 255, 255, 0.2)',
              color: colors.textColor
            }}
          >
            <BookOpen size={18} />
            Single
          </button>
          
          <button
            onClick={() => setViewMode('grid')}
            className={`mode-button ${viewMode === 'grid' ? 'active' : ''}`}
            style={{
              background: viewMode === 'grid' ? colors.primary : 'rgba(255, 255, 255, 0.1)',
              borderColor: viewMode === 'grid' ? colors.primary : 'rgba(255, 255, 255, 0.2)',
              color: colors.textColor
            }}
          >
            <Grid size={18} />
            Grid
          </button>
          
          <button
            onClick={() => setViewMode('list')}
            className={`mode-button ${viewMode === 'list' ? 'active' : ''}`}
            style={{
              background: viewMode === 'list' ? colors.primary : 'rgba(255, 255, 255, 0.1)',
              borderColor: viewMode === 'list' ? colors.primary : 'rgba(255, 255, 255, 0.2)',
              color: colors.textColor
            }}
          >
            <List size={18} />
            List
          </button>
        </div>
        
        <div className="export-buttons">
  <button
    onClick={exportToPDF}
    className="export-button"
    style={{
      background: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: colors.textColor
    }}
    title="Export to PDF"
  >
    <FileText size={18} />
    Export PDF
  </button>
</div>
      </div>

      {/* Progress Bar */}
      {viewMode === 'single' && (
        <div className="progress-container">
          <div 
            className="progress-bar"
            style={{ width: `${progressPercentage}%`, backgroundColor: colors.primary }}
          >
            <div className="progress-shine"></div>
          </div>
          <div className="progress-text" style={{ color: colors.textColor }}>
            {currentCardIndex + 1} of {flashcards.length}
          </div>
        </div>
      )}

      {/* Content Area */}
      {viewMode === 'single' && (
        <div className="book-container">
          <div 
            className={`book-page ${isPageTurning ? 'turning' : ''} ${showDetails ? 'showing-details' : ''}`}
            onClick={() => showDetails ? nextPage() : setShowDetails(true)}
            style={{ background: colors.cardBg, borderColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <div className="page-binding" style={{ background: colors.primary }}></div>
            
            <div className="page-content" style={{ color: colors.textColor }}>
              {!showDetails ? (
                <>
                  <div className="page-header">
                    <div 
                      className="content-type-badge"
                      style={{ 
                        backgroundColor: getDifficultyStyle(currentCard.difficulty).bg,
                        borderColor: getDifficultyStyle(currentCard.difficulty).border,
                        color: getDifficultyStyle(currentCard.difficulty).color
                      }}
                    >
                      {currentCard.type}
                    </div>
                    
                    <div 
                      className="difficulty-badge"
                      style={{
                        backgroundColor: getDifficultyStyle(currentCard.difficulty).color,
                        color: 'white'
                      }}
                    >
                      {currentCard.difficulty}
                    </div>
                  </div>

                  <div className="content-area">
                    <div className="main-text">
                      {currentCard.content}
                    </div>
                    
                    {isStudied && (
                      <div className="studied-indicator" style={{ color: colors.primary }}>
                        ✓ Studied
                      </div>
                    )}
                  </div>

                  <div className="page-footer">
                    <div className="interaction-hint" style={{ color: `${colors.textColor}99` }}>
                      Tap to see details • Arrow keys to navigate
                    </div>
                    
                    <div className="card-meta">
                      <span className="reading-time" style={{ color: `${colors.textColor}cc` }}>
                        <Clock size={14} />
                        {currentCard.readingTime}m
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="details-header">
                    <h3 className="details-title" style={{ color: colors.textColor }}>
                      Study Information
                    </h3>
                  </div>

                  <div className="details-content">
                    <div className="detail-section" style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                      <div className="detail-label" style={{ color: `${colors.textColor}cc` }}>
                        Section
                      </div>
                      <div className="detail-value" style={{ color: colors.textColor }}>
                        {currentCard.section}
                      </div>
                    </div>

                    <div className="detail-section" style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                      <div className="detail-label" style={{ color: `${colors.textColor}cc` }}>
                        Topic
                      </div>
                      <div className="detail-value" style={{ color: colors.textColor }}>
                        {currentCard.topic}
                      </div>
                    </div>

                    {currentCard.keywords && currentCard.keywords.length > 0 && (
                      <div className="detail-section" style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                        <div className="detail-label" style={{ color: `${colors.textColor}cc` }}>
                          Key Terms
                        </div>
                        <div className="keywords-list">
                          {currentCard.keywords.slice(0, 5).map((keyword, index) => (
                            <span 
                              key={index} 
                              className="keyword-tag"
                              style={{ 
                                backgroundColor: `${colors.primary}20`,
                                borderColor: `${colors.primary}40`,
                                color: colors.primary
                              }}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentCard.hint && (
                      <div className="hint-section" style={{ background: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                        <div className="detail-label" style={{ color: `${colors.textColor}cc` }}>
                          💡 Study Hint
                        </div>
                        <div className="hint-text" style={{ color: colors.textColor }}>
                          {currentCard.hint}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="details-footer">
                    <div className="interaction-hint" style={{ color: `${colors.textColor}99` }}>
                      Tap to continue reading
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid-container">
          {flashcards.map((card, index) => (
            <div
              key={card.id}
              className={`grid-card ${studiedCards.has(card.id) ? 'studied' : ''}`}
              onClick={() => goToCard(index)}
              style={{
                background: colors.cardBg,
                borderColor: studiedCards.has(card.id) ? colors.primary : 'rgba(255, 255, 255, 0.2)',
                color: colors.textColor
              }}
            >
              <div className="grid-card-header">
                <span className="card-number">#{index + 1}</span>
                <span 
                  className="difficulty-pill"
                  style={{
                    backgroundColor: getDifficultyStyle(card.difficulty).color,
                    color: 'white'
                  }}
                >
                  {card.difficulty}
                </span>
              </div>
              <div className="grid-card-content">
                {card.content.substring(0, 120)}...
              </div>
              <div className="grid-card-footer">
                <span className="card-type">{card.type}</span>
                {studiedCards.has(card.id) && <span className="studied-mark">✓</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="list-container">
          {flashcards.map((card, index) => (
            <div
              key={card.id}
              className={`list-item ${studiedCards.has(card.id) ? 'studied' : ''}`}
              onClick={() => goToCard(index)}
              style={{
                background: colors.cardBg,
                borderColor: studiedCards.has(card.id) ? colors.primary : 'rgba(255, 255, 255, 0.2)',
                color: colors.textColor
              }}
            >
              <div className="list-item-header">
                <div className="list-item-meta">
                  <span className="list-card-number">Card {index + 1}</span>
                  <span 
                    className="list-difficulty"
                    style={{ color: getDifficultyStyle(card.difficulty).color }}
                  >
                    {card.difficulty}
                  </span>
                  <span className="list-type">{card.type}</span>
                </div>
                {studiedCards.has(card.id) && (
                  <span className="list-studied-mark" style={{ color: colors.primary }}>✓ Studied</span>
                )}
              </div>
              <div className="list-item-content">
                {card.content}
              </div>
              {card.hint && (
                <div className="list-item-hint" style={{ color: `${colors.textColor}cc` }}>
                  💡 {card.hint}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Single View Navigation */}
      {viewMode === 'single' && (
        <div className="navigation-container">
          <button
            onClick={previousPage}
            disabled={currentCardIndex === 0}
            className="nav-button nav-prev"
            style={{
              backgroundColor: currentCardIndex === 0 ? 'rgba(255, 255, 255, 0.1)' : colors.primary,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              opacity: currentCardIndex === 0 ? 0.5 : 1,
              color: colors.textColor
            }}
          >
            <ArrowLeft size={20} />
            Previous
          </button>

          <div className="page-dots">
            {flashcards.map((_, index) => (
              <button
                key={index}
                onClick={() => goToCard(index)}
                className={`page-dot ${index === currentCardIndex ? 'active' : ''} ${studiedCards.has(flashcards[index].id) ? 'completed' : ''}`}
                style={{
                  backgroundColor: index === currentCardIndex ? colors.primary :
                                  studiedCards.has(flashcards[index].id) ? colors.secondary : 
                                  'rgba(255, 255, 255, 0.3)'
                }}
              />
            ))}
          </div>

          <button
            onClick={nextPage}
            disabled={currentCardIndex === flashcards.length - 1}
            className="nav-button nav-next"
            style={{
              backgroundColor: currentCardIndex === flashcards.length - 1 ? 'rgba(255, 255, 255, 0.1)' : colors.primary,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              opacity: currentCardIndex === flashcards.length - 1 ? 0.5 : 1,
              color: colors.textColor
            }}
          >
            Next
            <ArrowRight size={20} />
          </button>
        </div>
      )}

      {/* Study Stats Footer */}
      <div className="study-stats" style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
        <div className="stat-item">
          <div className="stat-number" style={{ color: colors.primary }}>
            {studiedCards.size}
          </div>
          <div className="stat-label" style={{ color: `${colors.textColor}cc` }}>
            Studied
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-number" style={{ color: colors.secondary }}>
            {Object.keys(stats.byType).length}
          </div>
          <div className="stat-label" style={{ color: `${colors.textColor}cc` }}>
            Types
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-number" style={{ color: colors.accent }}>
            {viewMode === 'single' ? Math.round(progressPercentage) : '100'}%
          </div>
          <div className="stat-label" style={{ color: `${colors.textColor}cc` }}>
            Progress
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .premium-container {
          min-height: 700px;
          border-radius: 24px;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(255, 255, 255, 0.03) 0%, transparent 50%);
          pointer-events: none;
        }

        .premium-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          z-index: 10;
          position: relative;
          background: rgba(0, 0, 0, 0.3);
          padding: 1.5rem;
          border-radius: 16px;
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-title {
          font-size: 2rem;
          font-weight: 800;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .title-icon {
          font-size: 2.5rem;
          animation: float 3s ease-in-out infinite;
        }

        .header-subtitle {
          font-size: 1.1rem;
          margin: 0.5rem 0 0 0;
          opacity: 0.9;
        }

        .header-controls {
          display: flex;
          gap: 0.75rem;
        }

        .control-button {
          padding: 0.75rem;
          border: 2px solid;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .control-button:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        }

        .view-mode-selector {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem 1.5rem;
          border-radius: 16px;
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .mode-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .mode-button {
          padding: 0.6rem 1.2rem;
          border: 2px solid;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .mode-button:hover {
          transform: translateY(-1px);
        }

        .export-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .export-button {
          padding: 0.6rem 1rem;
          border: 2px solid;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .export-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .progress-container {
          position: relative;
          height: 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          margin-bottom: 2rem;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .progress-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
        }

        .progress-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
          animation: shine 2s infinite;
        }

        .progress-text {
          position: absolute;
          right: 0;
          top: -1.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .book-container {
          perspective: 1200px;
          display: flex;
          justify-content: center;
          margin: 2rem 0;
          min-height: 500px;
          align-items: center;
        }

        .book-page {
          width: 100%;
          max-width: 600px;
          height: 450px;
          position: relative;
          cursor: pointer;
          transform-origin: left center;
          transform-style: preserve-3d;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 20px;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 2px solid;
        }

        .book-page:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .book-page.turning {
          transform: rotateY(-15deg) translateX(30px) translateZ(20px);
          box-shadow: 
            0 35px 70px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .page-binding {
          position: absolute;
          left: 0;
          top: 8%;
          bottom: 8%;
          width: 4px;
          border-radius: 2px;
          z-index: 5;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
        }

        .page-content {
          padding: 2.5rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 2;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .content-type-badge {
          padding: 0.5rem 1rem;
          border: 2px solid;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: capitalize;
          backdrop-filter: blur(10px);
        }

        .difficulty-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }

        .main-text {
          font-size: 1.6rem;
          line-height: 1.6;
          font-weight: 500;
          margin-bottom: 2rem;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .studied-indicator {
          font-size: 1.2rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          animation: slideInUp 0.5s ease-out;
        }

        .page-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .interaction-hint {
          font-size: 0.9rem;
          opacity: 0.8;
          animation: pulse 2s ease-in-out infinite;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .reading-time {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .details-header {
          margin-bottom: 2rem;
        }

        .details-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          text-align: center;
        }

        .details-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .detail-section {
          padding: 1.2rem;
          border-radius: 16px;
          backdrop-filter: blur(10px);
          border: 2px solid;
          transition: all 0.3s ease;
        }

        .detail-section:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .detail-label {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          opacity: 0.8;
        }

        .detail-value {
          font-size: 1.1rem;
          font-weight: 500;
          line-height: 1.5;
        }

        .keywords-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .keyword-tag {
          padding: 0.4rem 0.8rem;
          border: 1px solid;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .keyword-tag:hover {
          transform: translateY(-1px);
        }

        .hint-section {
          border: 2px solid;
        }

        .hint-text {
          font-style: italic;
          line-height: 1.5;
          margin-top: 0.5rem;
        }

        .details-footer {
          text-align: center;
          margin-top: auto;
        }

        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .grid-card {
          padding: 1.5rem;
          border-radius: 16px;
          border: 2px solid;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(15px);
          min-height: 180px;
          display: flex;
          flex-direction: column;
        }

        .grid-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
        }

        .grid-card.studied {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
        }

        .grid-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .card-number {
          font-weight: 700;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .difficulty-pill {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .grid-card-content {
          flex: 1;
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .grid-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .card-type {
          font-size: 0.85rem;
          opacity: 0.7;
          text-transform: capitalize;
        }

        .studied-mark {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .list-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 2rem 0;
        }

        .list-item {
          padding: 1.5rem;
          border-radius: 16px;
          border: 2px solid;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(15px);
        }

        .list-item:hover {
          transform: translateX(8px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .list-item.studied {
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
        }

        .list-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .list-item-meta {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .list-card-number {
          font-weight: 700;
          font-size: 0.9rem;
        }

        .list-difficulty {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .list-type {
          font-size: 0.85rem;
          opacity: 0.7;
          text-transform: capitalize;
        }

        .list-studied-mark {
          font-weight: 600;
        }

        .list-item-content {
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .list-item-hint {
          font-style: italic;
          font-size: 0.9rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border-left: 3px solid currentColor;
        }

        .navigation-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 2rem 0;
          gap: 2rem;
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem 1.5rem;
          border-radius: 16px;
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .nav-button {
          padding: 0.75rem 1.5rem;
          border: 2px solid;
          border-radius: 16px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 120px;
          justify-content: center;
        }

        .nav-button:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.4);
        }

        .nav-button:disabled {
          cursor: not-allowed;
          transform: none !important;
        }

        .page-dots {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
          max-width: 300px;
          overflow-x: auto;
        }

        .page-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .page-dot:hover {
          transform: scale(1.3);
        }

        .page-dot.active {
          transform: scale(1.4);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
        }

        .page-dot.completed {
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.8);
        }

        .study-stats {
          display: flex;
          justify-content: center;
          gap: 3rem;
          margin-top: 2rem;
          padding: 1.5rem;
          border-radius: 20px;
          backdrop-filter: blur(15px);
          border: 2px solid;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 0.25rem;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .stat-label {
          font-size: 0.9rem;
          font-weight: 500;
          opacity: 0.8;
        }

        /* Loading and Error States */
        .loading-state, .error-state, .empty-state, .wait-state {
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
          min-height: 500px;
        }

        .loading-content, .error-content, .empty-content, .wait-content {
          max-width: 500px;
          animation: fadeInUp 0.6s ease-out;
          padding: 2rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 20px;
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .loading-title, .empty-title, .wait-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem 0;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .loading-subtitle, .empty-subtitle, .wait-subtitle {
          font-size: 1.2rem;
          margin: 0 0 2rem 0;
          opacity: 0.9;
          line-height: 1.5;
        }

        .loading-progress, .wait-progress {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 1rem;
        }

        .loading-bar, .wait-bar {
          height: 100%;
          border-radius: 3px;
          animation: loadingBar 2s ease-in-out infinite;
        }

        .retry-button {
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid;
          border-radius: 16px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 2rem auto 0;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .retry-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .empty-icon, .wait-icon {
          opacity: 0.6;
          animation: float 3s ease-in-out infinite;
        }

        /* Animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }

        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @keyframes slideInUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @keyframes fadeInUp {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @keyframes loadingBar {
          0% { transform: translateX(-100%); background: linear-gradient(90deg, #60a5fa, #3b82f6, #2563eb); }
          50% { transform: translateX(0%); background: linear-gradient(90deg, #8b5cf6, #a855f7, #c084fc); }
          100% { transform: translateX(100%); background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .premium-container {
            padding: 1rem;
          }

          .premium-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .view-mode-selector {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .mode-buttons, .export-buttons {
            justify-content: center;
          }

          .book-page {
            width: 100%;
            height: 400px;
          }

          .page-content {
            padding: 1.5rem;
          }

          .main-text {
            font-size: 1.3rem;
          }

          .navigation-container {
            flex-direction: column;
            gap: 1rem;
          }

          .grid-container {
            grid-template-columns: 1fr;
          }

          .study-stats {
            gap: 2rem;
          }
        }

        @media (max-width: 480px) {
          .header-title {
            font-size: 1.5rem;
          }

          .book-page {
            height: 350px;
          }

          .main-text {
            font-size: 1.1rem;
          }

          .study-stats {
            flex-direction: column;
            gap: 1rem;
          }

          .mode-buttons, .export-buttons {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default FlashCardTab;
import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Share2, 
  RefreshCw,
  Lightbulb,
  Target,
  AlertTriangle,
  X
} from 'lucide-react';

interface InfographicTabProps {
  content?: string;
  query?: string;
  selectedLanguage?: string;
  isLoading?: boolean;
  error?: string | null;
  generateInfographic?: (query: string, content: string) => Promise<void>;
  // Legacy props for backward compatibility
  svgContent?: string;
  infographicError?: string | null;
  infographicLoading?: boolean;
  handleGenerateInfographic?: () => Promise<void>;
  downloadInfographicAsPDF?: () => void;
  downloadSvgDirectly?: () => void;
  // Additional props that might contain the data
  infographicData?: any;
  mindmapData?: any;
  cards?: InfoCard[];
}

interface InfoCard {
  id: number;
  title: string;
  description: string;
  detailedInfo?: string;
  keyPoints?: string[];
  examples?: string[];
  applications?: string[];
  relatedConcepts?: string[];
  importance?: string;
  icon: string;
  gradient: string;
  category: string;
  difficulty?: string;
  timeToRead?: number;
  tags?: string[];
}

const InfographicTab: React.FC<InfographicTabProps> = ({
  content = '',
  query = '',
  selectedLanguage = 'english',
  isLoading = false,
  error = null,
  generateInfographic,
  // Legacy props
  svgContent,
  infographicError,
  infographicLoading,
  handleGenerateInfographic,
  downloadInfographicAsPDF,
  downloadSvgDirectly,
  // Additional props
  infographicData,
  mindmapData,
  cards: propsCards
}) => {
  const [cards, setCards] = useState<InfoCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<InfoCard | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Use legacy props if new ones aren't provided
  const finalContent = content || '';
  const finalQuery = query || '';
  const finalLoading = isLoading || infographicLoading || false;
  const finalError = error || infographicError || null;

  // Debug logging to see what props are being passed
  useEffect(() => {
    console.log('InfographicTab Props Debug:', {
      hasContent: !!finalContent,
      contentLength: finalContent.length,
      hasQuery: !!finalQuery,
      query: finalQuery,
      hasSvgContent: !!svgContent,
      svgContentPreview: svgContent ? svgContent.substring(0, 100) + '...' : null,
      hasPropsCards: !!propsCards,
      propsCardsLength: propsCards?.length || 0,
      hasMindmapData: !!mindmapData,
      hasInfographicData: !!infographicData,
      isLoading: finalLoading,
      hasError: !!finalError
    });
  }, [finalContent, finalQuery, svgContent, propsCards, mindmapData, infographicData, finalLoading, finalError]);

  // Get the latest infographic data from multiple sources
  useEffect(() => {
    try {
      // First priority: direct props
      if (propsCards && propsCards.length > 0) {
        setCards(propsCards);
        return;
      }

      // Second priority: mindmapData prop
      if (mindmapData && mindmapData.cards) {
        setCards(mindmapData.cards);
        return;
      }

      // Third priority: infographicData prop
      if (infographicData && infographicData.cards) {
        setCards(infographicData.cards);
        return;
      }

      // Fourth priority: svgContent parsing
      if (svgContent) {
        if (svgContent.includes('mindmap')) {
          const jsonMatch = svgContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            if (data.mindmap && data.mindmap.cards) {
              setCards(data.mindmap.cards);
              return;
            }
          }
        }
      }

      // Last priority: check localStorage
      const storedData = localStorage.getItem('latestInfographicData');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.cards) {
          setCards(data.cards);
        }
      }
    } catch (err) {
      console.error('Error loading infographic data:', err);
    }
  }, [svgContent, propsCards, mindmapData, infographicData]);

  // Handle generate infographic and get data from the hook response
  const handleGenerate = async () => {
    try {
      if (generateInfographic && finalContent && finalQuery) {
        await generateInfographic(finalQuery, finalContent);
        // After generation, try to get the data from window/global scope where the hook stores it
        setTimeout(() => {
          checkForGeneratedData();
        }, 1000);
      } else if (handleGenerateInfographic) {
        await handleGenerateInfographic();
        // After generation, try to get the data from window/global scope where the hook stores it
        setTimeout(() => {
          checkForGeneratedData();
        }, 1000);
      } else {
        // Direct API call as fallback
        console.log('Making direct API call...');
        const response = await fetch('http://localhost:8080/api/mindmap/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: finalQuery,
            content: finalContent,
            language: selectedLanguage
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Direct API Response:', data);
          
          if (data.status === 'success' && data.mindmap && data.mindmap.cards) {
            setCards(data.mindmap.cards);
            console.log('Cards set from direct API:', data.mindmap.cards);
          }
        } else {
          console.error('Direct API request failed:', response.status);
        }
      }
    } catch (err) {
      console.error('Error generating infographic:', err);
    }
  };

  // Function to check for generated data in various places
  const checkForGeneratedData = () => {
    try {
      // Check if the hook has stored data globally
      if (typeof window !== 'undefined') {
        // Try to access the hook's internal state through window
        const hookData = (window as any).latestInfographicData;
        if (hookData && hookData.cards) {
          console.log('Found data in window.latestInfographicData:', hookData.cards);
          setCards(hookData.cards);
          return;
        }

        // Try to access svgContent from window
        const svgData = (window as any).latestSvgContent;
        if (svgData) {
          console.log('Found svgContent in window:', svgData.substring(0, 100));
          // Process svgContent here if needed
          return;
        }
      }

      // Check localStorage as backup
      const storedData = localStorage.getItem('latestInfographicData');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.cards) {
          console.log('Found data in localStorage:', data.cards);
          setCards(data.cards);
        }
      }
    } catch (err) {
      console.error('Error checking for generated data:', err);
    }
  };

  // Function to get difficulty color
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Function to open card details
  const openCardDetails = (card: InfoCard) => {
    setSelectedCard(card);
    setShowDetailModal(true);
  };

  // Function to close card details
  const closeCardDetails = () => {
    setSelectedCard(null);
    setShowDetailModal(false);
  };

  // Export functionality
  const exportAsImage = () => {
    if (downloadInfographicAsPDF) {
      downloadInfographicAsPDF();
    } else {
      console.log('Exporting infographic...');
    }
  };

  const shareInfographic = () => {
    if (downloadSvgDirectly) {
      downloadSvgDirectly();
    } else {
      console.log('Sharing infographic...');
    }
  };

  // Loading state
  if (finalLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#6B7280'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #E5E7EB',
          borderTop: '3px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <p>Creating beautiful infographic cards...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (finalError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#EF4444',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <AlertTriangle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Unable to Create Infographic</h3>
        <p style={{ color: '#6B7280', marginBottom: '1rem' }}>{finalError}</p>
        <button
          onClick={handleGenerate}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // No content state
  if (!finalContent || finalContent.length < 50) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#6B7280',
        textAlign: 'center'
      }}>
        <Lightbulb size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h3 style={{ marginBottom: '0.5rem' }}>No Content Available</h3>
        <p>Start a research query to generate visual insights</p>
        {finalQuery && (
          <button
            onClick={handleGenerate}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Generate Infographic for "{finalQuery}"
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      padding: '1.5rem',
      height: '100%',
      overflow: 'auto',
      backgroundColor: '#F8FAFC'
    }}>
      {/* Header with Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#1F2937', fontSize: '1.5rem' }}>
            Visual Insights: {finalQuery}
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
            Card-based infographic from research content ({finalContent.length} characters)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={exportAsImage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={shareInfographic}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <Share2 size={16} />
            Share
          </button>
          <button
            onClick={handleGenerate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <RefreshCw size={16} />
            Generate Cards
          </button>
        </div>
      </div>

      {/* Display Cards or SVG Content */}
      <div style={{
        marginBottom: '2rem'
      }}>
        {svgContent ? (
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : cards.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => openCardDetails(card)}
                style={{
                  background: card.gradient,
                  borderRadius: '20px',
                  padding: '1.5rem',
                  color: 'white',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                }}
              >
                {/* Difficulty Badge */}
                {card.difficulty && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '0.25rem 0.75rem',
                    background: getDifficultyColor(card.difficulty),
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {card.difficulty}
                  </div>
                )}

                {/* Icon */}
                <div style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  fontSize: '20px'
                }}>
                  {card.icon}
                </div>

                {/* Content */}
                <div>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    margin: '0 0 0.75rem 0',
                    lineHeight: '1.3'
                  }}>
                    {card.title}
                  </h3>
                  
                  <p style={{
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    opacity: '0.9',
                    margin: '0 0 0.75rem 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {card.description}
                  </p>

                  {/* Tags */}
                  {card.tags && card.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: '0.25rem',
                      flexWrap: 'wrap',
                      marginBottom: '0.5rem'
                    }}>
                      {card.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            fontSize: '0.6rem',
                            padding: '0.2rem 0.5rem',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            fontWeight: '500'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Info */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.7rem',
                    opacity: '0.8'
                  }}>
                    <span>{card.category}</span>
                    {card.timeToRead && (
                      <span>{card.timeToRead} min read</span>
                    )}
                  </div>
                </div>

                {/* Click indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  right: '0.5rem',
                  fontSize: '0.8rem',
                  opacity: '0.6'
                }}>
                  Click for details â†’
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Target size={48} style={{ color: '#6B7280', marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ color: '#6B7280', marginBottom: '1rem' }}>No Infographic Generated</h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Click "Generate Cards" to create a card-based infographic from your content.
            </p>
            <button
              onClick={handleGenerate}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Generate Cards
            </button>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div style={{
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        textAlign: 'center',
        color: '#6B7280',
        fontSize: '0.9rem'
      }}>
        {svgContent || cards.length > 0 ? (
          `Generated ${cards.length || 'card-based'} infographic from ${Math.round(finalContent.length / 1000)}k characters â€¢ ${selectedLanguage}`
        ) : (
          'Ready to generate card-based infographic'
        )}
      </div>

      {/* Detailed Card Modal */}
      {showDetailModal && selectedCard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}
        onClick={closeCardDetails}
        >
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeCardDetails}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6B7280'
              }}
            >
              <X size={24} />
            </button>

            {/* Card Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: selectedCard.gradient,
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: 'white'
              }}>
                {selectedCard.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '2rem',
                  color: '#1F2937'
                }}>
                  {selectedCard.title}
                </h2>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: getDifficultyColor(selectedCard.difficulty),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {selectedCard.difficulty || 'Intermediate'}
                  </span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: '#F3F4F6',
                    color: '#374151',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {selectedCard.category}
                  </span>
                  {selectedCard.timeToRead && (
                    <span style={{
                      fontSize: '0.9rem',
                      color: '#6B7280'
                    }}>
                      ðŸ“– {selectedCard.timeToRead} min read
                    </span>
                  )}
                </div>
                {selectedCard.tags && selectedCard.tags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {selectedCard.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.25rem 0.5rem',
                          background: '#E5E7EB',
                          color: '#374151',
                          borderRadius: '8px',
                          fontWeight: '500'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card Content */}
            <div style={{
              display: 'grid',
              gap: '2rem'
            }}>
              {/* Description */}
              <div>
                <h3 style={{
                  fontSize: '1.2rem',
                  color: '#1F2937',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ðŸ“ Overview
                </h3>
                <p style={{
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: '#374151',
                  margin: 0
                }}>
                  {selectedCard.description}
                </p>
              </div>

              {/* Detailed Information */}
              {selectedCard.detailedInfo && (
                <div>
                  <h3 style={{
                    fontSize: '1.2rem',
                    color: '#1F2937',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ðŸ” Detailed Information
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    color: '#374151',
                    margin: 0
                  }}>
                    {selectedCard.detailedInfo}
                  </p>
                </div>
              )}

              {/* Key Points */}
              {selectedCard.keyPoints && selectedCard.keyPoints.length > 0 && (
                <div>
                  <h3 style={{
                    fontSize: '1.2rem',
                    color: '#1F2937',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    âœ¨ Key Points
                  </h3>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '1.5rem',
                    color: '#374151'
                  }}>
                    {selectedCard.keyPoints.map((point, index) => (
                      <li key={index} style={{
                        marginBottom: '0.5rem',
                        lineHeight: '1.5'
                      }}>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Examples and Applications */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
              }}>
                {/* Examples */}
                {selectedCard.examples && selectedCard.examples.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: '1.2rem',
                      color: '#1F2937',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      ðŸ’¡ Examples
                    </h3>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '1.5rem',
                      color: '#374151'
                    }}>
                      {selectedCard.examples.map((example, index) => (
                        <li key={index} style={{
                          marginBottom: '0.5rem',
                          lineHeight: '1.5'
                        }}>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Applications */}
                {selectedCard.applications && selectedCard.applications.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: '1.2rem',
                      color: '#1F2937',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      ðŸš€ Applications
                    </h3>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '1.5rem',
                      color: '#374151'
                    }}>
                      {selectedCard.applications.map((app, index) => (
                        <li key={index} style={{
                          marginBottom: '0.5rem',
                          lineHeight: '1.5'
                        }}>
                          {app}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Related Concepts */}
              {selectedCard.relatedConcepts && selectedCard.relatedConcepts.length > 0 && (
                <div>
                  <h3 style={{
                    fontSize: '1.2rem',
                    color: '#1F2937',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ðŸ”— Related Concepts
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {selectedCard.relatedConcepts.map((concept, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Importance */}
              {selectedCard.importance && (
                <div>
                  <h3 style={{
                    fontSize: '1.2rem',
                    color: '#1F2937',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    â­ Why This Matters
                  </h3>
                  <div style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                    borderRadius: '12px',
                    borderLeft: '4px solid #F59E0B'
                  }}>
                    <p style={{
                      fontSize: '1rem',
                      lineHeight: '1.6',
                      color: '#92400E',
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      {selectedCard.importance}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#6B7280'
              }}>
                Card {selectedCard.id} â€¢ {selectedCard.category} â€¢ {selectedCard.difficulty || 'Intermediate'}
              </div>
              <button
                onClick={closeCardDetails}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfographicTab;
import React, { useState, useCallback, useRef } from 'react';
import { Brain, Search, Languages, BookOpen, Target, Layers, Youtube, FileText, Loader2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import ErrorMessage from './ErrorMessage';
import Quiz from './quiz/Quiz';
import FlashCardTab from './FlashCardTab';

const AITutor: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [query, setQuery] = useState('');
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');

  // Content ref (no auto-scroll)
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Typewriter delay queue
  const typewriterQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);

  // Process typewriter queue with delay
  const processTypewriterQueue = useCallback(() => {
    if (isProcessingQueueRef.current || typewriterQueueRef.current.length === 0) {
      return;
    }
    
    isProcessingQueueRef.current = true;
    
    const processNext = () => {
      if (typewriterQueueRef.current.length > 0) {
        const nextChunk = typewriterQueueRef.current.shift()!;
        setStreamingContent(prev => prev + nextChunk);
        
        setTimeout(processNext, 10);
      } else {
        isProcessingQueueRef.current = false;
      }
    };
    
    processNext();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setStreamingContent('');
    typewriterQueueRef.current = [];
    isProcessingQueueRef.current = false;
    
    try {
      const response = await fetch('https://prepnx-backend.vercel.app/api/research/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'a1b2c3d4e5f6g7h8i9j0'
        },
        body: JSON.stringify({
          query: query.trim(),
          language: selectedLanguage,
          query_type: 'educational'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      setIsLoading(false);
      setIsStreaming(true);
      setSearchCompleted(true);
      setActiveTab('search');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (jsonStr) {
                  const data = JSON.parse(jsonStr);
                  
                  if (data.type === 'content') {
                    typewriterQueueRef.current.push(data.chunk);
                    processTypewriterQueue();
                  }
                  else if (data.type === 'complete' || data.type === 'completion') {
                    if (data.final_content) {
                      setStreamingContent(data.final_content);
                    }
                    if (data.chunk && !data.final_content) {
                      typewriterQueueRef.current.push(data.chunk);
                      processTypewriterQueue();
                    }
                    setIsStreaming(false);
                  }
                  else if (data.type === 'error') {
                    throw new Error(data.message || data.error);
                  }
                }
              } catch (parseError) {
                console.warn('Parse error:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        setIsStreaming(false);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [query, selectedLanguage, processTypewriterQueue]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatContent = (text: string) => {
    if (!text) return <div style={{ color: '#6B7280', fontStyle: 'italic' }}>Waiting for content...</div>;

    const sections = text.split(/\n\n|\n/).filter(line => line.trim());
    
    return sections.map((section, idx) => {
      const trimmed = section.trim();
      if (!trimmed) return null;
      
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} style={{
            color: '#FFD700',
            fontSize: '2rem',
            fontWeight: '700',
            marginTop: '2rem',
            marginBottom: '1rem',
            borderBottom: '2px solid #FFD700',
            paddingBottom: '0.5rem'
          }}>
            {trimmed.substring(2)}
          </h1>
        );
      }
      
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} style={{
            color: '#3B82F6',
            fontSize: '1.5rem',
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.75rem',
            borderLeft: '4px solid #3B82F6',
            paddingLeft: '1rem'
          }}>
            {trimmed.substring(3)}
          </h2>
        );
      }
      
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} style={{
            color: '#8B5CF6',
            fontSize: '1.2rem',
            fontWeight: '600',
            marginTop: '1rem',
            marginBottom: '0.5rem'
          }}>
            {trimmed.substring(4)}
          </h3>
        );
      }
      
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        return (
          <div key={idx} style={{
            color: '#EDEDED',
            marginBottom: '0.5rem',
            paddingLeft: '1.5rem',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              left: '0',
              color: '#F59E0B',
              fontWeight: 'bold'
            }}>•</span>
            {trimmed.substring(2)}
          </div>
        );
      }
      
      return (
        <p key={idx} style={{
          color: '#EDEDED',
          marginBottom: '1rem',
          lineHeight: '1.7',
          textAlign: 'justify'
        }}>
          {trimmed}
        </p>
      );
    });
  };

  const generateQuizFromContent = () => {
    if (streamingContent && query) {
      setActiveTab('quiz');
    }
  };

  const tabs = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'quiz', label: 'Quiz', icon: Target },
    { id: 'flashcards', label: 'FlashCards', icon: Layers },
    { id: 'infographic', label: 'Infographic', icon: BookOpen },
    { id: 'youtube', label: 'YouTube', icon: Youtube }
  ];

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      minHeight: '600px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <Brain size={32} style={{ color: '#FFD700' }} />
        <div>
          <h2 style={{
            color: '#FFD700',
            fontSize: '1.8rem',
            fontWeight: '700',
            margin: 0
          }}>
            AI Tutor
          </h2>
          <p style={{
            color: '#B19CD9',
            fontSize: '1rem',
            margin: 0
          }}>
            Smart learning with search, quiz, and more
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <Languages size={20} style={{ color: '#B19CD9' }} />
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#EDEDED',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            width: '300px'
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} style={{ background: '#2E1A47' }}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: searchCompleted ? '2rem' : '3rem'
      }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter any topic (e.g. Photosynthesis, Machine Learning...)"
          style={{
            flex: 1,
            padding: '1rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '0.75rem',
            color: '#EDEDED',
            fontSize: '1.1rem'
          }}
          disabled={isLoading || isStreaming}
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || isLoading || isStreaming}
          style={{
            padding: '1rem 2rem',
            background: query.trim() && !isLoading && !isStreaming
              ? 'linear-gradient(45deg, #FFD700, #B19CD9)'
              : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '0.75rem',
            color: query.trim() && !isLoading && !isStreaming ? '#2E1A47' : '#B19CD9',
            cursor: query.trim() && !isLoading && !isStreaming ? 'pointer' : 'not-allowed',
            fontSize: '1.1rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minWidth: '120px',
            justifyContent: 'center'
          }}
        >
          {isLoading || isStreaming ? (
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Search size={20} />
          )}
          {isLoading ? 'Connecting...' : isStreaming ? 'Live...' : 'Search'}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '2rem' }}>
          <ErrorMessage message={error} onRetry={handleSearch} />
        </div>
      )}

      {isLoading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '8px solid rgba(177, 156, 217, 0.2)',
            borderLeft: '8px solid #B19CD9',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1.5rem'
          }} />
          <h3 style={{ color: '#FFD700', marginBottom: '1rem', fontSize: '1.3rem' }}>
            Connecting to AI Engine...
          </h3>
          <p style={{ color: '#B19CD9', maxWidth: '400px', lineHeight: '1.5' }}>
            Preparing to stream live content about "{query}"
          </p>
        </div>
      )}

      {searchCompleted && (
        <>
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem',
            padding: '0.5rem',
            marginBottom: '2rem',
            gap: '0.25rem',
            flexWrap: 'wrap'
          }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isActive 
                      ? 'linear-gradient(45deg, #FFD700, #B19CD9)'
                      : 'transparent',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: isActive ? '#2E1A47' : '#EDEDED',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 215, 0, 0.1)',
            padding: '2rem',
            minHeight: '400px'
          }}>
            {activeTab === 'search' && (
              <div>
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: isStreaming 
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${isStreaming 
                    ? 'rgba(59, 130, 246, 0.3)' 
                    : 'rgba(16, 185, 129, 0.3)'}`,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ 
                      color: isStreaming ? '#3B82F6' : '#10B981', 
                      fontWeight: '600' 
                    }}>
                      📊 {streamingContent.split(' ').filter(w => w.trim()).length} words
                    </span>
                    <span style={{ color: '#F59E0B', fontWeight: '600' }}>
                      🎯 {query}
                    </span>
                  </div>
                  
                  {!isStreaming && streamingContent && (
                    <button
                      onClick={generateQuizFromContent}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(45deg, #10B981, #34D399)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#2E1A47',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Target size={16} />
                      Generate Quiz
                    </button>
                  )}
                  
                  {isStreaming && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(59, 130, 246, 0.3)',
                        borderTop: '2px solid #3B82F6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span style={{ color: '#3B82F6', fontWeight: '600', fontSize: '0.9rem' }}>
                        Live Streaming
                      </span>
                    </div>
                  )}
                </div>

                <div 
                  ref={contentRef}
                  style={{
                    background: '#1a1a2e',
                    borderRadius: '0.5rem',
                    padding: '2rem',
                    height: '60vh',
                    overflowY: 'auto',
                    border: '1px solid rgba(255, 215, 0, 0.2)'
                  }}
                >
                  {formatContent(streamingContent)}
                  
                  {isStreaming && streamingContent && (
                    <span style={{
                      display: 'inline-block',
                      width: '3px',
                      height: '1.2em',
                      background: '#FFD700',
                      animation: 'blink 1s infinite',
                      marginLeft: '3px'
                    }} />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'quiz' && (
              <Quiz 
                initialTopic={query}
              />
            )}

            {activeTab === 'flashcards' && (
              <FlashCardTab 
                query={query}
                content={streamingContent} 
                selectedLanguage={selectedLanguage}
              />
            )}

            {(activeTab === 'infographic' || activeTab === 'youtube') && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ color: '#EDEDED', marginBottom: '1rem' }}>Coming Soon</h3>
                <p>{activeTab} features will be available here</p>
              </div>
            )}
          </div>
        </>
      )}

      {!searchCompleted && !isLoading && !error && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#B19CD9'
        }}>
          <Brain size={80} style={{ marginBottom: '2rem', opacity: 0.5 }} />
          <h3 style={{ 
            color: '#FFD700', 
            fontSize: '1.5rem', 
            marginBottom: '1rem' 
          }}>
            AI Research & Quiz Platform
          </h3>
          <p style={{ 
            fontSize: '1.1rem', 
            lineHeight: '1.6', 
            maxWidth: '600px', 
            margin: '0 auto 2rem',
            opacity: 0.8 
          }}>
            Search any topic, get AI-generated content, then test your knowledge with smart quizzes and flashcards!
          </p>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default AITutor;
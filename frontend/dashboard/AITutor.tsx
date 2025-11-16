import React, { useState } from 'react';
import { Brain, MessageSquare, Send, Mic, Camera, Upload } from 'lucide-react';

interface AITutorProps {
  selectedLanguage: string;
  isAuthenticated?: boolean;
}

const AITutor: React.FC<AITutorProps> = ({ selectedLanguage, isAuthenticated = false }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        role: 'assistant' as const,
        content: 'AI Tutor is coming soon! This feature will provide personalized learning assistance.'
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a237e 0%, #0d1b2a 100%)',
      padding: '2rem',
      color: '#fff',
      fontFamily: "'Montserrat', sans-serif"
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Brain size={32} color="#ffd700" />
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>AI Tutor</h1>
          </div>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)' }}>
            Your personal AI learning assistant for exam preparation
          </p>
        </div>

        {/* Chat Container */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          height: '60vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem'
          }}>
            {messages.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center'
              }}>
                <div>
                  <MessageSquare size={48} style={{ margin: '0 auto 1rem' }} />
                  <p>Start a conversation with your AI Tutor</p>
                  <p style={{ fontSize: '0.9rem' }}>Ask questions, request explanations, or get study help</p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #ffd700, #ffed4e)'
                      : 'rgba(255, 255, 255, 0.1)',
                    color: msg.role === 'user' ? '#1a237e' : '#fff',
                    padding: '1rem',
                    borderRadius: '1rem',
                    maxWidth: '70%'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '1rem',
                  borderRadius: '1rem'
                }}>
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1rem'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}>
              <button style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffd700',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Camera size={20} />
              </button>
              <button style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffd700',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Upload size={20} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask anything..."
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  color: '#fff',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                style={{
                  background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                  border: 'none',
                  color: '#1a237e',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: input.trim() && !isLoading ? 1 : 0.5
                }}
              >
                <Send size={20} />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITutor;

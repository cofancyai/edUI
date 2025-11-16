import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import Vapi from '@vapi-ai/web';

interface VapiUPSCInterviewProps {
  selectedLanguage?: string;
}

interface CallState {
  status: 'idle' | 'connecting' | 'connected' | 'ended' | 'error';
  duration: number;
  isMuted: boolean;
}

interface ConversationEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const VapiUPSCInterview: React.FC<VapiUPSCInterviewProps> = ({ selectedLanguage = 'english' }) => {
  const [callState, setCallState] = useState<CallState>({ status: 'idle', duration: 0, isMuted: false });
  const [transcript, setTranscript] = useState<ConversationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const assistantId = '5dec57f1-b3c7-43de-a527-2751b11f4ceb';
  const vapiRef = useRef<Vapi | null>(null);

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.status === 'connected') {
      interval = setInterval(() => {
        setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.status]);

  // Fetch API key from Supabase
  useEffect(() => {
    const getApiKey = async () => {
      try {
        console.log('ðŸ”„ Fetching Vapi API key...');
        const { data, error } = await supabase
          .from('credentials')
          .select('config')
          .eq('name', 'VAPI_AI_API_KEY')
          .single();

        if (error || !data?.config?.key) {
          throw new Error(error?.message || 'Vapi API key not found');
        }

        const vapiKey = data.config.key;
        if (typeof vapiKey !== 'string' || !vapiKey) {
          throw new Error('Invalid API key format');
        }

        setApiKey(vapiKey);
        console.log('âœ… API key retrieved');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error fetching API key';
        console.error('âŒ API key error:', message);
        setError(`Failed to initialize: ${message}. Check Supabase.`);
      }
    };

    getApiKey();
  }, []);

  // Initialize Vapi instance
  useEffect(() => {
    if (apiKey && !vapiRef.current) {
      try {
        vapiRef.current = new Vapi(apiKey);
        console.log('âœ… Vapi instance created');

        vapiRef.current.on('call-start', () => {
          console.log('ðŸ“ž Call started');
          setCallState(prev => ({ ...prev, status: 'connected', duration: 0 }));
          addConversationEntry('assistant', 'Welcome to your UPSC mock interview. Please share your educational background and motivation for pursuing civil services.');
        });

        vapiRef.current.on('call-end', () => {
          console.log('ðŸ“ž Call ended');
          setCallState(prev => ({ ...prev, status: 'ended' }));
          addConversationEntry('assistant', 'Thank you for the interview. Good luck with your UPSC preparation!');
        });

        vapiRef.current.on('message', (message: { type: string; transcript?: { role: 'user' | 'assistant'; content: string } }) => {
          console.log('ðŸ’¬ Message:', message);
          if (message.type === 'transcript' && message.transcript?.content) {
            addConversationEntry(message.transcript.role, message.transcript.content);
          }
        });

        vapiRef.current.on('error', (e: Error) => {
          console.error('âŒ Vapi error:', e.message);
          setError(`Voice error: ${e.message}. Check microphone or Vapi Dashboard.`);
          setCallState(prev => ({ ...prev, status: 'error' }));
        });

        vapiRef.current.on('speech-start', () => console.log('ðŸŽ™ï¸ Speech started'));
        vapiRef.current.on('speech-end', () => console.log('ðŸŽ™ï¸ Speech ended'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error initializing Vapi';
        console.error('âŒ Vapi init error:', message);
        setError(`Failed to initialize Vapi: ${message}. Check API key.`);
      }
    }

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
        console.log('ðŸ§¹ Vapi cleaned up');
      }
    };
  }, [apiKey]);

  // Add conversation entry
  const addConversationEntry = useCallback((role: 'user' | 'assistant', text: string) => {
    const entry: ConversationEntry = {
      id: `${role}_${Date.now()}`,
      role,
      text,
      timestamp: new Date(),
    };
    setTranscript(prev => [...prev, entry]);
  }, []);

  // Start interview
  const startInterview = useCallback(async () => {
  if (!apiKey || !vapiRef.current) {
    setError('API key or Vapi not ready. Check Supabase or reload.');
    return;
  }

  try {
    setIsLoading(true);
    setError(null);
    setCallState(prev => ({ ...prev, status: 'connecting' }));
    console.log('ðŸš€ Starting interview...');

    await vapiRef.current.start(assistantId);
    console.log('âœ… Interview started');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error starting interview';
    console.error('âŒ Start error:', message);
    setError(`Failed to start: ${message}. Check Vapi Dashboard or microphone.`);
    setCallState(prev => ({ ...prev, status: 'error' }));
  } finally {
    setIsLoading(false);
  }
}, [apiKey, assistantId]);

  // End interview
  const endInterview = useCallback(() => {
    try {
      console.log('ðŸ›‘ Ending interview...');
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
      setCallState(prev => ({ ...prev, status: 'ended' }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error ending interview';
      console.error('âŒ End error:', message);
      setError(`Failed to end: ${message}`);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    try {
      const newMutedState = !callState.isMuted;
      if (vapiRef.current) {
        vapiRef.current.setMuted(newMutedState);
      }
      setCallState(prev => ({ ...prev, isMuted: newMutedState }));
      console.log('ðŸ”‡ Mute toggled:', newMutedState);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error toggling mute';
      console.error('âŒ Mute error:', message);
      setError(`Failed to mute: ${message}`);
    }
  }, [callState.isMuted]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color
  const getStatusColor = () => {
    switch (callState.status) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'ended': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '20px', background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>UPSC Mock Interview</h2>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', background: '#ef4444', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
            <AlertCircle style={{ width: '20px', height: '20px', marginRight: '10px' }} />
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              Ã—
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Controls */}
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: getStatusColor(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              {callState.status === 'connected' ? (
                <Mic style={{ width: '40px', height: '40px' }} />
              ) : callState.status === 'connecting' ? (
                <Loader style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
              ) : callState.status === 'error' ? (
                <AlertCircle style={{ width: '40px', height: '40px' }} />
              ) : (
                <MicOff style={{ width: '40px', height: '40px' }} />
              )}
            </div>

            <p style={{ marginBottom: '20px' }}>
              {callState.status === 'idle' && 'Ready to start'}
              {callState.status === 'connecting' && 'Connecting...'}
              {callState.status === 'connected' && `Interview in progress (${formatDuration(callState.duration)})`}
              {callState.status === 'ended' && 'Interview ended'}
              {callState.status === 'error' && 'Error occurred'}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {callState.status !== 'connected' && callState.status !== 'connecting' ? (
                <button
                  onClick={startInterview}
                  disabled={isLoading || !apiKey}
                  style={{
                    padding: '10px 20px',
                    background: isLoading || !apiKey ? '#6b7280' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isLoading || !apiKey ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {isLoading ? (
                    <Loader style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Phone style={{ width: '20px', height: '20px' }} />
                  )}
                  Start
                </button>
              ) : (
                <button
                  onClick={endInterview}
                  style={{
                    padding: '10px 20px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <PhoneOff style={{ width: '20px', height: '20px' }} />
                  End
                </button>
              )}

              {callState.status === 'connected' && (
                <button
                  onClick={toggleMute}
                  style={{
                    padding: '10px',
                    background: callState.isMuted ? '#ef4444' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  {callState.isMuted ? (
                    <VolumeX style={{ width: '20px', height: '20px' }} />
                  ) : (
                    <Volume2 style={{ width: '20px', height: '20px' }} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Transcript */}
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
            <h3 style={{ marginBottom: '20px' }}>Transcript</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {transcript.length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center' }}>No conversation yet</p>
              ) : (
                transcript.map(entry => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      flexDirection: entry.role === 'assistant' ? 'row' : 'row-reverse',
                      gap: '10px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{
                      padding: '10px',
                      background: entry.role === 'assistant' ? '#a855f7' : '#10b981',
                      borderRadius: '5px',
                      maxWidth: '80%',
                    }}>
                      <p style={{ margin: 0 }}>{entry.text}</p>
                      <span style={{ fontSize: '0.8rem', color: '#d1d5db' }}>
                        {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VapiUPSCInterview;
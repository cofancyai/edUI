import React, { useState, useRef } from 'react';
import { Upload, Camera, FileText, Award, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';

interface AnswerEvaluationProps {
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

interface EvaluationResult {
  extracted_text: string;
  scores: {
    content_accuracy: number;
    structure: number;
    relevance: number;
    overall: number;
  };
  strengths: string[];
  improvements: string[];
  detailed_feedback: string;
  grade: string;
}

const AnswerEvaluation: React.FC<AnswerEvaluationProps> = ({
  selectedLanguage = 'english',
  isAuthenticated = false
}) => {
  const [mode, setMode] = useState<'upload' | 'result'>('upload');
  const [question, setQuestion] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_BASE = 'https://prepnx-backend.vercel.app/api/answer-evaluation';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedFile || !question.trim()) {
      setError('Please provide both question and answer image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('studentPhone') || 'anonymous';

      const formData = new FormData();
      formData.append('answer_image', selectedFile);
      formData.append('question', question);
      formData.append('user_id', userId);
      formData.append('subject', 'General');

      const response = await fetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setMode('result');
      } else {
        setError(data.message || 'Failed to evaluate answer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate answer');
    } finally {
      setLoading(false);
    }
  };

  const resetEvaluation = () => {
    setMode('upload');
    setQuestion('');
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError(null);
  };

  if (mode === 'upload') {
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
          paddingBottom: '1.5rem',
          borderBottom: '2px solid rgba(255, 215, 0, 0.2)'
        }}>
          <Award size={40} style={{ color: '#FFD700' }} />
          <div>
            <h2 style={{
              color: '#FFD700',
              fontSize: '2rem',
              fontWeight: '700',
              margin: 0,
              marginBottom: '0.5rem',
              background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Answer Evaluation
            </h2>
            <p style={{
              color: '#B19CD9',
              fontSize: '1.05rem',
              margin: 0
            }}>
              AI-powered evaluation of handwritten answers with detailed feedback
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            color: '#FFD700',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '0.75rem'
          }}>
            Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter the question you answered..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: '0.75rem',
              color: '#EDEDED',
              fontSize: '1rem',
              lineHeight: '1.6',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            color: '#FFD700',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '0.75rem'
          }}>
            Upload Answer (Handwritten/Typed Image)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(255, 215, 0, 0.3)',
              borderRadius: '0.75rem',
              padding: '3rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: previewUrl ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
              e.currentTarget.style.background = previewUrl ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)';
            }}
          >
            {previewUrl ? (
              <div>
                <img
                  src={previewUrl}
                  alt="Answer preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                  }}
                />
                <p style={{
                  color: '#10B981',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle size={20} />
                  {selectedFile?.name}
                </p>
                <p style={{
                  color: '#B19CD9',
                  fontSize: '0.9rem',
                  marginTop: '0.5rem'
                }}>
                  Click to change image
                </p>
              </div>
            ) : (
              <div>
                <Upload size={48} style={{ color: '#FFD700', margin: '0 auto 1rem' }} />
                <p style={{
                  color: '#EDEDED',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Click to upload answer image
                </p>
                <p style={{
                  color: '#B19CD9',
                  fontSize: '0.9rem'
                }}>
                  Supports JPG, PNG (Max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

        <button
          onClick={handleEvaluate}
          disabled={!selectedFile || !question.trim() || loading}
          style={{
            width: '100%',
            padding: '1.25rem',
            background: selectedFile && question.trim()
              ? 'linear-gradient(45deg, #FFD700, #B19CD9)'
              : 'rgba(255, 255, 255, 0.1)',
            color: selectedFile && question.trim() ? '#2E1A47' : '#EDEDED',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: selectedFile && question.trim() ? 'pointer' : 'not-allowed',
            fontWeight: '700',
            fontSize: '1.1rem',
            opacity: selectedFile && question.trim() ? 1 : 0.5
          }}
        >
          {loading ? 'Evaluating...' : 'Evaluate Answer'}
        </button>
      </div>
    );
  }

  if (mode === 'result' && result) {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minHeight: '600px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Award size={40} style={{ color: '#2E1A47' }} />
          </div>

          <h2 style={{
            color: '#FFD700',
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '0.5rem'
          }}>
            Evaluation Result
          </h2>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: '700',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            {result.scores.overall}/10
          </div>
          <p style={{
            color: '#B19CD9',
            fontSize: '1.2rem',
            fontWeight: '600',
            margin: 0
          }}>
            Grade: {result.grade}
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          <h3 style={{
            color: '#FFD700',
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Detailed Scores
          </h3>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Object.entries(result.scores).filter(([key]) => key !== 'overall').map(([key, value]) => (
              <div key={key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  color: '#EDEDED',
                  fontSize: '0.95rem',
                  textTransform: 'capitalize'
                }}>
                  {key.replace(/_/g, ' ')}
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '100px',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(value / 10) * 100}%`,
                      height: '100%',
                      background: value >= 7 ? '#10B981' : value >= 5 ? '#F59E0B' : '#EF4444'
                    }} />
                  </div>
                  <span style={{
                    color: '#FFD700',
                    fontWeight: '600',
                    minWidth: '40px',
                    textAlign: 'right'
                  }}>
                    {value}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {result.strengths.length > 0 && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1rem',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <h3 style={{
              color: '#10B981',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle size={20} />
              Strengths
            </h3>
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              color: '#EDEDED',
              lineHeight: '1.8'
            }}>
              {result.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {result.improvements.length > 0 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <h3 style={{
              color: '#F59E0B',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <XCircle size={20} />
              Areas for Improvement
            </h3>
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              color: '#EDEDED',
              lineHeight: '1.8'
            }}>
              {result.improvements.map((improvement, index) => (
                <li key={index}>{improvement}</li>
              ))}
            </ul>
          </div>
        )}

        {result.detailed_feedback && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 215, 0, 0.1)'
          }}>
            <h3 style={{
              color: '#FFD700',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              Detailed Feedback
            </h3>
            <p style={{
              color: '#B19CD9',
              fontSize: '0.95rem',
              lineHeight: '1.7',
              margin: 0
            }}>
              {result.detailed_feedback}
            </p>
          </div>
        )}

        {result.extracted_text && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 215, 0, 0.1)'
          }}>
            <h3 style={{
              color: '#FFD700',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              Extracted Text
            </h3>
            <p style={{
              color: '#EDEDED',
              fontSize: '0.95rem',
              lineHeight: '1.7',
              margin: 0,
              whiteSpace: 'pre-wrap'
            }}>
              {result.extracted_text}
            </p>
          </div>
        )}

        <button
          onClick={resetEvaluation}
          style={{
            width: '100%',
            padding: '1.25rem',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            color: '#2E1A47',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '1.1rem'
          }}
        >
          Evaluate Another Answer
        </button>
      </div>
    );
  }

  return null;
};

export default AnswerEvaluation;

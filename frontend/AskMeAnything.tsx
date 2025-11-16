import React, { useState, useRef } from 'react';
import { ArrowLeft, Send, Upload, Type, Camera } from 'lucide-react';
import { supabase } from '../../../utils/supabaseClient';

interface AskMeAnythingProps {
  selectedLanguage: string;
  onBack: () => void;
}

const AskMeAnything: React.FC<AskMeAnythingProps> = ({
  selectedLanguage,
  onBack
}) => {
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [question, setQuestion] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get OpenRouter API key from Supabase
  const getApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('credentials')
        .select('config')
        .eq('name', 'VITE_OPENROUTER_API_KEY')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data.config.key;
    } catch (error) {
      console.error('Error getting API key:', error);
      throw new Error('API key not found');
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload JPG, PNG, HEIC, or PDF files only');
      return;
    }

    setUploadedFile(file);
    setError(null);
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
    });
  };

  // Generate AI solution
  const generateSolution = async () => {
    if (!question.trim() && !uploadedFile) {
      setError('Please enter a question or upload an image');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSolution(null);

    try {
      const apiKey = await getApiKey();
      
      let questionText = question.trim();
      let imageData = null;

      if (inputMode === 'image' && uploadedFile) {
        if (uploadedFile.type.startsWith('image/')) {
          imageData = await fileToBase64(uploadedFile);
        } else {
          questionText = `Please solve the problem in this document: ${uploadedFile.name}`;
        }
      }

      const systemPrompt = `You are an expert aptitude tutor. Provide comprehensive step-by-step solutions with:

1. **Problem Analysis**: Understand what's being asked
2. **Formula/Concept**: State the relevant formula or concept
3. **Step-by-Step Solution**: Show each calculation step clearly
4. **Final Answer**: Clearly marked final result
5. **Alternative Method**: If applicable, show another approach

Format your response with clear headings and make calculations easy to follow.`;

      const userPrompt = questionText;

      const requestBody: any = {
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: imageData 
              ? [
                  { type: "text", text: userPrompt },
                  { 
                    type: "image_url", 
                    image_url: { url: `data:image/jpeg;base64,${imageData}` }
                  }
                ]
              : userPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Aptitude Solver'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate solution');
      }

      const data = await response.json();
      const solutionText = data.choices?.[0]?.message?.content;

      if (!solutionText) {
        throw new Error('No solution generated');
      }

      setSolution(solutionText);

    } catch (err) {
      console.error('Error generating solution:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate solution. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear inputs
  const clearInputs = () => {
    setQuestion('');
    setUploadedFile(null);
    setSolution(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#0F172A',
      color: '#F8FAFC',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#1E293B',
            color: '#14B8A6',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#F8FAFC',
          margin: 0
        }}>
          Ask Me Anything
        </h1>
      </div>

      <p style={{
        color: '#94A3B8',
        fontSize: '1.1rem',
        marginBottom: '2rem'
      }}>
        Get instant AI-powered solutions to any aptitude problem
      </p>

      {/* Input Mode Toggle */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setInputMode('text')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: inputMode === 'text' ? '#3B82F6' : '#374151',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          <Type size={16} />
          Type Question
        </button>
        
        <button
          onClick={() => setInputMode('image')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: inputMode === 'image' ? '#3B82F6' : '#374151',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          <Camera size={16} />
          Upload Image
        </button>
      </div>

      {/* Text Input */}
      {inputMode === 'text' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#94A3B8',
            marginBottom: '0.5rem'
          }}>
            Your Question:
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your aptitude question here..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '1rem',
              backgroundColor: '#1E293B',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#F8FAFC',
              fontSize: '1rem',
              lineHeight: 1.5,
              resize: 'vertical',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B82F6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#374151';
            }}
          />
        </div>
      )}

      {/* Image Input */}
      {inputMode === 'image' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#94A3B8',
            marginBottom: '0.5rem'
          }}>
            Upload Problem Image:
          </label>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #374151',
              borderRadius: '0.5rem',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#1E293B',
              transition: 'border-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3B82F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#374151';
            }}
          >
            {uploadedFile ? (
              <div>
                <Upload size={32} color="#10B981" style={{ marginBottom: '0.5rem' }} />
                <p style={{ color: '#10B981', margin: 0 }}>
                  âœ“ {uploadedFile.name}
                </p>
              </div>
            ) : (
              <div>
                <Upload size={32} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
                <p style={{ color: '#94A3B8', margin: 0 }}>
                  Click to upload image (JPG, PNG, PDF - max 10MB)
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={generateSolution}
          disabled={isLoading || (!question.trim() && !uploadedFile)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: isLoading || (!question.trim() && !uploadedFile) 
              ? '#374151' 
              : '#10B981',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: isLoading || (!question.trim() && !uploadedFile) 
              ? 'not-allowed' 
              : 'pointer',
            fontWeight: 600,
            fontSize: '1rem'
          }}
        >
          {isLoading ? 'Solving...' : (
            <>
              <Send size={18} />
              Get Solution
            </>
          )}
        </button>

        <button
          onClick={clearInputs}
          style={{
            padding: '1rem',
            backgroundColor: '#EF4444',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Clear
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.5rem',
          color: '#EF4444',
          marginBottom: '2rem'
        }}>
          {error}
        </div>
      )}

      {/* Solution Display */}
      {solution && (
        <div style={{
          padding: '2rem',
          backgroundColor: '#1E293B',
          borderRadius: '0.75rem',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#10B981',
            marginBottom: '1.5rem'
          }}>
            Solution:
          </h3>
          
          <div style={{
            color: '#F8FAFC',
            lineHeight: 1.6,
            fontSize: '0.95rem',
            whiteSpace: 'pre-wrap'
          }}>
            {solution.split('\n').map((line, index) => {
              // Format headers
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <h4 key={index} style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#3B82F6',
                    marginTop: index > 0 ? '1.5rem' : '0',
                    marginBottom: '0.75rem'
                  }}>
                    {line.replace(/\*\*/g, '')}
                  </h4>
                );
              }
              
              // Format numbered steps
              if (/^\d+\./.test(line.trim())) {
                return (
                  <div key={index} style={{
                    padding: '0.75rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '0.5rem',
                    marginBottom: '0.75rem',
                    borderLeft: '3px solid #3B82F6'
                  }}>
                    {line}
                  </div>
                );
              }
              
              // Regular text
              return line.trim() ? (
                <p key={index} style={{ marginBottom: '0.75rem' }}>
                  {line}
                </p>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Help Text */}
      {!solution && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#1E293B',
          borderRadius: '0.5rem',
          border: '1px solid rgba(20, 184, 166, 0.2)',
          textAlign: 'center'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#14B8A6',
            marginBottom: '0.5rem'
          }}>
            How it works:
          </h4>
          <p style={{
            color: '#94A3B8',
            fontSize: '0.9rem',
            margin: 0,
            lineHeight: 1.4
          }}>
            Type your question or upload an image of the problem. Our AI will provide step-by-step solutions with detailed explanations.
          </p>
        </div>
      )}
    </div>
  );
};

export default AskMeAnything;
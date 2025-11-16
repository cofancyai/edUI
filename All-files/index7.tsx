import React, { useState, useRef } from 'react';
import { Upload, FileText, Award, AlertCircle, CheckCircle, Loader, Camera, RotateCcw } from 'lucide-react';

interface EvaluationResult {
  extracted_text: string;
  score: number;
  max_marks: number;
  feedback: string;
  missing_points: string;
  corrections: string;
  percentage: number;
  timestamp: string;
}

interface AnswerEvaluationProps {
  selectedLanguage?: string;
  isAuthenticated?: boolean;
}

const AnswerEvaluation: React.FC<AnswerEvaluationProps> = ({ 
  selectedLanguage = 'english', 
  isAuthenticated = true 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [marks, setMarks] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
      setResult(null);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Submit evaluation
  const handleEvaluate = async () => {
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    if (!marks || isNaN(Number(marks)) || Number(marks) <= 0) {
      setError('Please enter valid marks (e.g., 5, 10, 16)');
      return;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('answer_image', selectedFile);
      formData.append('marks', marks);
      if (question.trim()) {
        formData.append('question', question.trim());
      }

      const response = await fetch('http://localhost:8080/api/answer-evaluation/evaluate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.message || 'Evaluation failed');
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to evaluate answer');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMarks('');
    setQuestion('');
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get score color based on percentage
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 60) return '#F59E0B'; // Yellow
    if (percentage >= 40) return '#EF4444'; // Red
    return '#DC2626'; // Dark Red
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
      borderRadius: '0.75rem',
      padding: '2rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      fontFamily: "'Montserrat', sans-serif",
      color: '#EDEDED'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '2px solid rgba(255, 215, 0, 0.2)',
        paddingBottom: '1rem'
      }}>
        <Award size={32} style={{ color: '#FFD700' }} />
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #FFD700, #FFF8DC)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Answer Evaluation System
          </h2>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            color: '#B19CD9', 
            fontSize: '1rem' 
          }}>
            Upload handwritten UPSC answers for AI-powered evaluation
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Column - Upload & Form */}
        <div>
          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: '2px dashed rgba(255, 215, 0, 0.4)',
              borderRadius: '0.75rem',
              padding: '2rem',
              textAlign: 'center',
              background: selectedFile ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 215, 0, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginBottom: '1.5rem'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {previewUrl ? (
              <div>
                <img
                  src={previewUrl}
                  alt="Answer preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                  }}
                />
                <p style={{ color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={20} />
                  Image uploaded successfully
                </p>
              </div>
            ) : (
              <div>
                <Upload size={48} style={{ color: '#FFD700', marginBottom: '1rem' }} />
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  Drop your answer image here or click to browse
                </p>
                <p style={{ fontSize: '0.9rem', color: '#B19CD9' }}>
                  Supports: JPG, PNG, JPEG (Max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Form Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Marks Input */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#FFD700'
              }}>
                Total Marks *
              </label>
              <input
                type="number"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="Enter marks (5, 10, 16, etc.)"
                min="1"
                max="50"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#EDEDED',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Question Input */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#FFD700'
              }}>
                Question (Optional)
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter the question text for better evaluation context..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#EDEDED',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleEvaluate}
                disabled={!selectedFile || !marks || isEvaluating}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: isEvaluating 
                    ? 'rgba(255, 215, 0, 0.3)' 
                    : 'linear-gradient(45deg, #FFD700, #B19CD9)',
                  color: isEvaluating ? '#EDEDED' : '#2E1A47',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isEvaluating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  opacity: (!selectedFile || !marks) ? 0.5 : 1
                }}
              >
                {isEvaluating ? (
                  <>
                    <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    Evaluate Answer
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                style={{
                  padding: '1rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <RotateCcw size={20} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div>
          {/* Error Display */}
          {error && (
            <div style={{
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={20} style={{ color: '#EF4444' }} />
              <span style={{ color: '#EF4444' }}>{error}</span>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid rgba(255, 215, 0, 0.2)'
            }}>
              <h3 style={{ 
                margin: '0 0 1.5rem 0', 
                color: '#FFD700',
                fontSize: '1.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Award size={24} />
                Evaluation Results
              </h3>

              {/* Score Card */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
                border: `2px solid ${getScoreColor(result.percentage)}`
              }}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: getScoreColor(result.percentage),
                  marginBottom: '0.5rem'
                }}>
                  {result.score}/{result.max_marks}
                </div>
                <div style={{
                  fontSize: '1.2rem',
                  color: '#EDEDED',
                  marginBottom: '0.5rem'
                }}>
                  {result.percentage}%
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#B19CD9'
                }}>
                  {result.percentage >= 80 ? 'Excellent!' : 
                   result.percentage >= 60 ? 'Good!' : 
                   result.percentage >= 40 ? 'Average' : 'Needs Improvement'}
                </div>
              </div>

              {/* Feedback Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h4 style={{ color: '#FFD700', margin: '0 0 0.5rem 0' }}>ðŸ“ Feedback</h4>
                  <p style={{ 
                    color: '#EDEDED', 
                    lineHeight: '1.6',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    margin: 0
                  }}>
                    {result.feedback}
                  </p>
                </div>

                <div>
                  <h4 style={{ color: '#F59E0B', margin: '0 0 0.5rem 0' }}>âš ï¸ Missing Points</h4>
                  <p style={{ 
                    color: '#EDEDED', 
                    lineHeight: '1.6',
                    background: 'rgba(245, 158, 11, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    margin: 0
                  }}>
                    {result.missing_points}
                  </p>
                </div>

                <div>
                  <h4 style={{ color: '#EF4444', margin: '0 0 0.5rem 0' }}>âœï¸ Corrections</h4>
                  <p style={{ 
                    color: '#EDEDED', 
                    lineHeight: '1.6',
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    margin: 0
                  }}>
                    {result.corrections}
                  </p>
                </div>

                {/* Extracted Text Preview */}
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ 
                    color: '#B19CD9', 
                    cursor: 'pointer', 
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    ðŸ“„ View Extracted Text
                  </summary>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    color: '#EDEDED',
                    lineHeight: '1.5',
                    maxHeight: '200px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {result.extracted_text}
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* Placeholder when no results */}
          {!result && !error && !isEvaluating && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '0.75rem',
              padding: '2rem',
              textAlign: 'center',
              border: '1px dashed rgba(255, 215, 0, 0.2)'
            }}>
              <Camera size={48} style={{ color: '#B19CD9', marginBottom: '1rem' }} />
              <h3 style={{ color: '#B19CD9', margin: '0 0 0.5rem 0' }}>
                Upload an answer to get started
              </h3>
              <p style={{ color: '#6B7280', margin: 0 }}>
                Your evaluation results will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerEvaluation;
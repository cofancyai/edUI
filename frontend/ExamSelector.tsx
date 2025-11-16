import React, { useState } from 'react';
import { BookOpen, GraduationCap, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { ExamInfo } from '../../../types/syllabus.types';

interface ExamSelectorProps {
  exams: ExamInfo[];
  selectedExam: string;
  selectedPaper: string;
  onExamSelect: (exam_name: string, paper_name: string) => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const ExamSelector: React.FC<ExamSelectorProps> = ({
  exams,
  selectedExam,
  selectedPaper,
  onExamSelect,
  loading = false,
  error = null,
  onRefresh
}) => {
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
  const [isPaperDropdownOpen, setIsPaperDropdownOpen] = useState(false);

  // Get papers for selected exam
  const selectedExamData = exams.find(exam => exam.exam_name === selectedExam);
  const availablePapers = selectedExamData?.papers || [];

  const handleExamSelect = (exam_name: string) => {
    const examData = exams.find(exam => exam.exam_name === exam_name);
    if (examData && examData.papers.length > 0) {
      // Auto-select first paper if only one available
      const paper_name = examData.papers.length === 1 ? examData.papers[0] : '';
      onExamSelect(exam_name, paper_name);
      
      if (paper_name) {
        setIsPaperDropdownOpen(false);
      }
    }
    setIsExamDropdownOpen(false);
  };

  const handlePaperSelect = (paper_name: string) => {
    onExamSelect(selectedExam, paper_name);
    setIsPaperDropdownOpen(false);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '1rem',
        color: 'white'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginRight: '1rem'
        }} />
        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Loading available exams...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '2rem',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <AlertCircle size={24} style={{ color: '#EF4444' }} />
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#EF4444', margin: '0 0 0.5rem 0' }}>Failed to Load Exams</h3>
          <p style={{ color: '#6B7280', margin: 0 }}>{error}</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            style={{
              padding: '0.5rem 1rem',
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '1rem',
      padding: '2rem',
      color: 'white',
      marginBottom: '2rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <GraduationCap size={28} />
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>
          Select Your Exam & Paper
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedExam && availablePapers.length > 1 ? '1fr 1fr' : '1fr',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Exam Selection */}
        <div style={{ position: 'relative' }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            opacity: 0.9
          }}>
            Choose Exam
          </label>
          <button
            onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '0.75rem',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} />
              {selectedExam || 'Select an exam...'}
            </div>
            <span style={{ 
              transform: isExamDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}>
              â–¼
            </span>
          </button>

          {isExamDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 50,
              background: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              marginTop: '0.5rem',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {exams.map((exam, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExamSelect(exam.exam_name)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: 'none',
                    background: selectedExam === exam.exam_name ? '#F3F4F6' : 'transparent',
                    color: '#1F2937',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    borderRadius: idx === 0 ? '0.75rem 0.75rem 0 0' : 
                               idx === exams.length - 1 ? '0 0 0.75rem 0.75rem' : '0',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedExam !== exam.exam_name) {
                      e.currentTarget.style.background = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedExam !== exam.exam_name) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {exam.exam_name}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Users size={14} />
                    {exam.papers.length} paper{exam.papers.length !== 1 ? 's' : ''} â€¢ {exam.total_topics} topics
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paper Selection */}
        {selectedExam && availablePapers.length > 1 && (
          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              opacity: 0.9
            }}>
              Choose Paper
            </label>
            <button
              onClick={() => setIsPaperDropdownOpen(!isPaperDropdownOpen)}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.75rem',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} />
                {selectedPaper || 'Select a paper...'}
              </div>
              <span style={{ 
                transform: isPaperDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}>
                â–¼
              </span>
            </button>

            {isPaperDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 50,
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                marginTop: '0.5rem',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {availablePapers.map((paper, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePaperSelect(paper)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: 'none',
                      background: selectedPaper === paper ? '#F3F4F6' : 'transparent',
                      color: '#1F2937',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      borderRadius: idx === 0 ? '0.75rem 0.75rem 0 0' : 
                                 idx === availablePapers.length - 1 ? '0 0 0.75rem 0.75rem' : '0',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedPaper !== paper) {
                        e.currentTarget.style.background = '#F9FAFB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedPaper !== paper) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {paper}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedExam && selectedPaper && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '0.75rem',
          padding: '1rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.25rem' }}>
                Selected for preparation:
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                {selectedExam} - {selectedPaper}
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              opacity: 0.9
            }}>
              <BookOpen size={16} />
              {selectedExamData?.total_topics || 0} topics available
            </div>
          </div>
        </div>
      )}

      {/* Auto-selection message */}
      {selectedExam && availablePapers.length === 1 && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.2)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          fontSize: '0.9rem',
          marginTop: '1rem',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          ðŸ“š {selectedPaper} automatically selected (only paper available for this exam)
        </div>
      )}

      {/* Add CSS animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ExamSelector;
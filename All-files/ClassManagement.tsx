import { useState } from 'react';
import { Calendar, Clock, Users, DollarSign, Video, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useTutorData } from '../../../hooks/useTutorData';
import { useClassPayments } from '../../../hooks/usePayment';
import { ClassCreateData } from '../../../types/tutor.types';

interface ClassManagementProps {
  tutorId: string;
}

const ClassManagement = ({ tutorId }: ClassManagementProps) => {
  const { currentClass, loading, error, createClass, updateClassStatus, clearError } = useTutorData(tutorId);
  const { payments: classPayments, loadClassPayments } = useClassPayments(currentClass?.id || '');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [classForm, setClassForm] = useState({
    title: '',
    subject: '',
    description: '',
    scheduled_date: '',
    duration_minutes: 60,
    price: 100,
    max_students: 50
  });

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
    'Hindi', 'History', 'Geography', 'Political Science', 'Economics',
    'Computer Science', 'General Knowledge', 'Current Affairs'
  ];

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classForm.title || !classForm.subject || !classForm.scheduled_date) {
      alert('Please fill all required fields');
      return;
    }
    
    // Check if scheduled date is in the future
    const scheduledDate = new Date(classForm.scheduled_date);
    const now = new Date();
    if (scheduledDate <= now) {
      alert('Please select a future date and time');
      return;
    }
    
    try {
      setCreating(true);
      clearError();
      
      const classData: ClassCreateData = {
        title: classForm.title,
        subject: classForm.subject,
        description: classForm.description,
        scheduled_date: classForm.scheduled_date,
        duration_minutes: classForm.duration_minutes,
        price: classForm.price,
        max_students: classForm.max_students
      };
      
      await createClass(tutorId, classData);
      
      // Reset form
      setClassForm({
        title: '',
        subject: '',
        description: '',
        scheduled_date: '',
        duration_minutes: 60,
        price: 100,
        max_students: 50
      });
      setShowCreateForm(false);
      
      alert('Live class created successfully!');
    } catch (err) {
      console.error('Create class error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleFinishClass = async () => {
    if (!currentClass) return;
    
    if (confirm('Are you sure you want to finish this class? This action cannot be undone.')) {
      try {
        await updateClassStatus(currentClass.id, tutorId, 'completed');
        alert('Class finished successfully!');
      } catch (err) {
        console.error('Finish class error:', err);
      }
    }
  };

  const handleCancelClass = async () => {
    if (!currentClass) return;
    
    if (confirm('Are you sure you want to cancel this class? Students will be refunded.')) {
      try {
        await updateClassStatus(currentClass.id, tutorId, 'cancelled');
        alert('Class cancelled successfully!');
      } catch (err) {
        console.error('Cancel class error:', err);
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
      borderRadius: '0.75rem',
      padding: '2rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          color: '#FFD700',
          fontSize: '1.5rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Video size={24} />
          Live Classes
        </h2>
        
        {!currentClass && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={creating}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(45deg, #10b981, #34d399)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: creating ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: creating ? 0.7 : 1
            }}
          >
            <Plus size={16} />
            Create Class
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Current Active Class */}
      {currentClass && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem'
          }}>
            <div>
              <h3 style={{
                color: '#10b981',
                fontSize: '1.3rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                ðŸ”´ ACTIVE CLASS
              </h3>
              <h4 style={{
                color: '#FFD700',
                fontSize: '1.1rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                {currentClass.title}
              </h4>
            </div>
            
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              borderRadius: '1rem',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {currentClass.subject}
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EDEDED' }}>
              <Calendar size={16} />
              <span>{formatDateTime(currentClass.scheduled_date)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EDEDED' }}>
              <Clock size={16} />
              <span>{currentClass.duration_minutes} minutes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EDEDED' }}>
              <DollarSign size={16} />
              <span>â‚¹{currentClass.price}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EDEDED' }}>
              <Users size={16} />
              <span>{classPayments.length}/{currentClass.max_students} students</span>
            </div>
          </div>
          
          {currentClass.description && (
            <p style={{
              color: '#EDEDED',
              marginBottom: '1.5rem',
              opacity: 0.9
            }}>
              {currentClass.description}
            </p>
          )}
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleFinishClass}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(45deg, #10b981, #34d399)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle size={16} />
              Finish Class
            </button>
            
            <button
              onClick={handleCancelClass}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(45deg, #ef4444, #f87171)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <XCircle size={16} />
              Cancel Class
            </button>
          </div>
          
          {/* Students List */}
          {classPayments.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: '#FFD700', marginBottom: '1rem' }}>
                Enrolled Students ({classPayments.length})
              </h4>
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                {classPayments.map((payment, index) => (
                  <div
                    key={payment.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: index < classPayments.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                    }}
                  >
                    <span style={{ color: '#EDEDED' }}>Student {index + 1}</span>
                    <span style={{ color: '#10b981', fontSize: '0.8rem' }}>
                      Paid â‚¹{payment.amount_paid}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Class Form */}
      {showCreateForm && !currentClass && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Create New Live Class</h3>
          
          <form onSubmit={handleCreateClass}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  color: '#e5e7eb',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Class Title *
                </label>
                <input
                  type="text"
                  value={classForm.title}
                  onChange={(e) => setClassForm(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                  placeholder="Enter class title"
                  required
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  color: '#e5e7eb',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Subject *
                </label>
                <select
                  value={classForm.subject}
                  onChange={(e) => setClassForm(prev => ({ ...prev, subject: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Description
              </label>
              <textarea
                value={classForm.description}
                onChange={(e) => setClassForm(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Describe what this class will cover..."
              />
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  color: '#e5e7eb',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={classForm.scheduled_date}
                  onChange={(e) => setClassForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  min={getMinDateTime()}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  color: '#e5e7eb',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={classForm.duration_minutes}
                  onChange={(e) => setClassForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                  min="30"
                  max="180"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  color: '#e5e7eb',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Price (â‚¹)
                </label>
                <input
                  type="number"
                  value={classForm.price}
                  onChange={(e) => setClassForm(prev => ({ ...prev, price: parseInt(e.target.value) || 100 }))}
                  min="50"
                  max="5000"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  color: '#e5e7eb',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Max Students
                </label>
                <input
                  type="number"
                  value={classForm.max_students}
                  onChange={(e) => setClassForm(prev => ({ ...prev, max_students: parseInt(e.target.value) || 50 }))}
                  min="5"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: creating ? '#6b7280' : 'linear-gradient(45deg, #10b981, #34d399)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {creating ? 'Creating...' : 'Create Class'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(107, 114, 128, 0.2)',
                  color: '#9ca3af',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* No Active Class Message */}
      {!currentClass && !showCreateForm && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af'
        }}>
          <Video size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '1rem' }}>No active live class</h3>
          <p style={{ marginBottom: '1.5rem' }}>Create a live class to start teaching students in real-time!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(45deg, #10b981, #34d399)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={16} />
            Create Your First Class
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
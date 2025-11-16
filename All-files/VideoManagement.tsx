import { useState } from 'react';
import { Upload, Video, Trash2, Eye, Calendar, Play } from 'lucide-react';
import { useTutorData } from '../../../hooks/useTutorData';
import { VideoUploadData } from '../../../types/tutor.types';

interface VideoManagementProps {
  tutorId: string;
}

const VideoManagement = ({ tutorId }: VideoManagementProps) => {
  const { videos, loading, error, uploadVideo, deleteVideo, clearError } = useTutorData(tutorId);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subject: '',
    description: '',
    video_file: null as File | null
  });

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
    'Hindi', 'History', 'Geography', 'Political Science', 'Economics',
    'Computer Science', 'General Knowledge', 'Current Affairs'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }
      
      // Check file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert('Video file size should be less than 500MB');
        return;
      }
      
      setUploadForm(prev => ({ ...prev, video_file: file }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.title || !uploadForm.subject || !uploadForm.video_file) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      setUploading(true);
      clearError();
      
      const videoData: VideoUploadData = {
        title: uploadForm.title,
        subject: uploadForm.subject,
        description: uploadForm.description,
        video_file: uploadForm.video_file
      };
      
      await uploadVideo(tutorId, videoData);
      
      // Reset form
      setUploadForm({
        title: '',
        subject: '',
        description: '',
        video_file: null
      });
      setShowUploadForm(false);
      
      alert('Video uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteVideo(videoId, tutorId);
        alert('Video deleted successfully!');
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          My Videos ({videos.length})
        </h2>
        
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          disabled={uploading}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: uploading ? 0.7 : 1
          }}
        >
          <Upload size={16} />
          Upload Video
        </button>
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

      {/* Upload Form */}
      {showUploadForm && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Upload New Video</h3>
          
          <form onSubmit={handleUpload}>
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
                  Video Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                  placeholder="Enter video title"
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
                  value={uploadForm.subject}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, subject: e.target.value }))}
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
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
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
                placeholder="Describe what this video covers..."
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Video File * (Max 500MB)
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
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
              {uploadForm.video_file && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#10b981'
                }}>
                  Selected: {uploadForm.video_file.name} ({formatFileSize(uploadForm.video_file.size)})
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={uploading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: uploading ? '#6b7280' : 'linear-gradient(45deg, #10b981, #34d399)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
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

      {/* Videos List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 215, 0, 0.3)',
            borderTop: '4px solid #FFD700',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#EDEDED' }}>Loading videos...</p>
        </div>
      ) : videos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af'
        }}>
          <Video size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '1rem' }}>No videos uploaded yet</h3>
          <p>Upload your first video to start teaching students!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {videos.map((video) => (
            <div
              key={video.id}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    color: '#FFD700',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    lineHeight: '1.4'
                  }}>
                    {video.title}
                  </h3>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    borderRadius: '1rem',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem'
                  }}>
                    {video.subject}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDelete(video.id, video.title)}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    marginLeft: '0.5rem'
                  }}
                  title="Delete video"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              {video.description && (
                <p style={{
                  color: '#EDEDED',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  marginBottom: '1rem',
                  opacity: 0.8
                }}>
                  {video.description.length > 100 
                    ? video.description.substring(0, 100) + '...'
                    : video.description
                  }
                </p>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: '#9ca3af'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye size={14} />
                  {video.views} views
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} />
                  {formatDate(video.created_at)}
                </div>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => window.open(video.video_url, '_blank')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'linear-gradient(45deg, #8b5cf6, #a78bfa)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Play size={16} />
                  Watch Video
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoManagement;
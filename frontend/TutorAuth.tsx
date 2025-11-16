import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { DEGREE_OPTIONS, MASTER_DEGREE_OPTIONS } from '../../constants/educationData';

enum AuthMode {
  LOGIN = 'login',
  REGISTER = 'register'
}

const TutorAuth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('+91');
  const [educationQualification, setEducationQualification] = useState('');
  const [degree, setDegree] = useState('');
  const [masterDegree, setMasterDegree] = useState('');
  const [phd, setPhd] = useState(false);
  const [workingExperience, setWorkingExperience] = useState('');
  const [documentsFile, setDocumentsFile] = useState<File | null>(null);

  const handleBackClick = () => {
    navigate('/');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setError('Please fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      const { data: tutor, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('username', loginUsername)
        .eq('password', loginPassword)
        .single();
        
      if (error || !tutor) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('tutorUsername', loginUsername);
      localStorage.setItem('tutorId', tutor.id);
      navigate('/tutor/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const validateRegistration = () => {
    if (!name || !username || !password || !confirmPassword || !mobileNumber || mobileNumber === '+91') {
      setError('Please fill all required fields');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (workingExperience.split(' ').length < 20) {
      setError('Working experience must be at least 20 words');
      return false;
    }
    
    if (!documentsFile) {
      setError('Please upload documents in ZIP format');
      return false;
    }
    
    if (!documentsFile.name.toLowerCase().endsWith('.zip')) {
      setError('Documents must be ZIP format only');
      return false;
    }
    
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateRegistration()) {
    return;
  }
  
  setLoading(true);
  try {
    // Check if username already exists - FIX: Use maybeSingle()
    const { data: existingTutor } = await supabase
      .from('tutors')
      .select('username')
      .eq('username', username)
      .maybeSingle(); // CHANGED: Use maybeSingle() instead of single()
      
    if (existingTutor) {
      setError('Username already exists');
      setLoading(false);
      return;
    }

    // Store document as base64 in database instead of storage
    let documentUrl = '';
    if (documentsFile) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:mime;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(documentsFile);
      });

      // Store in database table instead of storage bucket
      const { data, error: docError } = await supabase
        .from('tutor_documents')
        .insert([{
          tutor_username: username,
          filename: documentsFile.name,
          file_data: base64,
          file_type: documentsFile.type,
          file_size: documentsFile.size,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (docError) throw docError;
      documentUrl = `document_${data.id}`;
    }

    // Insert tutor data
    const { error } = await supabase
      .from('tutors')
      .insert([{
        name,
        username,
        password, // In production, this should be hashed
        mobile_number: mobileNumber,
        education_qualification: educationQualification,
        degree,
        master_degree: masterDegree,
        phd,
        working_experience: workingExperience,
        documents_url: documentUrl,
        created_at: new Date().toISOString(),
        is_approved: false // Pending admin approval
      }]);
      
    if (error) throw error;
    
    setError('');
    alert('Registration successful! Please wait for admin approval to login.');
    setMode(AuthMode.LOGIN);
    clearForm();
  } catch (err: any) {
    setError(err.message || 'Registration failed');
  } finally {
    setLoading(false);
  }
};

  const clearForm = () => {
    setName('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setMobileNumber('+91');
    setEducationQualification('');
    setDegree('');
    setMasterDegree('');
    setPhd(false);
    setWorkingExperience('');
    setDocumentsFile(null);
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        setDocumentsFile(file);
        setError('');
      } else {
        setError('Please select a ZIP file only');
        e.target.value = '';
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1.5rem',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: mode === AuthMode.REGISTER ? '800px' : '400px',
        background: 'linear-gradient(145deg, #2d3748 0%, #1f2937 100%)',
        borderRadius: '1rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 50px rgba(59, 130, 246, 0.1)',
        padding: '2.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <button 
          onClick={handleBackClick}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#93c5fd',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontWeight: '500',
          }}
        >
          â† Back
        </button>
        
        <h2 style={{ 
          color: '#f9fafb', 
          fontSize: '2rem', 
          fontWeight: '700', 
          marginBottom: '2rem',
          textAlign: 'center',
        }}>
          {mode === AuthMode.LOGIN ? 'Tutor Login' : 'Tutor Registration'}
        </h2>
        
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            border: '1px solid #f87171',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}
        
        {mode === AuthMode.LOGIN && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#d1d5db',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}>
                Username
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#d1d5db',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}>
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            <div style={{ 
              marginTop: '1rem', 
              textAlign: 'center', 
              fontSize: '0.875rem',
              color: '#9ca3af'
            }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode(AuthMode.REGISTER)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  fontWeight: '500',
                  padding: '0.25rem 0.5rem',
                }}
              >
                Register Now
              </button>
            </div>
          </form>
        )}
        
        {mode === AuthMode.REGISTER && (
          <form onSubmit={handleRegister}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1.5rem', 
              marginBottom: '2rem',
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#e5e7eb', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#e5e7eb', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#e5e7eb', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#e5e7eb', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#e5e7eb', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.startsWith('+91')) {
                      setMobileNumber(value);
                    } else if (!value) {
                      setMobileNumber('+91');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#e5e7eb', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Education Qualification
                </label>
                <select
                  value={educationQualification}
                  onChange={(e) => setEducationQualification(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="">Select Qualification</option>
                  <option value="matriculation">Matriculation</option>
                  <option value="higher_secondary">Higher Secondary</option>
                  <option value="degree">Degree</option>
                  <option value="master_degree">Master Degree</option>
                  <option value="phd">PhD</option>
                </select>
              </div>

              {(educationQualification === 'degree' || educationQualification === 'master_degree' || educationQualification === 'phd') && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#e5e7eb', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.9rem',
                    fontWeight: '500',
                  }}>
                    Degree
                  </label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#111827',
                      color: '#f9fafb',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="">Select Degree</option>
                    {DEGREE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(educationQualification === 'master_degree' || educationQualification === 'phd') && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#e5e7eb', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.9rem',
                    fontWeight: '500',
                  }}>
                    Master Degree
                  </label>
                  <select
                    value={masterDegree}
                    onChange={(e) => setMasterDegree(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#111827',
                      color: '#f9fafb',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="">Select Master Degree</option>
                    {MASTER_DEGREE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {educationQualification === 'phd' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={phd}
                    onChange={(e) => setPhd(e.target.checked)}
                    style={{ 
                      accentColor: '#3b82f6',
                      width: '1.1rem',
                      height: '1.1rem',
                    }}
                  />
                  <label style={{ 
                    color: '#e5e7eb',
                    fontSize: '0.9rem',
                  }}>
                    PhD Completed
                  </label>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                color: '#e5e7eb', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem',
                fontWeight: '500',
              }}>
                Working Experience * (Minimum 20 words)
              </label>
              <textarea
                value={workingExperience}
                onChange={(e) => setWorkingExperience(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  minHeight: '120px',
                  resize: 'vertical',
                }}
                placeholder="Describe your teaching and work experience..."
              />
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#9ca3af', 
                marginTop: '0.25rem' 
              }}>
                Words: {workingExperience.split(' ').filter(word => word.length > 0).length}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                color: '#e5e7eb', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem',
                fontWeight: '500',
              }}>
                Upload Documents * (ZIP format only)
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
              />
              {documentsFile && (
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#10b981', 
                  marginTop: '0.25rem' 
                }}>
                  Selected: {documentsFile.name} ({(documentsFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#9ca3af', 
                marginTop: '0.25rem' 
              }}>
                Please upload your educational certificates, experience certificates, and ID proof in a single ZIP file.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={clearForm}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'rgba(107, 114, 128, 0.2)',
                  color: '#9ca3af',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Clear
              </button>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  fontWeight: '600',
                }}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
            
            <div style={{ 
              marginTop: '1.5rem', 
              textAlign: 'center', 
              fontSize: '0.875rem',
              color: '#9ca3af'
            }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode(AuthMode.LOGIN)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  fontWeight: '500',
                  padding: '0.25rem 0.5rem',
                }}
              >
                Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TutorAuth;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

enum AuthMode {
  REGISTER = 'register',
  LOGIN = 'login',
  VERIFY = 'verify',
  PROFILE = 'profile'
}

interface EducationLevel {
  id: number;
  level_name: string;
  display_order: number;
}

interface ExamCategory {
  id: number;
  category_name: string;
  description: string;
}

const createPhoneSession = async (phoneNumber: string) => {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const mockEmail = `student${cleanPhone}@gmail.com`;
    const mockPassword = `Student@${cleanPhone}123`;
    
    console.log('Creating session for phone user:', phoneNumber);
    console.log('Using email:', mockEmail);
    
    // First try to sign up (this will work even if user exists)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: mockEmail,
      password: mockPassword,
      options: {
        data: {
          phone: phoneNumber,
          display_name: `Student ${phoneNumber}`,
          is_phone_user: true
        }
      }
    });
    
    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('Error creating user:', signUpError);
      return { success: false, error: signUpError.message };
    }
    
    // For phone users, we'll bypass the email confirmation requirement
    // by directly setting the authentication state
    console.log('âœ… User registration/login completed');
    console.log('SignUp data:', signUpData);
    
    // Return success even if email not confirmed
    return { success: true, data: signUpData };
    
  } catch (err: any) {
    console.error('Error creating phone session:', err);
    return { success: false, error: err.message };
  }
};

const StudentAuth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [locationState, setLocationState] = useState('');
  const [examPreferences, setExamPreferences] = useState<string[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<string[]>(['SMS', 'Email']);

  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([]);

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 
    'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [levelsRes, categoriesRes] = await Promise.all([
        supabase.from('education_levels').select('*').order('display_order'),
        supabase.from('exam_categories').select('*').eq('is_active', true)
      ]);

      if (levelsRes.data) setEducationLevels(levelsRes.data);
      if (categoriesRes.data) setExamCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const checkProfileExists = async (studentId: string) => {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('student_id', studentId)
      .single();
    
    return data !== null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || phone === '+91' || phone.length <= 3) {
      setError('Please fill all fields with a valid phone number');
      return;
    }
    
    setLoading(true);
    try {
      const { data: existingUser } = await supabase
        .from('students')
        .select('*')
        .eq('phone', phone)
        .single();
        
      if (existingUser) {
        setError('User with this phone number already exists');
        setLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('students')
        .insert([{ name, phone }]);
        
      if (error) throw error;
      
      setError('');
      setMode(AuthMode.VERIFY);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone === '+91' || phone.length <= 3) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    try {
      const { data: user, error } = await supabase
        .from('students')
        .select('*')
        .eq('phone', phone)
        .single();
        
      if (error) {
        setError('No account found with this phone number');
        setLoading(false);
        return;
      }
      
      setError('');
      setMode(AuthMode.VERIFY);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter OTP');
      return;
    }
    
    if (otp === '000000') {
      setLoading(true);
      try {
        // Create Supabase user registration (even if not confirmed)
        const sessionResult = await createPhoneSession(phone);
        
        if (!sessionResult.success) {
          console.log('Session creation failed, but continuing with phone auth');
        }
        
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('phone', phone)
          .single();
        
        if (student) {
          setStudentId(student.id);
          
          localStorage.setItem('studentPhone', phone);
          console.log("âœ… Student login successful, studentPhone set to:", phone);
          
          setTimeout(() => {
          navigate('/student/mode-selection');
          }, 100);
        }
      } catch (err: any) {
        console.error('Authentication error:', err);
        // Continue anyway since we have phone verification
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('phone', phone)
          .single();
        
        if (student) {
          setStudentId(student.id);
          localStorage.setItem('studentPhone', phone);
          setTimeout(() => {
          navigate('/student/mode-selection');
          }, 100);
        }
      } finally {
        setLoading(false);
      }
    } else {
      setError('Invalid OTP. For testing use: 000000');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !dateOfBirth || !gender || !educationLevel || 
        !currentStatus || !locationState || examPreferences.length === 0) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('student_profiles')
        .insert([{
          student_id: studentId,
          email,
          date_of_birth: dateOfBirth,
          gender,
          education_level: educationLevel,
          current_status: currentStatus,
          location_state: locationState
        }]);
      
      if (profileError) throw profileError;

      const examPrefs = examPreferences.map(exam => ({
        student_id: studentId,
        exam_category: exam
      }));
      
      const { error: examError } = await supabase
        .from('exam_preferences')
        .insert(examPrefs);
      
      if (examError) throw examError;

      const notifPrefs = notificationPreferences.map(type => ({
        student_id: studentId,
        notification_type: type,
        is_enabled: true
      }));
      
      const { error: notifError } = await supabase
        .from('notification_preferences')
        .insert(notifPrefs);
      
      if (notifError) throw notifError;

      localStorage.setItem('studentPhone', phone);
      console.log("Profile created successfully, studentPhone set to:", phone);
      
      setTimeout(() => {
  console.log("Navigating to mode selection after profile creation");
  navigate('/student/mode-selection');
  console.log("Navigation attempted");
}, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleExamPreference = (category: string) => {
    setExamPreferences(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleNotificationPreference = (type: string) => {
    setNotificationPreferences(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleBackClick = () => {
    console.log('Back button clicked');
    navigate('/');
  };

  const handleRegisterClick = () => {
    console.log('Register button clicked');
    setMode(AuthMode.REGISTER);
  };

  const handleLoginClick = () => {
    console.log('Login button clicked');
    setMode(AuthMode.LOGIN);
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
    } as React.CSSProperties}>
      <div style={{
        width: '100%',
        maxWidth: mode === AuthMode.PROFILE ? '700px' : '400px',
        background: 'linear-gradient(145deg, #2d3748 0%, #1f2937 100%)',
        borderRadius: '1rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 50px rgba(59, 130, 246, 0.1)',
        padding: '2.5rem',
        position: 'relative',
        overflow: 'hidden',
      } as React.CSSProperties}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '-50px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0,
        }} />
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
            transition: 'color 0.3s ease, background-color 0.3s ease',
            zIndex: 10,
            position: 'relative',
            display: 'inline-block',
            pointerEvents: 'auto',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#3b82f6';
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#93c5fd';
            e.currentTarget.style.backgroundColor = 'transparent';
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
          letterSpacing: '0.5px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          zIndex: 1,
        } as React.CSSProperties}>
          {mode === AuthMode.REGISTER 
            ? 'Student Registration' 
            : mode === AuthMode.LOGIN 
              ? 'Student Login' 
              : mode === AuthMode.VERIFY
                ? 'Verify OTP'
                : 'Complete Your Profile'}
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
            zIndex: 1,
          } as React.CSSProperties}>
            {error}
          </div>
        )}
        
        {mode === AuthMode.REGISTER && (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '1rem' } as React.CSSProperties}>
              <label style={{
                display: 'block',
                color: '#d1d5db',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              } as React.CSSProperties}>
                Student Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                } as React.CSSProperties}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' } as React.CSSProperties}>
              <label style={{
                display: 'block',
                color: '#d1d5db',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              } as React.CSSProperties}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.startsWith('+91')) {
                    setPhone(value);
                  } else if (!value) {
                    setPhone('+91');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                } as React.CSSProperties}
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
              } as React.CSSProperties}
            >
              {loading ? 'Processing...' : 'Register'}
            </button>
            
            <div style={{ 
              marginTop: '1rem', 
              textAlign: 'center', 
              fontSize: '0.875rem',
              color: '#9ca3af'
            } as React.CSSProperties}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={handleLoginClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'color 0.3s ease, background-color 0.3s ease',
                  padding: '0.25rem 0.5rem',
                  zIndex: 10,
                  position: 'relative',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3b82f6';
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#60a5fa';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Login
              </button>
            </div>
          </form>
        )}
        
        {mode === AuthMode.LOGIN && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.5rem' } as React.CSSProperties}>
              <label style={{
                display: 'block',
                color: '#d1d5db',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              } as React.CSSProperties}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.startsWith('+91')) {
                    setPhone(value);
                  } else if (!value) {
                    setPhone('+91');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                } as React.CSSProperties}
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
              } as React.CSSProperties}
            >
              {loading ? 'Processing...' : 'Get OTP'}
            </button>
            
            <div style={{ 
              marginTop: '1rem', 
              textAlign: 'center', 
              fontSize: '0.875rem',
              color: '#9ca3af'
            } as React.CSSProperties}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={handleRegisterClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'color 0.3s ease, background-color 0.3s ease',
                  padding: '0.25rem 0.5rem',
                  zIndex: 10,
                  position: 'relative',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3b82f6';
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#60a5fa';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Register
              </button>
            </div>
            
            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280' } as React.CSSProperties}>
              For testing, use OTP: 000000
            </div>
          </form>
        )}
        
        {mode === AuthMode.VERIFY && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '1.5rem' } as React.CSSProperties}>
              <label style={{
                display: 'block',
                color: '#d1d5db',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              } as React.CSSProperties}>
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                } as React.CSSProperties}
              />
            </div>
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontWeight: '600',
                cursor: 'pointer'
              } as React.CSSProperties}
            >
              Verify OTP
            </button>
            
            <div style={{ 
              marginTop: '1rem', 
              textAlign: 'center', 
              fontSize: '0.875rem',
              color: '#9ca3af'
            } as React.CSSProperties}>
              <button
                type="button"
                onClick={handleLoginClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'color 0.3s ease, background-color 0.3s ease',
                  padding: '0.25rem 0.5rem',
                  zIndex: 10,
                  position: 'relative',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3b82f6';
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#60a5fa';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Back to login
              </button>
            </div>
            
            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280' } as React.CSSProperties}>
              For testing, use OTP: 000000
            </div>
          </form>
        )}

        {mode === AuthMode.PROFILE && (
          <form onSubmit={handleProfileSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1.5rem', 
              marginBottom: '2rem',
              zIndex: 1,
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#e5e7eb', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#60a5fa';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#374151';
                    e.currentTarget.style.boxShadow = 'none';
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
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#60a5fa';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#374151';
                    e.currentTarget.style.boxShadow = 'none';
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
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#60a5fa';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#374151';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="" style={{ color: '#9ca3af' }}>Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#e5e7eb', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Current Status
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#60a5fa';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#374151';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="" style={{ color: '#9ca3af' }}>Select Status</option>
                  <option value="student">Student</option>
                  <option value="working">Working Professional</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#e5e7eb', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#60a5fa';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#374151';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="" style={{ color: '#9ca3af' }}>Select Education Level</option>
                  {educationLevels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.level_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#e5e7eb', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Location (State)
                </label>
                <select
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#60a5fa';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#374151';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="" style={{ color: '#9ca3af' }}>Select State</option>
                  {indianStates.map((state, index) => (
                    <option key={index} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '2rem', zIndex: 1 }}>
              <label style={{ 
                display: 'block', 
                color: '#e5e7eb', 
                marginBottom: '0.75rem', 
                fontSize: '0.9rem',
                fontWeight: '500',
              }}>
                Exam Preferences (Select all that apply)
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '0.75rem',
                background: 'rgba(17, 24, 39, 0.5)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #374151',
              }}>
                {examCategories.map(category => (
                  <label key={category.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: '#e5e7eb',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={examPreferences.includes(category.category_name)}
                      onChange={() => toggleExamPreference(category.category_name)}
                      style={{ 
                        marginRight: '0.5rem', 
                        accentColor: '#3b82f6',
                        width: '1.1rem',
                        height: '1.1rem',
                        cursor: 'pointer',
                      }}
                    />
                    {category.category_name}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '2rem', zIndex: 1 }}>
              <label style={{ 
                display: 'block', 
                color: '#e5e7eb', 
                marginBottom: '0.75rem', 
                fontSize: '0.9rem',
                fontWeight: '500',
              }}>
                Notification Preferences
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '0.75rem',
                background: 'rgba(17, 24, 39, 0.5)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #374151',
              }}>
                {['SMS', 'Email', 'WhatsApp', 'In-App'].map(type => (
                  <label key={type} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: '#e5e7eb',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={notificationPreferences.includes(type)}
                      onChange={() => toggleNotificationPreference(type)}
                      style={{ 
                        marginRight: '0.5rem', 
                        accentColor: '#3b82f6',
                        width: '1.1rem',
                        height: '1.1rem',
                        cursor: 'pointer',
                      }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ 
              marginTop: '1.5rem', 
              marginBottom: '1rem', 
              textAlign: 'center', 
              fontSize: '0.875rem',
              color: '#9ca3af',
              zIndex: 1,
            }}>
              Need to register a different account?{' '}
              <button
                type="button"
                onClick={handleRegisterClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'color 0.3s ease, background-color 0.3s ease',
                  padding: '0.25rem 0.5rem',
                  zIndex: 10,
                  position: 'relative',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3b82f6';
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#60a5fa';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Register
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'transform 0.2s ease, box-shadow 0.3s ease',
                boxShadow: '0 5px 15px rgba(59, 130, 246, 0.3)',
                zIndex: 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(59, 130, 246, 0.3)';
              }}
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentAuth;
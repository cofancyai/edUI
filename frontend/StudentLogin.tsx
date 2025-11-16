import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentLogin: React.FC = () => {
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // For demo purposes, just store the phone and redirect
    localStorage.setItem('studentPhone', phone);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigate('/student/dashboard');
    }, 1000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#2E1A47',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#FFF8DC',
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          Student Login
        </h1>
        
        {error && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(255, 0, 0, 0.1)',
            color: '#FFA500',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#e5e7eb',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
            }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
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
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;
import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
  subMessage?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message, subMessage }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(177, 156, 217, 0.2)',
        borderLeft: '4px solid #B19CD9',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
      }} />
      {message && (
        <h3 style={{ color: '#2E1A47', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
          {message}
        </h3>
      )}
      {subMessage && (
        <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
          {subMessage}
        </p>
      )}
    </div>
  );
};

export default LoadingIndicator;

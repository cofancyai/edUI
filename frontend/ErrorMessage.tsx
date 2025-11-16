import * as React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
    <div
      style={{
        padding: '1rem',
        background: 'rgba(255, 0, 0, 0.1)',
        borderRadius: '0.5rem',
        color: '#FFA500',
        textAlign: 'center',
        width: '80%',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255, 0, 0, 0.3)'
      }}
    >
      {message}
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          padding: '0.5rem 1rem',
          background: 'linear-gradient(45deg, #B19CD9, #FFD700)',
          color: '#2E1A47',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: '600',
        }}
      >
        Try Again
      </button>
    )}
  </div>
);

export default ErrorMessage;
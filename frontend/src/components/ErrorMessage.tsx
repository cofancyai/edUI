import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '0.5rem',
      textAlign: 'center'
    }}>
      <AlertTriangle size={40} style={{ color: '#EF4444', marginBottom: '1rem' }} />
      <h3 style={{ color: '#EF4444', marginBottom: '1rem', fontSize: '1.1rem' }}>
        Error
      </h3>
      <p style={{ color: '#2E1A47', marginBottom: onRetry ? '1.5rem' : 0 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(45deg, #EF4444, #DC2626)',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '0 auto'
          }}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

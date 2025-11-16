import * as React from 'react';

interface LoadingIndicatorProps {
  message: string;
  subMessage?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message, 
  subMessage, 
  size = 'medium' 
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return { spinner: '40px', fontSize: '0.875rem' };
      case 'large': return { spinner: '80px', fontSize: '1.25rem' };
      case 'medium':
      default: return { spinner: '60px', fontSize: '1rem' };
    }
  };

  const sizeValues = getSize();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '400px', 
      padding: '2rem' 
    }}>
      <div style={{
        width: sizeValues.spinner,
        height: sizeValues.spinner,
        borderRadius: '50%',
        border: '3px solid rgba(255, 215, 0, 0.3)',
        borderTopColor: '#FFD700',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ 
        marginTop: '2rem', 
        color: '#EDEDED', 
        fontWeight: '500', 
        textAlign: 'center',
        fontSize: sizeValues.fontSize
      }}>
        {message}
        {subMessage && (
          <><br/><span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{subMessage}</span></>
        )}
      </p>
    </div>
  );
};

export default LoadingIndicator;
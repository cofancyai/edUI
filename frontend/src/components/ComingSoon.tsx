import React from 'react';
import { Clock, Sparkles } from 'lucide-react';

interface ComingSoonProps {
  featureName: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ featureName }) => {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
      borderRadius: '1rem',
      padding: '4rem 2rem',
      textAlign: 'center',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      animation: 'fadeIn 0.5s ease-in'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <Clock 
          size={48} 
          style={{ 
            color: '#FFD700',
            animation: 'pulse 2s infinite'
          }} 
        />
        <Sparkles 
          size={32} 
          style={{ 
            color: '#B19CD9',
            animation: 'pulse 2s infinite 0.5s'
          }} 
        />
      </div>
      
      <h2 style={{
        color: '#FFD700',
        fontSize: '2.5rem',
        fontWeight: '700',
        marginBottom: '1rem',
        background: 'linear-gradient(45deg, #FFD700, #FFF8DC)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Coming Soon
      </h2>
      
      <p style={{
        color: '#EDEDED',
        fontSize: '1.3rem',
        marginBottom: '1rem',
        fontWeight: '500'
      }}>
        {featureName}
      </p>
      
      <p style={{
        color: '#B19CD9',
        fontSize: '1rem',
        lineHeight: '1.6',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        We're working hard to bring you this amazing feature. 
        Stay tuned for updates and get ready for an enhanced learning experience!
      </p>
      
      <div style={{
        marginTop: '3rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        {[1, 2, 3].map((dot) => (
          <div
            key={dot}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#FFD700',
              animation: `pulse 1.5s infinite ${dot * 0.2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ComingSoon;

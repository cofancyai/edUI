import React, { useState } from 'react';
import { Brain, Calculator, Clock, Target, TrendingUp } from 'lucide-react';

interface AptitudeProps {
  selectedLanguage: string;
  isAuthenticated?: boolean;
}

const Aptitude: React.FC<AptitudeProps> = ({ selectedLanguage, isAuthenticated = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'quantitative', name: 'Quantitative Aptitude', icon: Calculator, color: '#4f46e5' },
    { id: 'logical', name: 'Logical Reasoning', icon: Brain, color: '#06b6d4' },
    { id: 'verbal', name: 'Verbal Ability', icon: Target, color: '#10b981' },
    { id: 'data', name: 'Data Interpretation', icon: TrendingUp, color: '#f59e0b' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a237e 0%, #0d1b2a 100%)',
      padding: '2rem',
      color: '#fff',
      fontFamily: "'Montserrat', sans-serif"
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Brain size={32} color="#ffd700" />
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>Aptitude Test</h1>
          </div>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)' }}>
            Practice and improve your aptitude skills
          </p>
        </div>

        {/* Categories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  border: selectedCategory === category.id
                    ? '2px solid #ffd700'
                    : '1px solid rgba(255, 215, 0, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCategory === category.id
                    ? '0 8px 32px rgba(255, 215, 0, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Icon size={32} color="#fff" />
                </div>
                <h3 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.25rem',
                  fontWeight: 600
                }}>
                  {category.name}
                </h3>
                <p style={{
                  margin: 0,
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem'
                }}>
                  Practice {category.name.toLowerCase()} questions
                </p>
              </div>
            );
          })}
        </div>

        {/* Coming Soon Message */}
        {selectedCategory && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '1rem',
            padding: '3rem',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            textAlign: 'center'
          }}>
            <Clock size={64} color="#ffd700" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Coming Soon</h2>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)' }}>
              Aptitude tests are being prepared. Check back soon for practice questions and tests!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Aptitude;

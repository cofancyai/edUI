import React, { useState } from 'react';
import { Newspaper, Calendar, TrendingUp, Globe, Award, Filter } from 'lucide-react';

interface CurrentAffairsProps {
  selectedLanguage: string;
  isAuthenticated?: boolean;
}

interface NewsCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
}

const CurrentAffairs: React.FC<CurrentAffairsProps> = ({ selectedLanguage, isAuthenticated = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('daily');

  const categories: NewsCategory[] = [
    { id: 'all', name: 'All Topics', icon: Globe, color: '#6366f1' },
    { id: 'national', name: 'National', icon: Award, color: '#10b981' },
    { id: 'international', name: 'International', icon: Globe, color: '#06b6d4' },
    { id: 'economy', name: 'Economy', icon: TrendingUp, color: '#f59e0b' },
    { id: 'science', name: 'Science & Tech', icon: Award, color: '#8b5cf6' },
    { id: 'sports', name: 'Sports', icon: Award, color: '#ef4444' }
  ];

  const periods = [
    { id: 'daily', name: 'Daily' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'yearly', name: 'Yearly' }
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
            <Newspaper size={32} color="#ffd700" />
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>Current Affairs</h1>
          </div>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)' }}>
            Stay updated with the latest news and current affairs for competitive exams
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          {/* Period Filter */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            display: 'flex',
            gap: '0.5rem'
          }}>
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                style={{
                  background: selectedPeriod === period.id
                    ? 'linear-gradient(135deg, #ffd700, #ffed4e)'
                    : 'transparent',
                  color: selectedPeriod === period.id ? '#1a237e' : '#fff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontWeight: selectedPeriod === period.id ? 600 : 400,
                  transition: 'all 0.3s ease'
                }}
              >
                {period.name}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  background: selectedCategory === category.id
                    ? 'rgba(255, 215, 0, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: selectedCategory === category.id
                    ? '2px solid #ffd700'
                    : '1px solid rgba(255, 215, 0, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
              >
                <Icon size={24} color={category.color} style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{category.name}</div>
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          padding: '3rem',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          textAlign: 'center'
        }}>
          <Calendar size={64} color="#ffd700" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Coming Soon</h2>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', maxWidth: '600px', margin: '0 auto' }}>
            Current Affairs content is being curated for your exam preparation.
            We'll provide daily, weekly, and monthly updates covering all important topics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrentAffairs;

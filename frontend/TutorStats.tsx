import { useState, useEffect } from 'react';
import { Video, Users, DollarSign, Eye, TrendingUp, Calendar, Award, Clock } from 'lucide-react';
import { useTutorData } from '../../../hooks/useTutorData';
import { useTutorPayments } from '../../../hooks/usePayment';

interface TutorStatsProps {
  tutorId: string;
}

const TutorStats = ({ tutorId }: TutorStatsProps) => {
  const { stats, currentClass, loading } = useTutorData(tutorId);
  const { analytics: paymentAnalytics } = useTutorPayments(tutorId);
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'all'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const calculateGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Mock data for demonstration (in real app, this would come from analytics service)
  const getTimeFrameData = () => {
    const baseEarnings = stats?.total_earnings || 0;
    const baseViews = stats?.total_views || 0;
    
    switch (timeFrame) {
      case 'week':
        return {
          earnings: Math.round(baseEarnings * 0.1),
          views: Math.round(baseViews * 0.15),
          students: Math.round((stats?.total_students || 0) * 0.2),
          growth: 15
        };
      case 'month':
        return {
          earnings: stats?.this_month_earnings || 0,
          views: Math.round(baseViews * 0.3),
          students: Math.round((stats?.total_students || 0) * 0.4),
          growth: 25
        };
      case 'all':
        return {
          earnings: baseEarnings,
          views: baseViews,
          students: stats?.total_students || 0,
          growth: 0
        };
      default:
        return {
          earnings: 0,
          views: 0,
          students: 0,
          growth: 0
        };
    }
  };

  const timeFrameData = getTimeFrameData();

  const statCards = [
    {
      title: 'Total Videos',
      value: stats?.total_videos || 0,
      icon: Video,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      change: '+2 this month',
      changeType: 'positive' as const
    },
    {
      title: 'Total Students',
      value: timeFrame === 'all' ? stats?.total_students || 0 : timeFrameData.students,
      icon: Users,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      change: `+${timeFrameData.growth}% growth`,
      changeType: 'positive' as const
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(timeFrameData.earnings),
      icon: DollarSign,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      change: `This ${timeFrame}`,
      changeType: 'neutral' as const
    },
    {
      title: 'Video Views',
      value: timeFrameData.views.toLocaleString(),
      icon: Eye,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      borderColor: 'rgba(139, 92, 246, 0.3)',
      change: '+12% vs last period',
      changeType: 'positive' as const
    }
  ];

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '0.75rem',
        padding: '2rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 215, 0, 0.3)',
          borderTop: '4px solid #FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p style={{ color: '#EDEDED' }}>Loading stats...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
      borderRadius: '0.75rem',
      padding: '2rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{
            color: '#FFD700',
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            {getGreeting()}! ðŸ‘‹
          </h2>
          <p style={{
            color: '#B19CD9',
            fontSize: '0.9rem',
            margin: 0
          }}>
            Here's how your teaching is going
          </p>
        </div>
        
        {/* Time Frame Selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.5rem',
          padding: '0.25rem'
        }}>
          {['week', 'month', 'all'].map((frame) => (
            <button
              key={frame}
              onClick={() => setTimeFrame(frame as 'week' | 'month' | 'all')}
              style={{
                padding: '0.5rem 1rem',
                background: timeFrame === frame ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                color: timeFrame === frame ? '#FFD700' : '#9ca3af',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {frame === 'all' ? 'All Time' : `This ${frame}`}
            </button>
          ))}
        </div>
      </div>

      {/* Current Class Alert */}
      {currentClass && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#10b981',
            animation: 'pulse 2s infinite'
          }} />
          <div>
            <div style={{ color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>
              ðŸ”´ Live Class Active
            </div>
            <div style={{ color: '#EDEDED', fontSize: '0.8rem' }}>
              {currentClass.title} â€¢ {stats?.current_class_students || 0} students joined
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              style={{
                background: card.bgColor,
                border: `1px solid ${card.borderColor}`,
                borderRadius: '0.75rem',
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                background: `radial-gradient(circle, ${card.color}20 0%, transparent 70%)`,
                borderRadius: '50%'
              }} />
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{
                  padding: '0.75rem',
                  background: card.color + '20',
                  borderRadius: '0.5rem'
                }}>
                  <Icon size={24} style={{ color: card.color }} />
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    color: '#EDEDED',
                    lineHeight: '1'
                  }}>
                    {typeof card.value === 'string' ? card.value : card.value.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  color: '#EDEDED',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  {card.title}
                </div>
                
                <div style={{
                  fontSize: '0.75rem',
                  color: card.changeType === 'positive' ? '#10b981' : 
                         card.changeType === 'negative' ? '#ef4444' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {card.changeType === 'positive' && <TrendingUp size={12} />}
                  {card.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '0.75rem',
        padding: '1.5rem'
      }}>
        <h3 style={{
          color: '#FFD700',
          fontSize: '1.1rem',
          fontWeight: '600',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Award size={20} />
          Quick Insights
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            padding: '1rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{ color: '#60a5fa', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              Average Views per Video
            </div>
            <div style={{ color: '#EDEDED', fontSize: '1.1rem', fontWeight: '600' }}>
              {stats?.total_videos ? Math.round((stats.total_views || 0) / stats.total_videos) : 0}
            </div>
          </div>
          
          <div style={{
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ color: '#34d399', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              Success Rate
            </div>
            <div style={{ color: '#EDEDED', fontSize: '1.1rem', fontWeight: '600' }}>
              {paymentAnalytics ? 
                Math.round((paymentAnalytics.successful_payments / paymentAnalytics.total_transactions) * 100) : 0}%
            </div>
          </div>
          
          <div style={{
            padding: '1rem',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{ color: '#fbbf24', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              Avg. Earning per Student
            </div>
            <div style={{ color: '#EDEDED', fontSize: '1.1rem', fontWeight: '600' }}>
              {stats?.total_students ? 
                formatCurrency(Math.round((stats.total_earnings || 0) / stats.total_students)) : 
                formatCurrency(0)
              }
            </div>
          </div>
          
          <div style={{
            padding: '1rem',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <div style={{ color: '#a78bfa', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              Teaching Since
            </div>
            <div style={{ color: '#EDEDED', fontSize: '1.1rem', fontWeight: '600' }}>
              3 months ago
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(177, 156, 217, 0.1))',
        borderRadius: '0.5rem',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: '500' }}>
          ðŸ’¡ Keep up the great work! Your students are learning and growing with every video you create.
        </div>
      </div>
    </div>
  );
};

export default TutorStats;
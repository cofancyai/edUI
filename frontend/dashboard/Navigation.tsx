import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Brain, 
  Target, 
  FileText,
  Users,
  TrendingUp,
  Award,
  Bell,
  Globe,
  Mic,
  Newspaper,
  Search
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { getCredential } from '../utils/supabaseClient';

interface NavigationProps {
  selectedMenu: string | null;
  setSelectedMenu: (menu: string) => void;
  isAuthenticated?: boolean;
}

interface MenuAnalytics {
  usageCount: number;
  lastUsed: string;
  averageTime: number;
  effectiveness: number;
  aiRecommendations: string[];
}

interface NavigationInsight {
  preferredLearningTime: string;
  mostUsedFeatures: string[];
  learningVelocity: number;
  focusAreas: string[];
  nextRecommendedAction: string;
  studyStreak: number;
  productivityTrend: 'increasing' | 'stable' | 'decreasing';
}

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';

const Navigation: React.FC<NavigationProps> = ({ selectedMenu, setSelectedMenu, isAuthenticated = false }) => {
  const [menuAnalytics, setMenuAnalytics] = useState<{ [key: string]: MenuAnalytics }>({});
  const [navigationInsights, setNavigationInsights] = useState<NavigationInsight | null>(null);

  // Menu items with enhanced styling configuration and paths
  const menuItems = [
    { name: 'AI Tutor', icon: Brain, color: '#3b82f6', description: 'Comprehensive AI-powered learning', path: '/dashboard/ai-tutor' },
    { name: 'Schemes', icon: Search, color: '#10b981', description: 'Government schemes finder', path: '/dashboard/schemes' },
    { name: 'Exam Alert', icon: Bell, color: '#f59e0b', description: 'Important exam notifications', path: '/dashboard/exam-alert' },
    { name: 'Exam bot', icon: Target, color: '#ef4444', description: 'Practice with exam questions', path: '/dashboard/exam-bot' },
    { name: 'Aptitude', icon: TrendingUp, color: '#8b5cf6', description: 'Aptitude test preparation', path: '/dashboard/aptitude' },
    { 
      name: 'Syllabus Oriented Preparation', 
      icon: FileText, 
      color: '#06b6d4', 
      description: 'Curriculum-based learning', 
      path: '/dashboard/syllabus' 
    },
    { 
      name: 'Mock Interview', 
      icon: Mic, 
      color: '#d946ef', 
      description: 'AI-powered UPSC interview practice', 
      path: '/dashboard/mock-interview' 
    },
    { 
      name: 'Answer Evaluation', 
      icon: Award, 
      color: '#ec4899', 
      description: 'AI-powered handwritten answer evaluation', 
      path: '/dashboard/answer-evaluation' 
    },
    { 
      name: 'Current Affairs', 
      icon: Newspaper, 
      color: '#f97316', 
      description: 'Daily news and quiz', 
      path: '/dashboard/current-affairs' 
    },
    { name: 'Mock Test', icon: BookOpen, color: '#84cc16', description: 'Practice examinations', path: '/dashboard/mock-test' }
  ];

  // Load analytics and insights on mount
  useEffect(() => {
    loadNavigationData();
    generateNavigationInsights();
  }, [isAuthenticated]);

  // Track menu usage when selection changes
  useEffect(() => {
    if (selectedMenu) {
      trackMenuUsage(selectedMenu);
    }
  }, [selectedMenu]);

  // Load navigation data from localStorage and database
  const loadNavigationData = async () => {
    try {
      // Load from localStorage
      const localAnalytics = localStorage.getItem('navigationAnalytics');
      
      if (localAnalytics) {
        setMenuAnalytics(JSON.parse(localAnalytics));
      }

      // Load from database if authenticated
      if (isAuthenticated) {
        await loadFromDatabase();
      }
    } catch (error) {
      console.error('Error loading navigation data:', error);
    }
  };

  // Load data from Supabase database
  const loadFromDatabase = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;

      const userId = session.session.user.id;

      // Load user navigation analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('user_navigation_analytics')
        .select('*')
        .eq('user_id', userId);

      if (!analyticsError && analyticsData) {
        const analytics: { [key: string]: MenuAnalytics } = {};
        analyticsData.forEach((item: any) => {
          analytics[item.menu_name] = {
            usageCount: item.usage_count,
            lastUsed: item.last_used,
            averageTime: item.average_time,
            effectiveness: item.effectiveness,
            aiRecommendations: item.ai_recommendations || []
          };
        });
        setMenuAnalytics(analytics);
      }
    } catch (error) {
      console.error('Error loading from database:', error);
    }
  };

  // Track menu usage with AI analytics
  const trackMenuUsage = async (menuName: string) => {
    const timestamp = new Date().toISOString();
    const currentAnalytics = menuAnalytics[menuName] || {
      usageCount: 0,
      lastUsed: timestamp,
      averageTime: 0,
      effectiveness: 80,
      aiRecommendations: []
    };

    const updatedAnalytics = {
      ...currentAnalytics,
      usageCount: currentAnalytics.usageCount + 1,
      lastUsed: timestamp
    };

    const newMenuAnalytics = {
      ...menuAnalytics,
      [menuName]: updatedAnalytics
    };

    setMenuAnalytics(newMenuAnalytics);
    localStorage.setItem('navigationAnalytics', JSON.stringify(newMenuAnalytics));

    // Save to database if authenticated
    if (isAuthenticated) {
      await saveUsageToDatabase(menuName, updatedAnalytics);
    }

    // Generate new insights if significant usage change
    if (updatedAnalytics.usageCount % 5 === 0) {
      generateNavigationInsights();
    }
  };

  // Save usage data to Supabase
  const saveUsageToDatabase = async (menuName: string, analytics: MenuAnalytics) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;

      const { error } = await supabase
        .from('user_navigation_analytics')
        .upsert({
          user_id: session.session.user.id,
          menu_name: menuName,
          usage_count: analytics.usageCount,
          last_used: analytics.lastUsed,
          average_time: analytics.averageTime,
          effectiveness: analytics.effectiveness,
          ai_recommendations: analytics.aiRecommendations,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving usage to database:', error);
      }
    } catch (error) {
      console.error('Error in saveUsageToDatabase:', error);
    }
  };

  // Generate AI-powered navigation insights
  const generateNavigationInsights = async () => {
    if (Object.keys(menuAnalytics).length < 3) return;

    try {
      const systemPrompt = `You are an expert learning analytics specialist who analyzes user navigation patterns to provide personalized insights and recommendations for optimizing learning paths and study efficiency.`;

      const usageData = Object.entries(menuAnalytics).map(([menu, analytics]) => ({
        menu,
        usageCount: analytics.usageCount,
        lastUsed: analytics.lastUsed,
        effectiveness: analytics.effectiveness
      }));

      const userPrompt = `Analyze this user's navigation patterns and provide comprehensive insights:

Navigation Usage Data:
${usageData.map(item => `- ${item.menu}: Used ${item.usageCount} times, Last used: ${item.lastUsed}, Effectiveness: ${item.effectiveness}%`).join('\n')}

Current Time: ${new Date().toISOString()}
Authentication Status: ${isAuthenticated ? 'Authenticated' : 'Guest'}

Please analyze and provide:
1. Preferred learning time patterns
2. Most effective features for this user
3. Learning velocity assessment
4. Key focus areas identification
5. Next recommended action
6. Study streak calculation
7. Productivity trend analysis

Respond with a JSON object:
{
  "preferredLearningTime": "morning|afternoon|evening|night",
  "mostUsedFeatures": ["feature1", "feature2", "feature3"],
  "learningVelocity": number,
  "focusAreas": ["area1", "area2", "area3"],
  "nextRecommendedAction": "specific recommendation",
  "studyStreak": number,
  "productivityTrend": "increasing|stable|decreasing"
}

Provide data-driven insights based on actual usage patterns.`;

      const TOGETHER_API_KEY = await getCredential('VITE_OPENROUTER_API_KEY');
      if (!TOGETHER_API_KEY) {
        throw new Error('Together AI API key not found');
      }

      const response = await fetch(TOGETHER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOGETHER_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistralai/Mistral-7B-Instruct-v0.2",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 1500,
          temperature: 0.3
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const insights: NavigationInsight = JSON.parse(jsonMatch[0]);
            setNavigationInsights(insights);
          }
        }
      } else {
        throw new Error(`Together AI API request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating navigation insights with Together AI:', error);
    }
  };

  // Get recommendation badge for menu items
  const getRecommendationBadge = (menuName: string) => {
    if (navigationInsights?.nextRecommendedAction.includes(menuName)) {
      return (
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#FFD700',
          marginLeft: '0.25rem'
        }} />
      );
    }
    return null;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {/* Main Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #2E1A47, #1a1a4e)',
        borderRadius: '1rem',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        flexWrap: 'wrap',
        gap: '0.75rem',
        border: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedMenu === item.name;

          return (
            <button
              key={item.name}
              onClick={() => setSelectedMenu(item.name)}
              style={{
                padding: '0.875rem 1.5rem',
                margin: '0',
                background: isSelected 
                  ? 'linear-gradient(45deg, #FFD700, #B19CD9)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: isSelected 
                  ? '2px solid #FFD700' 
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: isSelected ? '#2E1A47' : '#EDEDED',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '50px',
                boxShadow: isSelected 
                  ? '0 6px 20px rgba(255, 215, 0, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              title={item.description}
            >
              {/* Background glow effect for selected item */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(177, 156, 217, 0.1))',
                  borderRadius: '0.75rem',
                  animation: 'pulse 2s infinite',
                  zIndex: 0
                }} />
              )}
              
              <Icon size={20} style={{ 
                color: isSelected ? '#2E1A47' : item.color,
                zIndex: 1,
                position: 'relative'
              }} />
              <span style={{ zIndex: 1, position: 'relative' }}>{item.name}</span>
              
              {getRecommendationBadge(item.name)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;
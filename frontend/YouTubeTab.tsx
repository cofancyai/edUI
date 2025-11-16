import * as React from 'react';
import RefreshButton from '../shared/RefreshButton';
import LoadingIndicator from '../shared/LoadingIndicator';
import ErrorMessage from '../shared/ErrorMessage';
import { YouTubeVideo } from '../../../types';

interface YouTubeTabProps {
  query: string;
  youTubeVideos: YouTubeVideo[];
  youTubeLoading: boolean;
  youTubeError: string | null;
  handleGenerateYouTubeVideos: () => Promise<void>;
}

const YouTubeTab: React.FC<YouTubeTabProps> = ({
  query,
  youTubeVideos,
  youTubeLoading,
  youTubeError,
  handleGenerateYouTubeVideos
}) => {
  // Format duration from YouTube format (PT1H20M30S) to human readable (1:20:30)
  const formatDuration = (duration: string): string => {
    if (!duration) return '0:00';
    
    // Remove PT from the start
    let time = duration.replace('PT', '');
    
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    
    // Extract hours
    if (time.includes('H')) {
      const parts = time.split('H');
      hours = parseInt(parts[0], 10);
      time = parts[1];
    }
    
    // Extract minutes
    if (time.includes('M')) {
      const parts = time.split('M');
      minutes = parseInt(parts[0], 10);
      time = parts[1];
    }
    
    // Extract seconds
    if (time.includes('S')) {
      seconds = parseInt(time.replace('S', ''), 10);
    }
    
    // Format the time
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };
  
  // Format view count with commas
  const formatViewCount = (count: number): string => {
    if (!count && count !== 0) return '0 views';
    return count.toLocaleString() + ' views';
  };
  
  // Format publish date to readable format
  const formatPublishDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  const openYouTubeVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  if (youTubeLoading) {
    return (
      <LoadingIndicator 
        message="Searching for related videos..." 
        subMessage="Finding the best educational content" 
      />
    );
  }

  if (youTubeError) {
    return (
      <ErrorMessage 
        message={youTubeError} 
        onRetry={handleGenerateYouTubeVideos} 
      />
    );
  }

  if (!query) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem' }}>
        <p style={{ color: '#2E1A47', textAlign: 'center', marginBottom: '1.5rem' }}>
          Please enter a query in the search box above to find related videos.
        </p>
      </div>
    );
  }

  if (youTubeVideos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'white', borderRadius: '0.75rem' }}>
        <p style={{ color: '#2E1A47' }}>
          No videos found for "{query}". Click "Search Videos" to find related content.
        </p>
        <button
          onClick={handleGenerateYouTubeVideos}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(45deg, #FFD700, #B19CD9)',
            color: '#2E1A47',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginTop: '1rem',
            fontWeight: '600'
          }}
        >
          Search Videos
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ color: '#2E1A47', margin: 0 }}>{`Educational Videos for "${query}"`}</h3>
        <RefreshButton
          onClick={handleGenerateYouTubeVideos}
          isLoading={youTubeLoading}
          title="Refresh Videos"
        />
      </div>
      
      {youTubeVideos.map((video, index) => (
        <div
          key={`video-${index}`}
          style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(177, 156, 217, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
          }}
          onClick={() => openYouTubeVideo(video.id)}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
        >
          <h4 style={{ color: '#2E1A47', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{video.title}</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '320px', height: '180px', backgroundColor: '#f0f0f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
              {video.thumbnail ? (
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem' }}
                />
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#1a1a4e',
                  color: 'white',
                  fontSize: '0.8rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  Thumbnail not available
                </div>
              )}
              <div style={{ 
                position: 'absolute', 
                bottom: '5px', 
                right: '5px', 
                backgroundColor: 'rgba(0, 0, 0, 0.7)', 
                color: 'white', 
                padding: '2px 4px', 
                borderRadius: '2px', 
                fontSize: '0.7rem' 
              }}>
                {formatDuration(video.duration)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ 
                color: '#2E1A47', 
                fontSize: '0.875rem', 
                marginBottom: '0.75rem', 
                lineHeight: '1.5',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {video.description || 'No description available'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#666', fontSize: '0.75rem' }}>
                <span>{formatViewCount(video.viewCount)}</span>
                <span>â€¢</span>
                <span>{formatPublishDate(video.publishedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div style={{ textAlign: 'center', padding: '1rem', color: '#2E1A47' }}>
        <p>These videos are sourced from YouTube based on your search query.</p>
      </div>
    </div>
  );
};

export default YouTubeTab;
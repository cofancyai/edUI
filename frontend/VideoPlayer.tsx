import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Settings, Download } from 'lucide-react';
import { TutorVideo } from '../../../types/tutor.types';

interface VideoPlayerProps {
  video: TutorVideo;
  onBack: () => void;
  tutorName: string;
}

const VideoPlayer = ({ video, onBack, tutorName }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const controlsTimeoutRef = useRef<number>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      videoRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleMouseMove = () => {
    if (isPlaying) {
      showControlsTemporarily();
    }
  };

  return (
    <div style={{
      background: '#000',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
      height: '100vh',
      maxHeight: '800px'
    }}>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.video_url}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        onMouseMove={handleMouseMove}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        opacity: showControls ? 1 : 0,
        transition: 'opacity 0.3s ease',
        zIndex: 10
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        
        <div>
          <h2 style={{
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: '600',
            margin: '0 0 0.25rem 0'
          }}>
            {video.title}
          </h2>
          <div style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span>by {tutorName}</span>
            <span>â€¢</span>
            <span>{video.subject}</span>
            <span>â€¢</span>
            <span>{video.views} views</span>
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
        padding: '1.5rem',
        opacity: showControls ? 1 : 0,
        transition: 'opacity 0.3s ease',
        zIndex: 10
      }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleTimeChange}
            style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '3px',
              outline: 'none',
              cursor: 'pointer',
              accentColor: '#FFD700'
            }}
          />
        </div>

        {/* Control Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={togglePlay}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button
              onClick={() => skipTime(-10)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <RotateCcw size={20} />
            </button>

            <button
              onClick={() => skipTime(10)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <RotateCw size={20} />
            </button>

            {/* Volume Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={toggleMute}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  width: '80px',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer',
                  accentColor: '#FFD700'
                }}
              />
            </div>

            {/* Time Display */}
            <div style={{
              color: 'white',
              fontSize: '0.9rem',
              fontFamily: 'monospace'
            }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Playback Speed */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Settings size={20} />
                <span style={{ fontSize: '0.8rem' }}>{playbackRate}x</span>
              </button>

              {showSettings && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  background: 'rgba(0, 0, 0, 0.9)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  minWidth: '100px'
                }}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.5rem',
                        background: playbackRate === rate ? 'rgba(255, 215, 0, 0.3)' : 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        textAlign: 'left'
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Download Button */}
            <a
              href={video.video_url}
              download={`${video.title}.mp4`}
              style={{
                color: 'white',
                textDecoration: 'none',
                padding: '0.5rem'
              }}
            >
              <Download size={20} />
            </a>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Play Button Overlay (when paused) */}
      {!isPlaying && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 5
          }}
          onClick={togglePlay}
        >
          <Play size={32} style={{ color: 'white', marginLeft: '4px' }} />
        </div>
      )}

      {/* Loading Indicator */}
      {duration === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid #FFD700',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Loading video...</p>
        </div>
      )}

      {/* Video Info Overlay */}
      {video.description && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '1.5rem',
          right: '1.5rem',
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '0.5rem',
          padding: '1rem',
          color: 'white',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          zIndex: 5,
          maxHeight: '100px',
          overflowY: 'auto'
        }}>
          {video.description}
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div style={{
        position: 'absolute',
        bottom: '120px',
        right: '1.5rem',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '0.5rem',
        padding: '1rem',
        color: 'white',
        fontSize: '0.8rem',
        opacity: showControls ? 0.7 : 0,
        transition: 'opacity 0.3s ease',
        zIndex: 5
      }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Keyboard Shortcuts:</div>
        <div>Space: Play/Pause</div>
        <div>â† â†’: Skip 10s</div>
        <div>â†‘ â†“: Volume</div>
        <div>F: Fullscreen</div>
        <div>M: Mute</div>
      </div>

      {/* Keyboard Event Handler */}
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          switch (e.code) {
            case 'Space':
              e.preventDefault();
              togglePlay();
              break;
            case 'ArrowLeft':
              skipTime(-10);
              break;
            case 'ArrowRight':
              skipTime(10);
              break;
            case 'ArrowUp':
              e.preventDefault();
              setVolume(Math.min(1, volume + 0.1));
              break;
            case 'ArrowDown':
              e.preventDefault();
              setVolume(Math.max(0, volume - 0.1));
              break;
            case 'KeyF':
              toggleFullscreen();
              break;
            case 'KeyM':
              toggleMute();
              break;
          }
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          outline: 'none'
        }}
      />

      {/* CSS Animation for loading spinner */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default VideoPlayer;
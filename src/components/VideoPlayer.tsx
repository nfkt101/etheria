import React, { useState, useEffect, useRef } from 'react';
import { Movie } from '../types';
import { Play, Pause, Volume2, VolumeX, X, RotateCcw, Settings, SkipForward, Maximize, Subtitles, Activity } from 'lucide-react';
import { getPlaybackInfo, buildDirectStreamUrl, getServerUrl } from '../services/jellyfin';
import Hls from 'hls.js';

interface SubtitleTrack {
  Index: number;
  Language: string;
  Title: string;
  IsDefault: boolean;
}

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
  onUpdateProgress?: (progress: number) => void;
}

export default function VideoPlayer({ movie, onClose, onUpdateProgress }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1); // avoid divide by zero
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Subtitle States
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState<number | null>(null);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [mediaSourceId, setMediaSourceId] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isMounted = true;
    let hls: Hls | null = null;
    const initPlayer = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('jellyfin_user_id');
        if (!userId) throw new Error('Not authenticated');

        const playbackInfo = await getPlaybackInfo(movie.id, userId);
        if (!playbackInfo.MediaSources || playbackInfo.MediaSources.length === 0) {
          throw new Error('No media sources available');
        }

        const mSourceId = playbackInfo.MediaSources[0].Id;
        setMediaSourceId(mSourceId);
        
        // Extract subtitle streams
        const streams = playbackInfo.MediaSources[0].MediaStreams || [];
        const subStreams = streams.filter((s: any) => s.Type === 'Subtitle' && s.IsTextSubtitleStream);
        
        const parsedSubs: SubtitleTrack[] = subStreams.map((s: any) => ({
            Index: s.Index,
            Language: s.Language || 'Unknown',
            Title: s.Title || s.Language || 'Unknown',
            IsDefault: s.IsDefault || false
        }));
        
        setSubtitles(parsedSubs);
        
        const defaultSub = parsedSubs.find(s => s.IsDefault);
        if (defaultSub) {
            setActiveSubtitleIndex(defaultSub.Index);
        }

        const directUrl = buildDirectStreamUrl(movie.id, mSourceId);

        const video = videoRef.current;
        if (!video || !isMounted) return;

        if (Hls.isSupported()) {
          hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
          });
          hls.loadSource(directUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!isMounted) return;
            setLoading(false);
            video.play().catch(e => {
              if (e.name !== 'AbortError') console.error("Auto-play prevented", e);
            });
          });
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error("fatal network error encountered, try to recover");
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("fatal media error encountered, try to recover");
                  hls?.recoverMediaError();
                  break;
                default:
                  if (!isMounted) return;
                  setError('Video playback failed (HLS Error).');
                  setLoading(false);
                  hls?.destroy();
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = directUrl;
          video.addEventListener('loadedmetadata', () => {
            if (!isMounted) return;
            setLoading(false);
            video.play().catch(e => {
              if (e.name !== 'AbortError') console.error("Auto-play prevented", e);
            });
          });
        } else {
          setError('HLS is not supported in this browser.');
          setLoading(false);
        }
        
      } catch (err: any) {
        if (!isMounted) return;
        console.error(err);
        setError(err.message || 'Failed to load video stream');
        setLoading(false);
      }
    };

    initPlayer();

    return () => {
      isMounted = false;
      if (hls) {
        hls.destroy();
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [movie.id]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.error("Auto-play prevented", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Update progress
      if (onUpdateProgress && videoRef.current.duration > 0) {
        const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        // Only update occasionally to avoid thrashing state
        if (Math.floor(pct) % 5 === 0) {
            onUpdateProgress(Math.floor(pct));
        }
      }
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      // If we had a saved progress, seek to it
      if (movie.progress && movie.progress > 0 && movie.progress < 95) {
          const seekTime = (movie.progress / 100) * videoRef.current.duration;
          videoRef.current.currentTime = seekTime;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="video-theater-overlay" className="fixed inset-0 bg-[#07070a] z-[999] flex flex-col justify-between p-4 md:p-8 animate-entrance-hero text-white">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center z-10">
        <div>
          <span className="text-xs uppercase text-primary tracking-widest font-bold font-label-md">ETHERIA THEATER ACTIVE</span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{movie.title}</h2>
          <p className="text-xs text-on-surface-variant line-clamp-1">{movie.tagline}</p>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className={`p-2 rounded-lg border transition-all ${
              showDiagnostics ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            title="Stream Diagnostics"
          >
            <Activity className="w-5 h-5" />
          </button>

          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-[#ffb4ab] transition-transform hover:scale-105"
            title="Exit Cinema Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Screen Projection Center */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden rounded-xl border border-white/10 bg-black shadow-[0_0_50px_rgba(124,77,255,0.15)] group">
        
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )}

        {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 text-red-400">
                {error}
            </div>
        )}

        <video 
          ref={videoRef}
          crossOrigin="anonymous"
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {activeSubtitleIndex !== null && mediaSourceId && (
            <track
              key={activeSubtitleIndex}
              kind="subtitles"
              src={`${getServerUrl()}/Videos/${movie.id}/${mediaSourceId}/Subtitles/${activeSubtitleIndex}/0/Stream.vtt?api_key=${localStorage.getItem('jellyfin_token')}`}
              srcLang={subtitles.find(s => s.Index === activeSubtitleIndex)?.Language || 'en'}
              label={subtitles.find(s => s.Index === activeSubtitleIndex)?.Title || 'Subtitle'}
              default
            />
          )}
        </video>

        {/* Floating Play/Pause State indicator overlay if clicked inside */}
        {!loading && !error && (
          <div 
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 cursor-pointer flex items-center justify-center bg-transparent"
          >
            <div className={`transition-opacity duration-300 p-4 rounded-full bg-black/60 border border-white/20 transform scale-100 ${isPlaying ? 'opacity-0 group-hover:opacity-100 scale-90' : 'opacity-100'}`}>
              {isPlaying ? <Pause className="w-12 h-12 text-primary" /> : <Play className="w-12 h-12 text-primary pl-1" />}
            </div>
          </div>
        )}

        {/* Technical Diagnostics Overlay */}
        {showDiagnostics && (
          <div className="absolute top-4 left-4 bg-black/90 p-4 rounded-xl border border-white/10 font-mono text-[10px] md:text-xs text-green-400 space-y-1.5 shadow-2xl backdrop-blur-md pointer-events-none z-30">
            <p className="text-white font-bold border-b border-white/10 pb-1 mb-1">STREAM DIAGNOSTICS</p>
            <p>Source: JellyFin Direct Stream</p>
            <p>Player: Native HTML5</p>
            <p>Duration: {formatTime(duration)}</p>
            <p>Current Time: {formatTime(currentTime)}</p>
          </div>
        )}
      </div>

      {/* Player Navigation Bottom Controls bar */}
      <div className="glass-card p-4 md:p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md z-10">
        {/* Progress Timeline seek bar */}
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-xs text-on-surface-variant w-12 text-center">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 accent-primary h-1.5 bg-white/15 rounded-lg cursor-pointer hover:h-2 transition-all"
            style={{
              background: `linear-gradient(to right, #cdbdff ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (duration || 1)) * 100}%)`,
            }}
          />
          <span className="font-mono text-xs text-on-surface-variant w-12 text-center">{formatTime(duration)}</span>
        </div>

        {/* Media Buttons Row */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          {/* Playback Controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-primary rounded-full text-on-primary hover:scale-105 transition-all shadow-[0_0_20px_rgba(205,189,255,0.3)] pulse-btn"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button 
              onClick={() => {
                const newTime = Math.max(0, currentTime - 10);
                setCurrentTime(newTime);
                if (videoRef.current) videoRef.current.currentTime = newTime;
              }}
              className="p-2 border border-white/10 hover:bg-white/10 rounded-lg text-on-surface transition-all"
              title="-10 Seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button 
              onClick={() => {
                const newTime = Math.min(duration, currentTime + 10);
                setCurrentTime(newTime);
                if (videoRef.current) videoRef.current.currentTime = newTime;
              }}
              className="p-2 border border-white/10 hover:bg-white/10 rounded-lg text-on-surface transition-all"
              title="+10 Seconds"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Volume and Audio controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 border border-white/10 hover:bg-white/10 rounded-lg transition-all"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setIsMuted(false);
              }}
              className="w-20 md:w-28 accent-primary h-1 bg-white/15 rounded-lg cursor-pointer"
            />
          </div>

          {/* Settings & Extras */}
          <div className="flex items-center gap-3">
            {/* Speed selection */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1 text-xs font-mono">
              <span className="text-on-surface-variant px-1.5 hidden md:inline">Speed</span>
              {[1, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    playbackSpeed === speed ? 'bg-primary text-on-primary font-bold' : 'hover:bg-white/15 text-on-surface-variant'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <button 
              className="p-2 border border-white/10 hover:bg-white/10 rounded-lg transition-all text-on-surface"
              title="Full Screen"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  document.getElementById('video-theater-overlay')?.requestFullscreen();
                }
              }}
            >
              <Maximize className="w-4 h-4" />
            </button>
            
            {/* Subtitles Button & Menu */}
            {subtitles.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                  className={`p-2 border border-white/10 hover:bg-white/10 rounded-lg transition-all text-on-surface ${
                    activeSubtitleIndex !== null ? 'bg-primary/20 text-primary border-primary/50' : ''
                  }`}
                  title="Subtitles"
                >
                  <Subtitles className="w-4 h-4" />
                </button>

                {showSubtitleMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#0c0a10] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2 border-b border-white/10 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Subtitles
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <button
                        onClick={() => {
                          setActiveSubtitleIndex(null);
                          setShowSubtitleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          activeSubtitleIndex === null ? 'bg-primary text-on-primary font-bold' : 'hover:bg-white/5 text-white'
                        }`}
                      >
                        Off
                      </button>
                      {subtitles.map((sub) => (
                        <button
                          key={sub.Index}
                          onClick={() => {
                            setActiveSubtitleIndex(sub.Index);
                            setShowSubtitleMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            activeSubtitleIndex === sub.Index ? 'bg-primary text-on-primary font-bold' : 'hover:bg-white/5 text-white'
                          }`}
                        >
                          {sub.Title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

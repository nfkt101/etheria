import React, { useState, useEffect, useRef } from 'react';
import { Movie } from '../types';
import { Play, Pause, Volume2, VolumeX, X, RotateCcw, Settings, SkipForward, Maximize, Subtitles, Activity, ArrowLeft } from 'lucide-react';
import { getPlaybackInfo, buildDirectStreamUrl, getServerUrl } from '../services/jellyfin';
import Hls from 'hls.js';

interface SubtitleTrack {
  Index: number;
  Language: string;
  Title: string;
  IsDefault: boolean;
}

interface AudioTrack {
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
  const [duration, setDuration] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Subtitles
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState<number | null>(null);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  
  // Audio Tracks
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  const [mediaSourceId, setMediaSourceId] = useState<string>('');
  
  // Inactivity timeout
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSubtitleMenu(false);
      }
    }, 2500);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    let isMounted = true;
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

        // Extract audio streams
        const audioStreams = streams.filter((s: any) => s.Type === 'Audio');
        const parsedAudio: AudioTrack[] = audioStreams.map((s: any) => ({
            Index: s.Index,
            Language: s.Language || 'Unknown',
            Title: s.Title || s.Language || 'Unknown',
            IsDefault: s.IsDefault || false
        }));
        setAudioTracks(parsedAudio);
        const defaultAudio = parsedAudio.find(s => s.IsDefault) || parsedAudio[0];
        let currentAudioIndex = defaultAudio ? defaultAudio.Index : undefined;
        if (defaultAudio) {
            setActiveAudioIndex(defaultAudio.Index);
        }

        const directUrl = buildDirectStreamUrl(movie.id, mSourceId, currentAudioIndex);

        const video = videoRef.current;
        if (!video || !isMounted) return;

        video.src = directUrl;
        
        video.onloadedmetadata = () => {
          if (!isMounted) return;
          setLoading(false);
          video.play().catch(e => {
            if (e.name !== 'AbortError') {
              console.error("Playback error:", e);
              if (isMounted) setError(`Playback error: ${e.message || 'Format not supported'}`);
            }
          });
        };
        
        video.onerror = (e) => {
          if (!isMounted) return;
          setError('Video playback failed. The browser might not support the format.');
          setLoading(false);
        };
        
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
      if (onUpdateProgress && videoRef.current.duration > 0) {
        const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        if (Math.floor(pct) % 5 === 0) {
            onUpdateProgress(Math.floor(pct));
        }
      }
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
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

  const handleAudioChange = (index: number) => {
    if (activeAudioIndex === index) return;
    const time = videoRef.current?.currentTime || 0;
    setActiveAudioIndex(index);
    if (videoRef.current) {
      videoRef.current.src = buildDirectStreamUrl(movie.id, mediaSourceId, index);
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(e => console.error(e));
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    resetControlsTimeout();
  };

  const skipTime = (amount: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + amount));
    setCurrentTime(newTime);
    if (videoRef.current) videoRef.current.currentTime = newTime;
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.getElementById('video-theater-wrapper')?.requestFullscreen();
    }
    resetControlsTimeout();
  };

  const progressPercent = (currentTime / (duration || 1)) * 100;

  return (
    <div 
      id="video-theater-wrapper" 
      className={`fixed inset-0 bg-black z-[999] flex flex-col justify-between overflow-hidden text-white ${!showControls && isPlaying ? 'cursor-none' : ''}`}
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      {/* Main Video Background */}
      <video 
        ref={videoRef}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlayPause}
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

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20 text-red-400 font-bold p-4 text-center">
          {error}
        </div>
      )}

      {/* Technical Diagnostics Overlay */}
      {showDiagnostics && (
        <div className="absolute top-20 left-4 bg-black/80 p-4 rounded-xl border border-white/10 font-mono text-[10px] md:text-xs text-green-400 space-y-1.5 shadow-2xl backdrop-blur-md pointer-events-none z-30">
          <p className="text-white font-bold border-b border-white/10 pb-1 mb-1">STREAM DIAGNOSTICS</p>
          <p>Source: JellyFin Stream</p>
          <p>Duration: {formatTime(duration)}</p>
          <p>Current Time: {formatTime(currentTime)}</p>
        </div>
      )}

      {/* UI Wrapper (Fades out when inactive) */}
      <div 
        className={`absolute inset-0 flex flex-col justify-between pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Top Header Gradient & Controls */}
        <div className="w-full bg-gradient-to-b from-black/80 via-black/40 to-transparent p-6 pointer-events-auto flex justify-between items-start pt-8">
          <button 
            onClick={onClose}
            className="group flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-8 h-8 text-white group-hover:text-primary transition-colors" />
          </button>
          
          <button 
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            title="Stream Diagnostics"
          >
            <Activity className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Controls Gradient & Controls */}
        <div className="w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-24 pb-6 px-4 md:px-8 pointer-events-auto space-y-4">
          
          {/* Progress Timeline */}
          <div className="flex items-center gap-4 group cursor-pointer relative" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            const newTime = clickPos * duration;
            setCurrentTime(newTime);
            if (videoRef.current) videoRef.current.currentTime = newTime;
          }}>
            <div className="w-full h-1 md:h-1.5 bg-white/30 rounded-full overflow-hidden transition-all duration-200 group-hover:h-2 md:group-hover:h-2.5 relative">
              <div 
                className="absolute top-0 left-0 h-full bg-primary"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-sm font-bold w-24 text-right hidden md:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Media Buttons Row */}
          <div className="flex justify-between items-center mt-2">
            
            <div className="flex items-center gap-4 md:gap-6">
              <button onClick={togglePlayPause} className="hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-current pl-1" />}
              </button>
              
              <button onClick={() => skipTime(-10)} className="hover:text-primary transition-colors" title="-10 Seconds">
                <RotateCcw className="w-6 h-6 md:w-7 md:h-7" />
              </button>
              
              <button onClick={() => skipTime(10)} className="hover:text-primary transition-colors" title="+10 Seconds">
                <SkipForward className="w-6 h-6 md:w-7 md:h-7" />
              </button>
              
              <div className="flex items-center gap-3 group relative">
                <button onClick={() => setIsMuted(!isMuted)} className="hover:text-primary transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-6 h-6 md:w-7 md:h-7" /> : <Volume2 className="w-6 h-6 md:w-7 md:h-7" />}
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
                  className="w-0 opacity-0 group-hover:w-24 group-hover:opacity-100 transition-all duration-300 accent-primary h-1 bg-white/30 rounded-full cursor-pointer overflow-hidden"
                />
              </div>

              <div className="hidden md:block border-l border-white/20 h-8 ml-2 pl-6">
                <h2 className="text-xl font-bold truncate max-w-sm">{movie.title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              {/* Speed Button */}
              <div className="relative group">
                <button className="font-bold text-sm md:text-base hover:text-primary transition-colors flex items-center gap-1">
                  {playbackSpeed}x
                </button>
                <div className="absolute bottom-full right-0 mb-4 bg-[#141416] border border-white/10 rounded-xl shadow-2xl py-2 w-16 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`w-full text-center py-2 text-sm transition-colors ${playbackSpeed === speed ? 'text-primary font-bold bg-white/5' : 'hover:bg-white/10 text-white'}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Menu */}
              {audioTracks.length > 1 && (
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowAudioMenu(!showAudioMenu);
                      setShowSubtitleMenu(false);
                    }}
                    className={`hover:text-primary transition-colors ${activeAudioIndex !== null ? 'text-primary' : ''}`}
                    title="Audio Tracks"
                  >
                    <Volume2 className="w-6 h-6 md:w-7 md:h-7" />
                  </button>

                  {showAudioMenu && (
                    <div className="absolute bottom-full right-0 mb-4 bg-[#141416] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 w-48">
                      <div className="p-3 border-b border-white/10 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        Audio
                      </div>
                      <div className="max-h-48 overflow-y-auto hide-scrollbar">
                        {audioTracks.map((audio) => (
                          <button
                            key={audio.Index}
                            onClick={() => {
                              handleAudioChange(audio.Index);
                              setShowAudioMenu(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${activeAudioIndex === audio.Index ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/10 text-white'}`}
                          >
                            {audio.Title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subtitles Menu */}
              {subtitles.length > 0 && (
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowSubtitleMenu(!showSubtitleMenu);
                      setShowAudioMenu(false);
                    }}
                    className={`hover:text-primary transition-colors ${activeSubtitleIndex !== null ? 'text-primary' : ''}`}
                    title="Subtitles"
                  >
                    <Subtitles className="w-6 h-6 md:w-7 md:h-7" />
                  </button>

                  {showSubtitleMenu && (
                    <div className="absolute bottom-full right-0 mb-4 bg-[#141416] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 w-48">
                      <div className="p-3 border-b border-white/10 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        Subtitles
                      </div>
                      <div className="max-h-48 overflow-y-auto hide-scrollbar">
                        <button
                          onClick={() => {
                            setActiveSubtitleIndex(null);
                            setShowSubtitleMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${activeSubtitleIndex === null ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/10 text-white'}`}
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
                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${activeSubtitleIndex === sub.Index ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/10 text-white'}`}
                          >
                            {sub.Title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen Toggle */}
              <button onClick={toggleFullscreen} className="hover:text-primary transition-colors">
                <Maximize className="w-6 h-6 md:w-7 md:h-7" />
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

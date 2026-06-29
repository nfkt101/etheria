import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X, RotateCcw, SkipForward, Maximize, Subtitles, Activity, ArrowLeft, Upload } from 'lucide-react';
import { getPlaybackInfo, buildDirectStreamUrl, buildSubtitleUrl, reportPlaybackProgress, reportPlaybackStopped } from '../api/playback';
import { getServerUrl } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { useAuthStore } from '../store/authStore';

interface SubtitleTrack {
  Index: number;
  Language: string;
  Title: string;
  IsDefault: boolean;
  Url?: string;
}
interface AudioTrack { Index: number; Language: string; Title: string; IsDefault: boolean; }

// Robust SRT to WebVTT converter
function srtToVtt(srtText: string): string {
  let text = srtText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let vtt = 'WEBVTT\n\n';
  const blocks = text.split('\n\n');
  
  for (let block of blocks) {
    if (!block.trim()) continue;
    const lines = block.split('\n');
    let startIdx = 0;
    if (/^\d+$/.test(lines[0].trim())) {
      startIdx = 1;
    }
    if (lines.length > startIdx) {
      const timeLine = lines[startIdx].trim();
      if (timeLine.includes('-->')) {
        const vttTimeLine = timeLine.replace(/,/g, '.');
        vtt += vttTimeLine + '\n';
        for (let i = startIdx + 1; i < lines.length; i++) {
          vtt += lines[i] + '\n';
        }
        vtt += '\n';
      }
    }
  }
  return vtt;
}

export default function VideoPlayer() {
  const activeItem = usePlayerStore((s) => s.activeItem);
  const close = usePlayerStore((s) => s.close);
  const updateProgress = usePlayerStore((s) => s.updateProgress);
  const userId = useAuthStore((s) => s.userId);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState<number | null>(null);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [mediaSourceId, setMediaSourceId] = useState('');
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressReportRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSubtitleMenu(false);
      }
    }, 2500);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    if (!activeItem) return;
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);
        setError('');

        if (activeItem.isLocal) {
          const video = videoRef.current;
          if (!video || !mounted) return;
          video.src = activeItem.localUrl || '';
          
          if (activeItem.localSubtitleUrl) {
            setSubtitles([
              { Index: 999, Language: 'Local', Title: 'External Subtitles', IsDefault: true, Url: activeItem.localSubtitleUrl }
            ]);
            setActiveSubtitleIndex(999);
          } else {
            setSubtitles([]);
          }

          video.onloadedmetadata = () => {
            if (!mounted) return;
            setLoading(false);
            const progressKey = `etheria_local_progress_${activeItem.id}`;
            const savedProgress = localStorage.getItem(progressKey);
            if (savedProgress) {
              const savedTime = parseFloat(savedProgress);
              if (savedTime > 0 && savedTime < video.duration - 5) {
                video.currentTime = savedTime;
              }
            } else if (activeItem.progress > 0 && activeItem.progress < 95) {
              video.currentTime = (activeItem.progress / 100) * video.duration;
            }
            video.play().catch((e) => {
              if (e.name !== 'AbortError' && mounted) setError(`Playback error: ${e.message}`);
            });
          };

          video.onerror = () => {
            if (!mounted) return;
            setError('Video playback failed. Check if your platform supports this file format/codec.');
            setLoading(false);
          };
          return;
        }

        // Standard Jellyfin media initialization
        if (!userId) return;
        const info = await getPlaybackInfo(activeItem.id, userId);
        if (!info.MediaSources?.length) throw new Error('No media sources available');

        const src = info.MediaSources[0];
        if (!mounted) return;
        setMediaSourceId(src.Id);

        const streams = src.MediaStreams || [];
        const subs: SubtitleTrack[] = streams
          .filter((s: any) => s.Type === 'Subtitle' && s.IsTextSubtitleStream)
          .map((s: any) => ({ Index: s.Index, Language: s.Language || 'Unknown', Title: s.Title || s.Language || 'Unknown', IsDefault: s.IsDefault || false }));
        setSubtitles(subs);
        const defSub = subs.find((s) => s.IsDefault);
        if (defSub) setActiveSubtitleIndex(defSub.Index);

        const audio: AudioTrack[] = streams
          .filter((s: any) => s.Type === 'Audio')
          .map((s: any) => ({ Index: s.Index, Language: s.Language || 'Unknown', Title: s.Title || s.Language || 'Unknown', IsDefault: s.IsDefault || false }));
        setAudioTracks(audio);
        const defAudio = audio.find((s) => s.IsDefault) || audio[0];
        const audioIdx = defAudio?.Index;
        if (defAudio) setActiveAudioIndex(defAudio.Index);

        const video = videoRef.current;
        if (!video || !mounted) return;
        video.src = buildDirectStreamUrl(activeItem.id, src.Id, audioIdx);
        video.onloadedmetadata = () => {
          if (!mounted) return;
          setLoading(false);
          if (activeItem.progress > 0 && activeItem.progress < 95) {
            video.currentTime = (activeItem.progress / 100) * video.duration;
          }
          video.play().catch((e) => {
            if (e.name !== 'AbortError' && mounted) setError(`Playback error: ${e.message}`);
          });
        };
        video.onerror = () => {
          if (!mounted) return;
          setError('Video playback failed. The browser may not support the format.');
          setLoading(false);
        };
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || 'Failed to load video stream');
        setLoading(false);
      }
    };

    init();

    // Report progress to Jellyfin every 30s
    if (!activeItem.isLocal && userId) {
      progressReportRef.current = setInterval(() => {
        if (videoRef.current && userId && activeItem) {
          const ticks = Math.floor(videoRef.current.currentTime * 10_000_000);
          reportPlaybackProgress(activeItem.id, userId, ticks, !isPlaying);
        }
      }, 30_000);
    }

    return () => {
      mounted = false;
      if (progressReportRef.current) clearInterval(progressReportRef.current);
      if (videoRef.current) {
        if (activeItem.isLocal) {
          const progressKey = `etheria_local_progress_${activeItem.id}`;
          localStorage.setItem(progressKey, String(videoRef.current.currentTime));
          
          const historyStr = localStorage.getItem('etheria_local_history');
          if (historyStr) {
            try {
              const history = JSON.parse(historyStr);
              const idx = history.findIndex((h: any) => h.id === activeItem.id);
              if (idx !== -1) {
                const pct = Math.floor((videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100);
                history[idx].progress = pct;
                history[idx].lastPlayedDate = new Date().toISOString();
                localStorage.setItem('etheria_local_history', JSON.stringify(history));
              }
            } catch (e) {
              console.error(e);
            }
          }
        } else if (userId) {
          const ticks = Math.floor((videoRef.current.currentTime || 0) * 10_000_000);
          reportPlaybackStopped(activeItem.id, userId, ticks);
        }
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [activeItem?.id, userId]);

  useEffect(() => {
    if (!videoRef.current) return;
    isPlaying
      ? videoRef.current.play().catch(() => {})
      : videoRef.current.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    if (videoRef.current.duration > 0) {
      const pct = (time / videoRef.current.duration) * 100;
      if (Math.floor(pct) % 5 === 0) {
        updateProgress(Math.floor(pct));
        
        if (activeItem.isLocal) {
          const progressKey = `etheria_local_progress_${activeItem.id}`;
          localStorage.setItem(progressKey, String(time));
          
          const historyStr = localStorage.getItem('etheria_local_history');
          if (historyStr) {
            try {
              const history = JSON.parse(historyStr);
              const idx = history.findIndex((h: any) => h.id === activeItem.id);
              if (idx !== -1) {
                history[idx].progress = Math.floor(pct);
                history[idx].lastPlayedDate = new Date().toISOString();
                localStorage.setItem('etheria_local_history', JSON.stringify(history));
              }
            } catch (e) {}
          }
        }
      }
    }
  };

  const handleAudioChange = (index: number) => {
    if (activeAudioIndex === index || !videoRef.current || activeItem.isLocal) return;
    const time = videoRef.current.currentTime;
    setActiveAudioIndex(index);
    videoRef.current.src = buildDirectStreamUrl(activeItem.id, mediaSourceId, index);
    videoRef.current.currentTime = time;
    videoRef.current.play().catch(() => {});
  };

  const handleCustomSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      let vttText = text;
      if (file.name.endsWith('.srt')) {
        vttText = srtToVtt(text);
      }
      
      const blob = new Blob([vttText], { type: 'text/vtt' });
      const url = URL.createObjectURL(blob);
      const newTrackIndex = subtitles.length + 1000;
      
      const newTrack: SubtitleTrack = {
        Index: newTrackIndex,
        Language: 'Custom',
        Title: file.name,
        IsDefault: true,
        Url: url
      };
      
      setSubtitles((prev) => [...prev, newTrack]);
      setActiveSubtitleIndex(newTrackIndex);
      setShowSubtitleMenu(false);
    };
    reader.readAsText(file);
  };

  const skipTime = (amount: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + amount));
    setCurrentTime(newTime);
    if (videoRef.current) videoRef.current.currentTime = newTime;
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.getElementById('video-theater-wrapper')?.requestFullscreen();
    resetControlsTimeout();
  };

  const formatTime = (s: number) => {
    if (isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`
      : `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (!activeItem) return null;
  const pct = (currentTime / (duration || 1)) * 100;

  const currentSub = subtitles.find((s) => s.Index === activeSubtitleIndex);

  return (
    <div
      id="video-theater-wrapper"
      className={`fixed inset-0 bg-black z-[999] flex flex-col justify-between overflow-hidden text-white ${!showControls && isPlaying ? 'cursor-none' : ''}`}
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-contain animate-entrance"
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={() => setDuration(videoRef.current?.duration || 1)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={() => setIsPlaying((p) => !p)}
      >
        {activeSubtitleIndex !== null && currentSub && (
          <track
            key={activeSubtitleIndex}
            kind="subtitles"
            src={currentSub.Url || (mediaSourceId ? buildSubtitleUrl(activeItem.id, mediaSourceId, activeSubtitleIndex) : '')}
            srcLang={currentSub.Language || 'en'}
            label={currentSub.Title || 'Subtitle'}
            default
          />
        )}
      </video>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20 text-red-400 font-bold p-6 text-center max-w-xl mx-auto rounded-3xl border border-red-500/10 flex-col gap-4">
          <p>{error}</p>
          <button onClick={close} className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm transition-all cursor-pointer">
            Go Back
          </button>
        </div>
      )}
      {showDiagnostics && (
        <div className="absolute top-24 left-6 bg-[#141416]/95 p-5 rounded-2xl border border-white/10 font-mono text-[10px] md:text-xs text-green-400 space-y-2 shadow-2xl backdrop-blur-md pointer-events-none z-30 max-w-sm">
          <p className="text-white font-bold border-b border-white/10 pb-1 mb-1 tracking-wider">ETHERIA DIAGNOSTICS</p>
          <p>Playback: {activeItem.isLocal ? 'Local File' : 'Jellyfin Cloud'}</p>
          <p>Duration: {formatTime(duration)}</p>
          <p>Current: {formatTime(currentTime)}</p>
          {activeItem.isLocal ? (
            <p className="break-all">Path: {activeItem.localPath || 'Local Asset URL'}</p>
          ) : (
            <p>Server: {getServerUrl()}</p>
          )}
        </div>
      )}

      <div className={`absolute inset-0 flex flex-col justify-between pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top bar */}
        <div className="w-full bg-gradient-to-b from-black/80 via-black/40 to-transparent p-6 pointer-events-auto flex justify-between items-start pt-8">
          <button onClick={close} className="group flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-8 h-8 text-white group-hover:text-primary transition-colors" />
          </button>
          <button onClick={() => setShowDiagnostics((d) => !d)} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white">
            <Activity className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom controls */}
        <div className="w-full bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-24 pb-8 px-4 md:px-8 pointer-events-auto space-y-4">
          {/* Scrubber */}
          <div
            className="flex items-center gap-4 group cursor-pointer relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const newTime = ((e.clientX - rect.left) / rect.width) * duration;
              setCurrentTime(newTime);
              if (videoRef.current) videoRef.current.currentTime = newTime;
            }}
          >
            <div className="w-full h-1 md:h-1.5 bg-white/30 rounded-full overflow-hidden transition-all duration-200 group-hover:h-2 md:group-hover:h-2.5 relative">
              <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <span className="font-mono text-sm font-bold w-24 text-right hidden md:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-4 md:gap-6">
              <button onClick={() => setIsPlaying((p) => !p)} className="hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-current pl-1" />}
              </button>
              <button onClick={() => skipTime(-10)} className="hover:text-primary transition-colors">
                <RotateCcw className="w-6 h-6 md:w-7 md:h-7" />
              </button>
              <button onClick={() => skipTime(10)} className="hover:text-primary transition-colors">
                <SkipForward className="w-6 h-6 md:w-7 md:h-7" />
              </button>
              <div className="flex items-center gap-3 group relative">
                <button onClick={() => setIsMuted((m) => !m)} className="hover:text-primary transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-6 h-6 md:w-7 md:h-7" /> : <Volume2 className="w-6 h-6 md:w-7 md:h-7" />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
                  className="w-0 opacity-0 group-hover:w-24 group-hover:opacity-100 transition-all duration-300 accent-primary h-1 bg-white/30 rounded-full cursor-pointer overflow-hidden"
                />
              </div>
              <div className="hidden md:block border-l border-white/20 h-8 ml-2 pl-6">
                <h2 className="text-xl font-bold truncate max-w-sm">{activeItem.title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              {/* Speed */}
              <div className="relative group">
                <button className="font-bold text-sm md:text-base hover:text-primary transition-colors">
                  {playbackSpeed}x
                </button>
                <div className="absolute bottom-full right-0 mb-4 bg-[#141416] border border-white/10 rounded-xl shadow-2xl py-2 w-16 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {[0.5, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => setPlaybackSpeed(s)}
                      className={`w-full text-center py-2 text-sm transition-colors ${playbackSpeed === s ? 'text-primary font-bold bg-white/5' : 'hover:bg-white/10 text-white'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Tracks (Disabled for local streams since browser handle demuxing automatically) */}
              {audioTracks.length > 1 && !activeItem.isLocal && (
                <div className="relative">
                  <button
                    onClick={() => { setShowAudioMenu((m) => !m); setShowSubtitleMenu(false); }}
                    className={`hover:text-primary transition-colors ${activeAudioIndex !== null ? 'text-primary' : ''}`}
                  >
                    <Volume2 className="w-6 h-6 md:w-7 md:h-7" />
                  </button>
                  {showAudioMenu && (
                    <div className="absolute bottom-full right-0 mb-4 bg-[#141416] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 w-48">
                      <div className="p-3 border-b border-white/10 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Audio</div>
                      <div className="max-h-48 overflow-y-auto hide-scrollbar">
                        {audioTracks.map((a) => (
                          <button
                            key={a.Index}
                            onClick={() => { handleAudioChange(a.Index); setShowAudioMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${activeAudioIndex === a.Index ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/10 text-white'}`}
                          >
                            {a.Title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subtitles */}
              <div className="relative">
                <button
                  onClick={() => { setShowSubtitleMenu((m) => !m); setShowAudioMenu(false); }}
                  className={`hover:text-primary transition-colors ${activeSubtitleIndex !== null ? 'text-primary' : ''}`}
                >
                  <Subtitles className="w-6 h-6 md:w-7 md:h-7" />
                </button>
                {showSubtitleMenu && (
                  <div className="absolute bottom-full right-0 mb-4 bg-[#141416] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 w-60">
                    <div className="p-3 border-b border-white/10 text-xs font-bold text-on-surface-variant uppercase tracking-wider flex justify-between items-center">
                      <span>Subtitles</span>
                      <label htmlFor="player-sub-upload" className="flex items-center gap-1 text-[10px] text-primary hover:text-white cursor-pointer transition-colors">
                        <Upload className="w-3 h-3" /> Load SRT/VTT
                      </label>
                      <input id="player-sub-upload" type="file" accept=".vtt,.srt" onChange={handleCustomSubtitleUpload} className="hidden" />
                    </div>
                    <div className="max-h-48 overflow-y-auto hide-scrollbar">
                      <button
                        onClick={() => { setActiveSubtitleIndex(null); setShowSubtitleMenu(false); }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${activeSubtitleIndex === null ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/10 text-white'}`}
                      >
                        Off
                      </button>
                      {subtitles.map((sub) => (
                        <button
                          key={sub.Index}
                          onClick={() => { setActiveSubtitleIndex(sub.Index); setShowSubtitleMenu(false); }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${activeSubtitleIndex === sub.Index ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/10 text-white'}`}
                        >
                          {sub.Title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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

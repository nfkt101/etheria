import React, { useState, useEffect, useRef } from 'react';
import { Movie } from '../types';
import { Play, Pause, Volume2, VolumeX, X, RotateCcw, Settings, SkipForward, Maximize, Subtitles, Activity } from 'lucide-react';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
  onUpdateProgress?: (progress: number) => void;
}

// Synced subtitles for each movie key
const SUBTITLES: { [movieId: string]: { time: number; text: string }[] } = {
  'dune-2': [
    { time: 2, text: "Narrator: 'Power over spice is power over all...'" },
    { time: 6, text: "Paul Atreides: 'The desert winds are speaking. They tell of a path.'" },
    { time: 11, text: "Chani: 'If you want to lead my people, you must first survive them.'" },
    { time: 17, text: "Paul: 'We will fight alongside the Fremen. Long live the fighters!'" },
    { time: 23, text: "[Deep cinematic syntesizer chords crescendo]" },
    { time: 28, text: "Fremen Elder: 'A storm is coming. One that will sweep across the universe.'" },
  ],
  'foundation': [
    { time: 2, text: "Gaal Dornick: 'When I was young, I believed math was the simple truth.'" },
    { time: 7, text: "Hari Seldon: 'The math tells us a single narrative: the empire falls.'" },
    { time: 13, text: "Brother Day: 'Do you dare to predict the end of our dynasty?'" },
    { time: 18, text: "Seldon: 'I predict the duration of the darkness. Only a Foundation can shorten it.'" },
    { time: 24, text: "[Hyperdrive hums as stars blur into tunnels of light]" },
  ],
  'arcane': [
    { time: 2, text: "Vi: 'Are you ready, Powder?'" },
    { time: 6, text: "Powder: 'I made these bombs. They're going to work this time. I know it.'" },
    { time: 11, text: "Silco: 'There is a monster inside of everyone. You just have to let it out.'" },
    { time: 17, text: "Vi: 'We had a deal! We protect each other!'" },
    { time: 22, text: "[Electric action music kicks in with visual distortion]" },
  ],
  'interstellar': [
    { time: 2, text: "Cooper: 'We used to look up at the sky and wonder at our place in the stars.'" },
    { time: 8, text: "Brand: 'Now we just look down and worry about our place in the dirt.'" },
    { time: 13, text: "Cooper: 'This world is a treasure, Donald. But she\'s been telling us to leave for a while.'" },
    { time: 19, text: "TARS: 'Initiating wormhole entry. Hold on to your seats.'" },
    { time: 25, text: "[Orchestral pipe organ chords intensifies]" },
  ],
  'neo-tokyo': [
    { time: 2, text: "[SYS]: 'Connecting to Neo Tokyo Sub-mesh... OK.'" },
    { time: 6, text: "Sterling: 'The neon never sleeps. Neither do the viruses in the main core.'" },
    { time: 11, text: "Synthetic: 'I remember the rain, Jack. But I was never programmed to cry.'" },
    { time: 17, text: "Sterling: 'A soul isn\'t code. It\'s what remains when the system crashes.'" },
  ],
};

export default function VideoPlayer({ movie, onClose, onUpdateProgress }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(movie.progress ? Math.floor((movie.progress / 100) * 120) : 0);
  const duration = 120; // 2 minutes representation
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [captionEnabled, setCaptionEnabled] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Ref for local interval & particle canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto update simulation loop
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          const next = prev + 1;
          // Callback to parent to update watch progress
          if (onUpdateProgress) {
            onUpdateProgress(Math.floor((next / duration) * 100));
          }
          return next;
        });
      }, 1000 / playbackSpeed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Particle simulation for video screen fallback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; vx: number; vy: number; radius: number; color: string }[] = [];

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 450;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Seed colors based on movie genres or theme
    const themeColors = movie.id === 'dune-2' 
      ? ['#ffbe53', '#ff8400', '#631d04', '#475371'] 
      : movie.id === 'arcane'
      ? ['#14d1ff', '#cdbdff', '#7c4dff', '#003543']
      : ['#a6e6ff', '#7c4dff', '#cdbdff', '#131313'];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 3 + 1,
        color: themeColors[Math.floor(Math.random() * themeColors.length)],
      });
    }

    const draw = () => {
      if (!ctx || !canvas) return;
      
      // Clear with dark ambient fade
      ctx.fillStyle = 'rgba(10, 10, 14, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render nebulous glowing gas clouds in mock player
      const timeFactor = Date.now() * 0.001;
      const gradient = ctx.createRadialGradient(
        canvas.width / 2 + Math.cos(timeFactor * 0.5) * (canvas.width * 0.25),
        canvas.height / 2 + Math.sin(timeFactor * 0.7) * (canvas.height * 0.25),
        10,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.6
      );
      
      gradient.addColorStop(0, movie.id === 'dune-2' ? 'rgba(215, 100, 10, 0.15)' : 'rgba(124, 77, 255, 0.12)');
      gradient.addColorStop(0.5, 'rgba(20, 14, 30, 0.05)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isPlaying) {
        // Draw orbital particle points representing streaming pixels
        particles.forEach((p) => {
          p.x += p.vx * playbackSpeed;
          p.y += p.vy * playbackSpeed;

          // Constraints
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
        });
        ctx.shadowBlur = 0; // reset
      } else {
        // Draw static warning
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, movie, playbackSpeed]);

  // Subtitle selection
  const getActiveSubtitle = () => {
    const movieSubs = SUBTITLES[movie.id] || SUBTITLES['dune-2']; // fallback to dune
    const match = [...movieSubs].reverse().find((sub) => currentTime >= sub.time);
    return match ? match.text : '';
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  return (
    <div id="video-theater-overlay" className="fixed inset-0 bg-[#07070a]/98 z-[999] flex flex-col justify-between p-4 md:p-8 animate-entrance-hero text-white">
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
            onClick={() => setCaptionEnabled(!captionEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              captionEnabled ? 'bg-secondary-container/20 border-secondary-container text-[#4cd6ff]' : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            title="Toggle Subtitles"
          >
            <Subtitles className="w-5 h-5" />
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
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden rounded-xl border border-white/10 bg-black/50 shadow-[0_0_50px_rgba(124,77,255,0.15)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

        {/* Sync Text Display overlay */}
        {captionEnabled && getActiveSubtitle() && (
          <div className="absolute bottom-8 px-6 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-center font-medium max-w-xl text-sm md:text-body-md text-primary-fixed shadow-xl transform transition-all animate-pulse">
            {getActiveSubtitle()}
          </div>
        )}

        {/* Floating Play/Pause State indicator overlay if clicked inside */}
        <div 
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute inset-0 cursor-pointer flex items-center justify-center bg-transparent group"
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity p-4 rounded-full bg-black/60 border border-white/20 transform scale-90 group-hover:scale-100 duration-300">
            {isPlaying ? <Pause className="w-8 h-8 text-primary" /> : <Play className="w-8 h-8 text-primary" />}
          </div>
        </div>

        {/* Technical Diagnostics Overlay */}
        {showDiagnostics && (
          <div className="absolute top-4 left-4 bg-black/90 p-4 rounded-xl border border-white/10 font-mono text-[10px] md:text-xs text-green-400 space-y-1.5 shadow-2xl backdrop-blur-md pointer-events-none">
            <p className="text-white font-bold border-b border-white/10 pb-1 mb-1">STREAM DIAGNOSTICS</p>
            <p>Codec: AV1 Main profile (10-bit)</p>
            <p>Source resolution: 3840x2160 (4K UHD)</p>
            <p>Bitrate: {(18.4 + Math.sin(currentTime) * 1.5).toFixed(2)} Mbps</p>
            <p>Framerate: {isPlaying ? '23.976 FPS (Stable)' : '0 FPS (Idle)'}</p>
            <p>Audio channel: Dolby Atmos TrueHD 7.1</p>
            <p>Buffer Ahead: 24.3 seconds</p>
            <p>Vite Context: Live WebSocket Proxy</p>
          </div>
        )}
      </div>

      {/* Player Navigation Bottom Controls bar */}
      <div className="glass-card p-4 md:p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md z-10">
        {/* Progress Timeline seek bar */}
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-xs text-on-surface-variant">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 accent-primary h-1.5 bg-white/15 rounded-lg cursor-pointer hover:h-2 transition-all"
            style={{
              background: `linear-gradient(to right, #cdbdff ${(currentTime / duration) * 100}%, rgba(255,255,255,0.1) ${(currentTime / duration) * 100}%)`,
            }}
          />
          <span className="font-mono text-xs text-on-surface-variant">{formatTime(duration)}</span>
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
              onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
              className="p-2 border border-white/10 hover:bg-white/10 rounded-lg text-on-surface transition-all"
              title="-10 Seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
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
              <span className="text-on-surface-variant px-1.5">Speed</span>
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
              title="Full Screen Simulator"
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
          </div>
        </div>
      </div>
    </div>
  );
}

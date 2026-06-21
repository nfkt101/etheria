import React, { useState, useEffect } from 'react';
import { Movie, ActiveTab } from './types';
import { MOVIES, PROFILE_AVATAR } from './data';
import ShaderBackground from './components/ShaderBackground';
import MainBrowse from './components/MainBrowse';
import DetailModal from './components/DetailModal';
import VideoPlayer from './components/VideoPlayer';
import SearchPanel from './components/SearchPanel';
import DownloadsPanel from './components/DownloadsPanel';
import ServerMonitor from './components/ServerMonitor';
import ProfilePanel from './components/ProfilePanel';
import { 
  Tv, Film, Search, Download, Server, User, List, Menu, X, ArrowLeft, Heart, Layers
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activePlayingMovie, setActivePlayingMovie] = useState<Movie | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // User details
  const cleanUserName = 'Nihal Farhan';

  // Persistence States synced with localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('etheria_favorites');
    return saved ? JSON.parse(saved) : ['dune-2', 'foundation'];
  });

  const [downloads, setDownloads] = useState<{ [movieId: string]: 'queued' | 'downloading' | 'completed' | number }>(() => {
    const saved = localStorage.getItem('etheria_downloads');
    return saved ? JSON.parse(saved) : { 'foundation': 'completed', 'arcane': 15 };
  });

  const [watchHistory, setWatchHistory] = useState<{ movieId: string; timestamp: number; progress: number }[]>(() => {
    const saved = localStorage.getItem('etheria_watch_history');
    return saved ? JSON.parse(saved) : [
      { movieId: 'foundation', timestamp: Date.now() - 3600000 * 2, progress: 65 },
      { movieId: 'arcane', timestamp: Date.now() - 3600000 * 24, progress: 30 }
    ];
  });

  // Write changes back to LocalStorage
  useEffect(() => {
    localStorage.setItem('etheria_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('etheria_downloads', JSON.stringify(downloads));
  }, [downloads]);

  useEffect(() => {
    localStorage.setItem('etheria_watch_history', JSON.stringify(watchHistory));
  }, [watchHistory]);

  // Handle addition or deletion into favorites core
  const toggleMyList = (movieId: string) => {
    setFavorites((prev) => {
      if (prev.includes(movieId)) {
        return prev.filter((id) => id !== movieId);
      } else {
        return [...prev, movieId];
      }
    });
  };

  // Simulate a gradual download progress animation
  const triggerDownload = (movieId: string) => {
    if (downloads[movieId] !== undefined) return;

    setDownloads((prev) => ({ ...prev, [movieId]: 'queued' }));
    
    let pct = 0;
    const interval = setInterval(() => {
      pct += 10;
      if (pct >= 100) {
        clearInterval(interval);
        setDownloads((prev) => ({ ...prev, [movieId]: 'completed' }));
      } else {
        setDownloads((prev) => ({ ...prev, [movieId]: pct }));
      }
    }, 800);
  };

  const removeDownload = (movieId: string) => {
    setDownloads((prev) => {
      const next = { ...prev };
      delete next[movieId];
      return next;
    });
  };

  // Trigger media plays from browse or details
  const playMovie = (movie: Movie) => {
    setActivePlayingMovie(movie);
    // Append to watch history log
    setWatchHistory((prev) => {
      const filtered = prev.filter((item) => item.movieId !== movie.id);
      return [{ movieId: movie.id, timestamp: Date.now(), progress: movie.progress || 0 }, ...filtered];
    });
  };

  // Update media play progress state
  const updateWatchProgress = (progress: number) => {
    if (!activePlayingMovie) return;
    
    // update current watchlist
    setWatchHistory((prev) => {
      return prev.map((item) => {
        if (item.movieId === activePlayingMovie.id) {
          return { ...item, progress, timestamp: Date.now() };
        }
        return item;
      });
    });

    MOVIES.forEach((m) => {
      if (m.id === activePlayingMovie.id) {
        m.progress = progress;
      }
    });
  };

  // Switch navigation tabs helper
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <MainBrowse 
            movies={MOVIES}
            favorites={favorites}
            onToggleMyList={toggleMyList}
            onSelectMovie={setSelectedMovie}
            onPlayMovie={playMovie}
          />
        );
      case 'movies':
        return (
          <MainBrowse 
            movies={MOVIES.filter((m) => m.type === 'movie')}
            favorites={favorites}
            onToggleMyList={toggleMyList}
            onSelectMovie={setSelectedMovie}
            onPlayMovie={playMovie}
          />
        );
      case 'tv-shows':
        return (
          <MainBrowse 
            movies={MOVIES.filter((m) => m.type === 'tv')}
            favorites={favorites}
            onToggleMyList={toggleMyList}
            onSelectMovie={setSelectedMovie}
            onPlayMovie={playMovie}
          />
        );
      case 'search':
        return (
          <SearchPanel 
            movies={MOVIES}
            onSelectMovie={setSelectedMovie}
          />
        );
      case 'downloads':
        return (
          <DownloadsPanel 
            movies={MOVIES}
            downloads={downloads}
            onPlay={playMovie}
            onRemoveDownload={removeDownload}
          />
        );
      case 'server':
        return <ServerMonitor />;
      case 'profile':
        return (
          <ProfilePanel 
            movies={MOVIES}
            favorites={favorites}
            watchHistory={watchHistory}
            userName={cleanUserName}
            onSelectMovie={setSelectedMovie}
            onClearHistory={() => setWatchHistory([])}
          />
        );
      default:
        return null;
    }
  };

  // Bottom / Sidebar Navigation List Items for mobile viewports
  const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home Showcase', icon: <Tv className="w-5 h-5" /> },
    { id: 'movies', label: 'Films', icon: <Film className="w-5 h-5 text-[#14d1ff]" /> },
    { id: 'tv-shows', label: 'TV Shows', icon: <Layers className="w-5 h-5 text-amber-400" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-5 h-5" /> },
    { id: 'downloads', label: 'Downloads', icon: <Download className="w-5 h-5" /> },
    { id: 'server', label: 'Server Dev', icon: <Server className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen text-on-background bg-[#0c0a10] flex flex-col pb-20 md:pb-6 relative leading-relaxed overflow-x-hidden select-none">
      {/* Background WebGL noise compiler */}
      <ShaderBackground />

      {/* Control viewport dashboard / Dynamic Status Badge */}
      <div className="relative max-w-7xl mx-auto w-full px-4 md:px-8 pt-6 pb-2 z-40 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-400 rounded-full inline-block animate-ping" />
          <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest leading-none">
            ETHERIA DYNAMIC DISPLAY AUTO-SYNC
          </span>
        </div>
        <div className="text-[10px] text-on-surface-variant font-mono text-center sm:text-right">
          Responsive Cinematic Layout Engine • Active
        </div>
      </div>

      {/* Top Application Header */}
      <header className="relative z-40 max-w-7xl mx-auto w-full px-4 md:px-8 py-3 shrink-0">
        <div className="glass-card bg-surface/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-2xl">
          
          <div className="flex items-center gap-4 lg:gap-10">
            {/* Mobile Hamburger menu toggle button */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 md:hidden text-primary border border-white/10 hover:border-white/20 rounded-xl hover:bg-white/5 active:scale-95 transition-all outline-none"
              title="Toggle Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Brand Logo text pairing */}
            <span 
              onClick={() => setActiveTab('home')} 
              className="font-display-lg text-xl md:text-2xl font-black tracking-tight text-primary cursor-pointer select-none"
            >
              ETHERIA
            </span>

            {/* Horizontal Nav Links for larger screens (md and above) */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-8 select-none">
              <button 
                onClick={() => { setActiveTab('home'); setMenuOpen(false); }}
                className={`text-xs lg:text-sm font-bold tracking-wide transition-all duration-300 pb-0.5 ${activeTab === 'home' ? 'text-primary border-b border-primary' : 'text-on-surface-variant hover:text-white'}`}
              >
                Home
              </button>
              <button 
                onClick={() => { setActiveTab('movies'); setMenuOpen(false); }}
                className={`text-xs lg:text-sm font-bold tracking-wide transition-all duration-300 pb-0.5 ${activeTab === 'movies' ? 'text-primary border-b border-primary' : 'text-on-surface-variant hover:text-white'}`}
              >
                Cinematic Films
              </button>
              <button 
                onClick={() => { setActiveTab('tv-shows'); setMenuOpen(false); }}
                className={`text-xs lg:text-sm font-bold tracking-wide transition-all duration-300 pb-0.5 ${activeTab === 'tv-shows' ? 'text-primary border-b border-primary' : 'text-on-surface-variant hover:text-white'}`}
              >
                Exclusive TV
              </button>
            </nav>
          </div>

          {/* Quick utility icons and user profile trigger */}
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2 select-none">
              {/* Search utility */}
              <button 
                onClick={() => { setActiveTab('search'); setMenuOpen(false); }}
                className={`p-2 rounded-xl border transition-all ${activeTab === 'search' ? 'border-primary/50 bg-[#7c4dff]/15 text-primary' : 'border-white/5 bg-white/3 hover:bg-white/8 text-on-surface'}`}
                title="Search Engine"
              >
                <Search className="w-4 h-4" />
              </button>
              
              {/* Downloads queue */}
              <button 
                onClick={() => { setActiveTab('downloads'); setMenuOpen(false); }}
                className={`p-2 rounded-xl border transition-all ${activeTab === 'downloads' ? 'border-primary/50 bg-[#7c4dff]/15 text-primary' : 'border-white/5 bg-white/3 hover:bg-white/8 text-on-surface'}`}
                title="Downloads Vault"
              >
                <Download className="w-4 h-4" />
              </button>
              
              {/* Server metrics */}
              <button 
                onClick={() => { setActiveTab('server'); setMenuOpen(false); }}
                className={`p-2 rounded-xl border transition-all ${activeTab === 'server' ? 'border-primary/50 bg-[#7c4dff]/15 text-primary' : 'border-white/5 bg-white/3 hover:bg-white/8 text-on-surface'}`}
                title="Server Telemetry"
              >
                <Server className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Avatar Trigger button */}
            <div 
              onClick={() => { setActiveTab('profile'); setMenuOpen(false); }}
              className="flex items-center gap-2.5 cursor-pointer group bg-white/3 p-1 px-3 border border-white/5 rounded-xl hover:bg-white/8 transition-all"
            >
              <span className="text-xs font-extrabold text-white group-hover:text-primary transition-colors hidden md:inline-block">
                {cleanUserName}
              </span>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 select-none flex-shrink-0">
                <img src={PROFILE_AVATAR} alt="User Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Sidebar / Drawer Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 p-6 flex flex-col gap-6 md:hidden animate-entrance-hero text-left">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-primary font-mono select-none tracking-widest">
              PORTAL NAVIGATIONS
            </span>
            <button 
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-full border border-white/10 text-white/80 hover:bg-white/5 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2 font-extrabold text-base pt-4">
            {NAV_ITEMS.map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMenuOpen(false);
                }}
                className={`p-3.5 text-left rounded-xl border border-white/5 flex items-center gap-3 transition-colors ${activeTab === item.id ? 'bg-primary/20 border-primary/40 text-primary' : 'text-on-surface-variant hover:bg-white/5'}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Dynamic Viewport Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-4 relative z-10 select-text">
        {renderTabContent()}
      </main>

      {/* Mobile Floating Bottom Glass Navigation Bar (hidden on med and larger-sized desktop screens) */}
      <footer className="md:hidden fixed bottom-4 left-4 right-4 z-45 glass-card bg-[#0f0c13]/85 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around items-center h-16 shadow-2xl px-2">
        {NAV_ITEMS.filter(it => ['home', 'search', 'downloads', 'server', 'profile'].includes(it.id)).map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all relative outline-none ${
              activeTab === item.id 
                ? 'text-primary scale-105 drop-shadow-[0_0_6px_rgba(205,189,255,0.4)] font-extrabold' 
                : 'text-on-surface-variant/70 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-[9px] uppercase tracking-wider font-mono scale-90">{item.id === 'tv-shows' ? 'Shows' : item.id}</span>
            {activeTab === item.id && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </footer>

      {/* Expanded item Drawer Details Modal */}
      {selectedMovie && (
        <DetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={(movie) => {
            setSelectedMovie(null);
            playMovie(movie);
          }}
          isInMyList={favorites.includes(selectedMovie.id)}
          onToggleMyList={() => toggleMyList(selectedMovie.id)}
          downloadStatus={downloads[selectedMovie.id]}
          onTriggerDownload={() => triggerDownload(selectedMovie.id)}
        />
      )}

      {/* Synchronous active movie theatre simulator playout */}
      {activePlayingMovie && (
        <VideoPlayer 
          movie={activePlayingMovie}
          onClose={() => setActivePlayingMovie(null)}
          onUpdateProgress={updateWatchProgress}
        />
      )}
    </div>
  );
}

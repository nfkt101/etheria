import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Download, Server, Menu, X, FolderOpen } from 'lucide-react';
import { PROFILE_AVATAR } from '../../data';
import { useAuthStore } from '../../store/authStore';
import MobileDrawer from './MobileDrawer';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = useAuthStore((s) => s.username);
  const [menuOpen, setMenuOpen] = useState(false);

  const is = (path: string) => location.pathname === path || (path === '/' && location.pathname === '/');

  return (
    <>
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

      <header className="relative z-40 max-w-7xl mx-auto w-full px-4 md:px-8 py-3 shrink-0">
        <div className="glass-card bg-surface/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-2xl">

          <div className="flex items-center gap-4 lg:gap-10">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 md:hidden text-primary border border-white/10 hover:border-white/20 rounded-xl hover:bg-white/5 active:scale-95 transition-all outline-none"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <span
              onClick={() => navigate('/')}
              className="font-display-lg text-xl md:text-2xl font-black tracking-tight text-primary cursor-pointer select-none"
            >
              ETHERIA
            </span>

            <nav className="hidden md:flex items-center gap-5 lg:gap-8 select-none">
              {[
                { path: '/', label: 'Home' },
                { path: '/movies', label: 'Cinematic Films' },
                { path: '/tv', label: 'Exclusive TV' },
              ].map(({ path, label }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`text-xs lg:text-sm font-bold tracking-wide transition-all duration-300 pb-0.5 ${
                    is(path)
                      ? 'text-primary border-b border-primary'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2 select-none">
              {[
                { path: '/search', icon: <Search className="w-4 h-4" />, title: 'Search' },
                { path: '/downloads', icon: <Download className="w-4 h-4" />, title: 'Downloads' },
                { path: '/local', icon: <FolderOpen className="w-4 h-4" />, title: 'Local Player' },
                { path: '/server', icon: <Server className="w-4 h-4" />, title: 'Server' },
              ].map(({ path, icon, title }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  title={title}
                  className={`p-2 rounded-xl border transition-all ${
                    is(path)
                      ? 'border-primary/50 bg-[#7c4dff]/15 text-primary'
                      : 'border-white/5 bg-white/3 hover:bg-white/8 text-on-surface'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>

            <div
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 cursor-pointer group bg-white/3 p-1 px-3 border border-white/5 rounded-xl hover:bg-white/8 transition-all"
            >
              <span className="text-xs font-extrabold text-white group-hover:text-primary transition-colors hidden md:inline-block">
                {username || 'Profile'}
              </span>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 select-none flex-shrink-0">
                <img src={PROFILE_AVATAR} alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

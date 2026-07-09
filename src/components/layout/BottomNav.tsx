import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tv, Search, Download, Server, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'home', icon: <Tv className="w-5 h-5" /> },
  { path: '/search', label: 'search', icon: <Search className="w-5 h-5" /> },
  { path: '/downloads', label: 'downloads', icon: <Download className="w-5 h-5" /> },
  { path: '/server', label: 'server', icon: <Server className="w-5 h-5" /> },
  { path: '/profile', label: 'profile', icon: <User className="w-5 h-5" /> },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <footer className="md:hidden fixed bottom-4 left-4 right-4 z-45 glass-card bg-[#0f0c13]/85 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around items-center h-16 shadow-2xl px-2">
      {NAV_ITEMS.map(({ path, label, icon }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all relative outline-none ${
              active
                ? 'text-primary scale-105 drop-shadow-[0_0_6px_rgba(205,189,255,0.4)] font-extrabold'
                : 'text-on-surface-variant/70 hover:text-white'
            }`}
          >
            {icon}
            <span className="text-[9px] uppercase tracking-wider font-mono scale-90">{label}</span>
            {active && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />}
          </button>
        );
      })}
    </footer>
  );
}

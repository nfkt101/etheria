import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tv, Film, Search, Download, Server, User, Layers, X } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Home Showcase', icon: <Tv className="w-5 h-5" /> },
  { path: '/movies', label: 'Films', icon: <Film className="w-5 h-5 text-[#14d1ff]" /> },
  { path: '/tv', label: 'TV Shows', icon: <Layers className="w-5 h-5 text-amber-400" /> },
  { path: '/search', label: 'Search', icon: <Search className="w-5 h-5" /> },
  { path: '/downloads', label: 'Downloads', icon: <Download className="w-5 h-5" /> },
  { path: '/server', label: 'Server Dev', icon: <Server className="w-5 h-5" /> },
  { path: '/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 p-6 flex flex-col gap-6 md:hidden animate-entrance-hero text-left">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black text-primary font-mono select-none tracking-widest">
          PORTAL NAVIGATIONS
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full border border-white/10 text-white/80 hover:bg-white/5 active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2 font-extrabold text-base pt-4">
        {NAV_ITEMS.map(({ path, label, icon }) => (
          <button
            key={path}
            onClick={() => {
              navigate(path);
              onClose();
            }}
            className={`p-3.5 text-left rounded-xl border border-white/5 flex items-center gap-3 transition-colors ${
              location.pathname === path
                ? 'bg-primary/20 border-primary/40 text-primary'
                : 'text-on-surface-variant hover:bg-white/5'
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

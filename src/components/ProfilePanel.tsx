import React, { useState } from 'react';
import { PROFILE_AVATAR } from '../data';
import { Shield, Sparkles, LogOut, Trash2, Award, Clock, Smartphone, Play, Heart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLibraryStore } from '../store/libraryStore';
import { useUiStore } from '../store/uiStore';
import { useUserData } from '../hooks/useUserData';

export default function ProfilePanel() {
  const { logout, username } = useAuthStore();
  const items = useLibraryStore((s) => s.items);
  const openModal = useUiStore((s) => s.openModal);
  const { favorites } = useUserData();
  const [subTier, setSubTier] = useState<'ultra' | 'standard'>('ultra');

  const favoriteItems = items.filter((m) => favorites.includes(m.id));
  const watchHistory = items
    .filter((m) => m.progress > 0)
    .sort((a, b) => {
      const aDate = a.lastPlayedDate ? new Date(a.lastPlayedDate).getTime() : 0;
      const bDate = b.lastPlayedDate ? new Date(b.lastPlayedDate).getTime() : 0;
      return bDate - aDate;
    });

  const totalMinutes = watchHistory.reduce((sum, m) => {
    const hrs = parseFloat(m.duration) || 1;
    return sum + Math.round((m.progress / 100) * hrs * 60);
  }, 0);

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-entrance-row-1 text-on-background select-text">
      <div className="glass-card bg-[#141416]/95 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/50 flex-shrink-0 shadow-lg relative group">
          <img src={PROFILE_AVATAR} alt="User avatar" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex-1 space-y-1.5 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{username || 'User'}</h2>
            <span className="px-2 py-0.5 bg-[#cdbdff]/20 border border-[#cdbdff]/30 text-[#e8deff] text-[9px] font-mono font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              {subTier === 'ultra' ? 'Premium Cinephile Ultra' : 'Standard Member'}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-medium">
            <Smartphone className="w-3.5 h-3.5 text-[#14d1ff] inline mr-1" />
            Active Platform: Etheria Web
          </p>
        </div>

        <div className="flex md:flex-col gap-2 w-full sm:w-auto self-stretch justify-center items-center">
          {(['ultra', 'standard'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSubTier(tier)}
              className={`w-full px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTier === tier
                  ? 'bg-[#cdbdff]/20 border-[#cdbdff]/40 text-[#fcf6ff]'
                  : 'bg-white/3 border-white/5 text-on-surface-variant hover:bg-white/10'
              }`}
            >
              {tier === 'ultra' ? 'Ultra (10-bit HDR)' : 'Standard (HD Stereo)'}
            </button>
          ))}
          <button
            onClick={logout}
            className="w-full px-4 py-2 mt-2 border rounded-xl text-xs font-bold transition-all cursor-pointer bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">Watch Time</span>
            <Clock className="w-4 h-4 text-[#14d1ff]" />
          </div>
          <div className="text-2xl font-black text-white">{totalMinutes} min</div>
          <p className="text-[10px] text-[#4cd6ff]">Total screening activity</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">In Progress</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{watchHistory.length}</div>
          <p className="text-[10px] text-amber-400">Items partially watched</p>
        </div>
      </div>

      {/* My List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs uppercase font-bold tracking-widest text-[#cdbdff] flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-primary fill-current" />
          Saved in My List ({favoriteItems.length})
        </h3>
        {favoriteItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favoriteItems.map((item) => (
              <div
                key={item.id}
                onClick={() => openModal(item)}
                className="group p-3 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all"
              >
                <div className="flex gap-3 items-center min-w-0">
                  <img src={item.image} alt={item.title} className="w-12 aspect-video object-cover rounded border border-white/10" />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-white text-xs truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-on-surface-variant font-mono">
                      {item.duration} • ★ {item.rating}
                    </p>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors group-hover:scale-110" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant bg-white/3 p-4 rounded-xl border border-dashed border-white/10 text-center">
            No items bookmarked. Tap <strong>My List</strong> in any film's detail screen.
          </p>
        )}
      </div>

      {/* Watch History */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs uppercase font-bold tracking-widest text-[#cdbdff]">
          Watch History ({watchHistory.length})
        </h3>
        {watchHistory.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto hide-scrollbar border border-white/10 rounded-xl p-3 bg-black/30">
            {watchHistory.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-none last:pb-0"
              >
                <div className="space-y-0.5">
                  <div
                    onClick={() => openModal(item)}
                    className="font-bold text-white hover:text-primary transition-colors cursor-pointer"
                  >
                    {item.title}
                  </div>
                  <div className="text-[10px] text-on-surface-variant font-mono">
                    {formatDate(item.lastPlayedDate)}
                  </div>
                </div>
                <div className="text-right font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
                  {Math.round(item.progress)}% watched
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant bg-white/3 p-4 rounded-xl border border-dashed border-white/10 text-center">
            No play records yet. Press <strong>Play</strong> on any film to populate this log.
          </p>
        )}
      </div>
    </div>
  );
}

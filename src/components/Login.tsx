import React, { useState } from 'react';
import { authenticateUser, getServerUrl } from '../services/jellyfin';
import { Tv, Search } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [serverUrl, setServerUrl] = useState(getServerUrl());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleAutoDetect = async () => {
    setIsScanning(true);
    setError('');

    const generateIPs = () => {
      const ips = ['127.0.0.1', 'localhost'];
      for (let i = 1; i <= 254; i++) {
        ips.push(`192.168.1.${i}`);
        ips.push(`192.168.0.${i}`);
        ips.push(`10.0.0.${i}`);
      }
      return ips;
    };

    const checkIp = async (ip: string): Promise<string> => {
      const url = `http://${ip}:8096`;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1000);
      try {
        await fetch(`${url}/health`, { mode: 'no-cors', signal: controller.signal });
        clearTimeout(id);
        return url;
      } catch (e) {
        clearTimeout(id);
        throw new Error('Not found');
      }
    };

    const ips = generateIPs();
    try {
      const foundUrl = await Promise.any(ips.map(checkIp));
      setServerUrl(foundUrl);
    } catch (err) {
      setError('Could not auto-detect a Jellyfin server on the local network.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authenticateUser(username, password, serverUrl);
      onLoginSuccess();
    } catch (err) {
      setError('Login failed. Please check your credentials and ensure JellyFin is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-on-background bg-[#0c0a10] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-[#0c0a10] z-0" />
      
      <div className="glass-card bg-surface/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-full max-w-md z-10 shadow-2xl animate-entrance-hero text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/20 border border-primary/50 text-primary">
            <Tv className="w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">ETHERIA</h1>
        <p className="text-on-surface-variant text-sm mb-8">Connect to your local JellyFin server</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Server URL</label>
              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={isScanning}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                {isScanning ? (
                  <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-3 h-3" />
                )}
                {isScanning ? 'Scanning...' : 'Auto Detect'}
              </button>
            </div>
            <input 
              type="text" 
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="http://localhost:8096"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="JellyFin Username"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Optional if no password"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-xl px-4 py-3 mt-6 transition-all shadow-[0_0_20px_rgba(205,189,255,0.2)] hover:shadow-[0_0_30px_rgba(205,189,255,0.4)] flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              'CONNECT TO SERVER'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

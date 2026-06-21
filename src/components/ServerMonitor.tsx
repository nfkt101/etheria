import React, { useState, useEffect, useRef } from 'react';
import { Database, Wifi, Server, Cpu, RefreshCw, Layers, ShieldCheck, PlayCircle } from 'lucide-react';

export default function ServerMonitor() {
  const [ping, setPing] = useState(24);
  const [bandwidth, setBandwidth] = useState(78.5);
  const [nodes, setNodes] = useState([
    { name: 'Tokyo Edge [Core]', active: true, load: '45%', ping: 18, uptime: '99.99%', region: 'asia-east' },
    { name: 'Oregon Edge', active: true, load: '22%', ping: 112, uptime: '99.98%', region: 'us-west' },
    { name: 'Frankfurt Gateway', active: true, load: '61%', ping: 85, uptime: '99.95%', region: 'eu-cent' },
    { name: 'Dublin Datacenter', active: false, load: '0%', ping: 999, uptime: '98.41%', region: 'eu-west' },
  ]);
  const [testing, setTesting] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [cdnGrounding, setCdnGrounding] = useState(true);
  const [cacheMemory, setCacheMemory] = useState(482.4); // MB
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Periodic statistics updates simulating live workloads
  useEffect(() => {
    const statsInterval = setInterval(() => {
      setPing((p) => Math.max(12, Math.min(48, p + Math.floor(Math.random() * 5) - 2)));
      setBandwidth((b) => Math.max(45, Math.min(120, b + (Math.random() * 6 - 3))));
      
      // Append a terminal log
      const codes = ['[INFO]', '[CDN_ROUTING]', '[CODEC_TRANSCODE]', '[AUTH_SYS]', '[CACHE_HIT]'];
      const messages = [
        `H.265 segmented chunk playout synced successfully.`,
        `Routed user stream through ${cdnGrounding ? 'optimized cloud edge cache' : 'origin node'}.`,
        `Bitrate adjusted dynamically for network fluctuations.`,
        `Encrypted token verified: user session valid.`,
        `Fetched poster cover resource in 8ms from edge memory.`,
        `Purged expired cache blocks from inactive sessions.`
      ];
      const stamp = new Date().toLocaleTimeString();
      const code = codes[Math.floor(Math.random() * codes.length)];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      
      setTestLog((prev) => {
        const next = [...prev, `${stamp} ${code} ${msg}`];
        if (next.length > 35) next.shift(); // retain last 35
        return next;
      });
    }, 2500);

    return () => clearInterval(statsInterval);
  }, [cdnGrounding]);

  // Handle logging container scroll down
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [testLog]);

  // Quick Seed console log initially
  useEffect(() => {
    setTestLog([
      '03:30:13 [INFO] Bootstrapping ETHERIA Server telemetry core...',
      '03:30:14 [INFO] Connecting WebGL visual shader stream to frame render loop...',
      '03:30:14 [SECURE] TLS 1.3 encryption verified across all edge CDNs.',
      '03:30:14 [CDN_ROUTING] Global cloud instances online (Tokyo, Oregon, Frankfurt).',
      '03:30:15 [INFO] Local cache index initialized of size 512MB.',
    ]);
  }, []);

  const triggerSpeedTest = () => {
    if (testing) return;
    setTesting(true);
    setTestLog((prev) => [...prev, `[BENCHMARK] Initializing active port diagnostics speed test...`]);

    setTimeout(() => {
      setTestLog((prev) => [...prev, `[BENCHMARK] Pinging regional nodes (average latency: ${ping - 4}ms)...`]);
    }, 1000);

    setTimeout(() => {
      setTestLog((prev) => [...prev, `[BENCHMARK] Measuring workspace throughput (down: 852.4 Mbps, up: 312.1 Mbps)...`]);
    }, 2200);

    setTimeout(() => {
      setTestLog((prev) => [...prev, `[BENCHMARK] Testing WebGL Frame Buffer compression... PASS.`]);
    }, 3200);

    setTimeout(() => {
      setTestLog((prev) => [...prev, `[BENCHMARK] Completed. Core routing health is OPTIMAL (A+ score).`]);
      setTesting(false);
    }, 4500);
  };

  const purgeCache = () => {
    setCacheMemory(0);
    setTestLog((prev) => [...prev, `[CACHE_FLUSH] Purged ${cacheMemory.toFixed(1)}MB of transient media blocks successfully.`]);
    setTimeout(() => {
      setCacheMemory(12.5); // seeds back shortly
    }, 3000);
  };

  return (
    <div className="glass-card bg-[#111113]/90 border border-white/10 rounded-2xl p-6 md:p-8 space-y-8 max-w-4xl mx-auto shadow-2xl animate-entrance-row-1">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#004e60]/20 border border-[#004e60]/30 text-[#4cd6ff] tracking-wider">
            LIVE INFRASTRUCTURE
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-primary" />
            Media Gateway Hub
          </h2>
          <p className="text-sm text-on-surface-variant">Real-time telemetry and network node performance stats</p>
        </div>

        <button 
          onClick={triggerSpeedTest}
          disabled={testing}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm hover:scale-103 active:scale-97 transition-all shadow-[0_0_15px_rgba(205,189,255,0.2)] cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Benchmarking...' : 'Test Speed'}
        </button>
      </div>

      {/* Grid of basic dials */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Dial 1 */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">Latency</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{ping} ms</div>
          <p className="text-[10px] text-emerald-400">Stable Response</p>
        </div>

        {/* Dial 2 */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">Throughput</span>
            <Database className="w-4 h-4 text-[#14d1ff]" />
          </div>
          <div className="text-2xl font-black text-white">{bandwidth.toFixed(1)} Mb/s</div>
          <p className="text-[10px] text-[#14d1ff]">Active Streaming</p>
        </div>

        {/* Dial 3 */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">Buffered Blocks</span>
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-white">{cacheMemory.toFixed(1)} MB</div>
          <button onClick={purgeCache} className="text-[10px] text-[#cdbdff] hover:underline block text-left">
            Flush Transient Cache
          </button>
        </div>

        {/* Dial 4 */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">CDN Grounding</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-white">{cdnGrounding ? 'ACTIVE' : 'OFFLINE'}</div>
          <button onClick={() => setCdnGrounding(!cdnGrounding)} className="text-[10px] text-amber-400 hover:underline block text-left">
            {cdnGrounding ? 'Bypass Edge CDN' : 'Ground Edge CDN'}
          </button>
        </div>
      </div>

      {/* Dynamic Load Mapping Chart */}
      <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-white uppercase tracking-wider">Stream Distribution Load</span>
          <span className="font-mono text-[10px] text-on-surface-variant">UTC Real-time Map</span>
        </div>
        {/* Simple beautiful responsive SVG area mapping load metrics */}
        <div className="h-28 w-full border border-white/10 rounded-xl relative overflow-hidden bg-black/40">
          <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cdbdff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#cdbdff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid references */}
            <line x1="0" y1="25" x2="400" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="0" y1="75" x2="400" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            
            {/* Flow line path */}
            <path
              d={`M 0 60 Q 50 ${50 + Math.sin(ping) * 15} 100 45 T 200 ${55 + Math.cos(bandwidth * 0.1) * 20} T 300 35 T 400 ${70 + Math.sin(Date.now() * 0.001) * 12}`}
              fill="none"
              stroke="#cdbdff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Shaded filling */}
            <path
              d={`M 0 60 Q 50 ${50 + Math.sin(ping) * 15} 100 45 T 200 ${55 + Math.cos(bandwidth * 0.1) * 20} T 300 35 T 400 ${70 + Math.sin(Date.now() * 0.001) * 12} L 400 100 L 0 100 Z`}
              fill="url(#chartGlow)"
            />
          </svg>
          <div className="absolute top-2 left-3 text-[9px] text-[#cac3d8] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-ping" />
            Live Buffer Flow Bandwidth
          </div>
        </div>
      </div>

      {/* Regional Nodes status list */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase font-bold tracking-widest text-[#cdbdff]">Global Server Endpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nodes.map((node) => (
            <div 
              key={node.name}
              className={`p-3 bg-white/5 border rounded-xl flex justify-between items-center transition-all ${
                node.active ? 'border-white/15' : 'border-red-500/10 opacity-60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${node.active ? 'bg-emerald-400 shadow-md shadow-emerald-400/40' : 'bg-red-500'}`} />
                  <span className="font-bold text-xs text-white">{node.name}</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-mono">Uptime: {node.uptime} • Region: {node.region}</p>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-white">{node.active ? `Ping: ${node.ping}ms` : 'TIMED_OUT'}</div>
                <div className="text-[9px] text-on-surface-variant">Active Load: {node.load}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostics Logs Terminal Console representation */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold uppercase tracking-widest text-[#cdbdff]">Live Transcode Diagnostics Console</span>
          <span className="text-[10px] text-[#cac3d8] font-mono">[Port: 3000 Node: Ok]</span>
        </div>
        <div 
          ref={logContainerRef}
          className="h-44 w-full bg-black/90 p-4 rounded-xl border border-white/10 font-mono text-[10px] md:text-xs text-zinc-400 overflow-y-auto scroll-smooth hide-scrollbar space-y-1 shadow-inner select-text"
        >
          {testLog.map((log, index) => (
            <div key={index} className="leading-relaxed hover:text-white transition-colors">
              <span className="text-[#cdbdff]">&gt;</span> {log}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

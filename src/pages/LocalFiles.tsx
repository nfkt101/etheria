import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, FolderOpen, FileVideo, ChevronRight, ChevronDown, Sparkles, 
  Plus, Search, Trash2, Play, History, HelpCircle, RefreshCw, FileText, Check, AlertCircle 
} from 'lucide-react';
import { cleanFilename, searchCloudMetadata, SearchMatch } from '../services/metadataFetcher';
import { usePlayerStore } from '../store/playerStore';
import { MediaItem } from '../types';

interface FileItem {
  id: string;
  name: string;
  relativePath: string;
  fileObj: File;
  localUrl: string;
}

interface FolderTree {
  name: string;
  relativePath: string;
  subfolders: Record<string, FolderTree>;
  files: FileItem[];
}

export default function LocalFiles() {
  const openPlayer = usePlayerStore((s) => s.open);
  
  // Scanned files in session memory
  const [scannedFiles, setScannedFiles] = useState<FileItem[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTree | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  // Local libraries saved in localStorage
  const [localLibrary, setLocalLibrary] = useState<MediaItem[]>([]);
  const [localHistory, setLocalHistory] = useState<MediaItem[]>([]);

  // Metadata matching UI states
  const [selectedFileForMatching, setSelectedFileForMatching] = useState<FileItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [metadataMatches, setMetadataMatches] = useState<SearchMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);

  // Active directory path input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const subFileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load persistent local library and history from localStorage
  useEffect(() => {
    const lib = localStorage.getItem('etheria_local_library');
    if (lib) {
      try { setLocalLibrary(JSON.parse(lib)); } catch (e) {}
    }
    
    const hist = localStorage.getItem('etheria_local_history');
    if (hist) {
      try { setLocalHistory(JSON.parse(hist)); } catch (e) {}
    }
  }, []);

  // Save changes to localStorage
  const saveLocalLibrary = (lib: MediaItem[]) => {
    setLocalLibrary(lib);
    localStorage.setItem('etheria_local_library', JSON.stringify(lib));
  };

  const saveLocalHistory = (hist: MediaItem[]) => {
    setLocalHistory(hist);
    localStorage.setItem('etheria_local_history', JSON.stringify(hist));
  };

  // Helper to build a nested FolderTree from flat FileItems
  const buildTree = (files: FileItem[]): FolderTree => {
    const root: FolderTree = { name: 'Root', relativePath: '', subfolders: {}, files: [] };
    
    files.forEach(file => {
      const parts = file.relativePath.split('/');
      // If no relative path (single file upload)
      if (parts.length <= 1) {
        root.files.push(file);
        return;
      }
      
      let current = root;
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        const pathSoFar = parts.slice(0, i + 1).join('/');
        if (!current.subfolders[folderName]) {
          current.subfolders[folderName] = {
            name: folderName,
            relativePath: pathSoFar,
            subfolders: {},
            files: []
          };
        }
        current = current.subfolders[folderName];
      }
      current.files.push(file);
    });
    
    return root;
  };

  // Handle directory selection
  const handleDirectorySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    processFiles(Array.from(fileList));
  };

  // Process a list of File objects
  const processFiles = (files: File[]) => {
    const videoExtensions = ['.mp4', '.mkv', '.webm', '.ogg', '.mov', '.avi'];
    const videoFiles = files.filter(file => {
      const nameLower = file.name.toLowerCase();
      return videoExtensions.some(ext => nameLower.endsWith(ext));
    });

    const newItems: FileItem[] = videoFiles.map(file => {
      const id = `local_file_${file.name}_${file.size}`;
      return {
        id,
        name: file.name,
        relativePath: file.webkitRelativePath || file.name,
        fileObj: file,
        localUrl: URL.createObjectURL(file)
      };
    });

    setScannedFiles(prev => {
      const combined = [...prev];
      newItems.forEach(item => {
        if (!combined.some(c => c.id === item.id)) {
          combined.push(item);
        }
      });
      const tree = buildTree(combined);
      setFolderTree(tree);
      return combined;
    });
  };

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // Trigger file scanners
  const triggerFolderScan = () => {
    fileInputRef.current?.click();
  };

  const triggerSingleFileSelect = () => {
    singleFileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Select a local file to play directly or match metadata
  const handleFileClick = async (file: FileItem) => {
    setSelectedFileForMatching(file);
    const cleaned = cleanFilename(file.name);
    setSearchQuery(cleaned.title);
    setShowMatchModal(true);
    setSearching(true);
    
    const results = await searchCloudMetadata(cleaned.title);
    setMetadataMatches(results);
    setSearching(false);
  };

  // Search metadata manually if automatic cleaner is slightly off
  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchCloudMetadata(searchQuery);
    setMetadataMatches(results);
    setSearching(false);
  };

  // Save the Cloud Metadata match to the Local Library list
  const confirmMetadataMatch = (match: SearchMatch) => {
    if (!selectedFileForMatching) return;
    
    const newMediaItem: MediaItem = {
      id: selectedFileForMatching.id,
      title: match.title,
      description: match.description,
      type: match.type,
      image: match.image, // URL hosted on Jellyfin or Cloud
      rating: match.rating,
      tags: match.genres,
      progress: 0,
      releaseYear: match.releaseYear,
      duration: match.duration,
      genres: match.genres,
      tagline: match.description.slice(0, 80) + '...',
      isLocal: true,
      localUrl: selectedFileForMatching.localUrl,
      localPath: selectedFileForMatching.relativePath
    };

    // Add to library
    const updatedLibrary = [newMediaItem, ...localLibrary.filter(item => item.id !== newMediaItem.id)];
    saveLocalLibrary(updatedLibrary);
    
    // Auto-launch the player immediately
    launchPlayer(newMediaItem);
    setShowMatchModal(false);
    setSelectedFileForMatching(null);
  };

  // Play a file raw (without metadata mapping)
  const playRawFile = () => {
    if (!selectedFileForMatching) return;
    
    const rawMediaItem: MediaItem = {
      id: selectedFileForMatching.id,
      title: selectedFileForMatching.name.replace(/\.[^/.]+$/, ""),
      description: 'Local video file playback.',
      type: 'movie',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80',
      rating: 0,
      tags: ['Local File'],
      progress: 0,
      releaseYear: new Date().getFullYear().toString(),
      duration: 'Unknown',
      genres: ['Local'],
      tagline: 'Raw local file playback',
      isLocal: true,
      localUrl: selectedFileForMatching.localUrl,
      localPath: selectedFileForMatching.relativePath
    };

    launchPlayer(rawMediaItem);
    setShowMatchModal(false);
    setSelectedFileForMatching(null);
  };

  // Play a media item (add to history and open player)
  const launchPlayer = (item: MediaItem) => {
    // Add to history
    const updatedHistory = [item, ...localHistory.filter(h => h.id !== item.id)].slice(0, 15);
    saveLocalHistory(updatedHistory);
    
    // Open standard player
    openPlayer(item);
  };

  // Resume playing a historical local file
  const resumeHistoryItem = (item: MediaItem) => {
    // Try to find the file reference in scanned files (since object URLs expire between reloads)
    const scanned = scannedFiles.find(f => f.id === item.id);
    if (scanned) {
      // Refresh URL and play
      const updatedItem = { ...item, localUrl: scanned.localUrl };
      launchPlayer(updatedItem);
    } else {
      // File needs to be re-scanned
      alert("This file is not currently in memory. Please drag & drop or scan the folder containing this file to re-link and play!");
    }
  };

  // Clear library and history items
  const removeLibraryItem = (id: string) => {
    saveLocalLibrary(localLibrary.filter(item => item.id !== id));
  };

  const removeHistoryItem = (id: string) => {
    saveLocalHistory(localHistory.filter(item => item.id !== id));
  };

  // Recursive renderer for FolderTree
  const renderFolderNode = (node: FolderTree, depth = 0) => {
    const isExpanded = expandedFolders[node.relativePath] || false;
    const hasChildren = Object.keys(node.subfolders).length > 0 || node.files.length > 0;

    return (
      <div key={node.relativePath} className="space-y-1 select-none">
        {node.relativePath && (
          <div 
            onClick={() => toggleFolder(node.relativePath)}
            className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer text-white/90 text-sm font-semibold transition-colors"
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            {hasChildren && (
              isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-on-surface-variant" />
            )}
            {!hasChildren && <span className="w-4" />}
            {isExpanded ? <FolderOpen className="w-4 h-4 text-primary fill-primary/10" /> : <Folder className="w-4 h-4 text-primary fill-primary/10" />}
            <span className="truncate">{node.name}</span>
            <span className="text-[10px] text-on-surface-variant font-mono bg-white/5 px-1.5 py-0.5 rounded-full ml-auto">
              {node.files.length}
            </span>
          </div>
        )}

        {(isExpanded || !node.relativePath) && (
          <div className="space-y-1">
            {/* Subfolders */}
            {Object.values(node.subfolders).map(sub => renderFolderNode(sub, depth + 1))}
            
            {/* Files */}
            {node.files.map(file => (
              <div
                key={file.id}
                onClick={() => handleFileClick(file)}
                className="flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/10 text-on-surface-variant text-xs cursor-pointer transition-all"
                style={{ paddingLeft: `${(depth + (node.relativePath ? 1 : 0)) * 16 + 16}px` }}
              >
                <FileVideo className="w-3.5 h-3.5 flex-shrink-0 text-secondary" />
                <span className="truncate flex-1">{file.name}</span>
                <span className="text-[9px] text-[#cdbdff] uppercase tracking-wider font-mono opacity-0 group-hover:opacity-100 transition-opacity">Play</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto animate-entrance-row-1 select-text">
      {/* Hidden inputs for folder and file selection */}
      <input
        ref={fileInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleDirectorySelect}
      />
      <input
        ref={singleFileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files[0]) processFiles([files[0]]);
        }}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            Local Media Hub
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            Scan your system directories to create a local streaming server matching cloud covers and synopsis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={triggerFolderScan} 
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs hover:scale-103 active:scale-97 cursor-pointer transition-all shadow-lg shadow-primary/20"
          >
            <FolderOpen className="w-4 h-4" />
            Scan Folder Tree
          </button>
          <button 
            onClick={triggerSingleFileSelect}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl text-xs hover:scale-103 active:scale-97 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Single Video
          </button>
        </div>
      </div>

      {/* Main Grid: Left side file tree & matching workspace, Right side catalog libraries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Folder Tree & Drop Workspace */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card bg-[#141417]/95 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#cdbdff]">
              Directory File Tree
            </h3>

            {folderTree ? (
              <div className="max-h-[400px] overflow-y-auto pr-1 space-y-1 scrollbar-thin">
                {renderFolderNode(folderTree)}
              </div>
            ) : (
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFolderScan}
                className={`py-12 border border-dashed rounded-xl flex flex-col items-center justify-center space-y-3 text-center cursor-pointer transition-all ${dragActive ? 'border-primary bg-primary/5 text-primary' : 'border-white/10 hover:border-primary/50 text-on-surface-variant'}`}
              >
                <Folder className="w-10 h-10 text-on-surface-variant/30" />
                <div className="space-y-1 px-4">
                  <p className="font-bold text-white text-xs">No directories loaded</p>
                  <p className="text-[10px] text-on-surface-variant max-w-[200px]">
                    Drag & drop media folders or tap to select local directories.
                  </p>
                </div>
              </div>
            )}

            {scannedFiles.length > 0 && (
              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] text-on-surface-variant font-mono">
                <span>{scannedFiles.length} local files cached</span>
                <button 
                  onClick={() => { setScannedFiles([]); setFolderTree(null); }}
                  className="hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Clear scan cache
                </button>
              </div>
            )}
          </div>

          <div className="glass-card bg-[#141417]/95 border border-white/10 rounded-2xl p-5 shadow-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Supported Formats Notice</h4>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Etheria player utilizes your device webview. MP4, WebM, and VTT subtitles are natively supported. High-codec MKV (HEVC) or AC3 audio files may render only audio or error depending on local system decoders.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Recently Played & Match Catalog */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* History / Recently Played */}
          {localHistory.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#cdbdff] flex items-center gap-2">
                <History className="w-4 h-4" />
                Recently Played Local Files
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {localHistory.map((item) => {
                  const isLinked = scannedFiles.some(f => f.id === item.id);
                  return (
                    <div 
                      key={item.id} 
                      className="flex gap-4 p-3 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 transition-all items-center group relative overflow-hidden"
                    >
                      <div className="w-20 aspect-video rounded-lg overflow-hidden shrink-0 border border-white/5 relative bg-zinc-900">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => isLinked ? resumeHistoryItem(item) : null}
                          className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 ${!isLinked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <Play className="w-5 h-5 text-primary fill-current" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="font-extrabold text-white text-xs truncate leading-snug">{item.title}</h4>
                        <p className="text-[9px] text-on-surface-variant font-mono mt-0.5">
                          Progress: {item.progress}%
                        </p>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1.5">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${item.progress}%` }} />
                        </div>

                        {!isLinked && (
                          <span className="inline-block text-[8px] text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-1 rounded mt-1.5">
                            Unlinked: Scan folder to play
                          </span>
                        )}
                      </div>

                      <button 
                        onClick={() => removeHistoryItem(item.id)}
                        className="absolute top-2 right-2 p-1 text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Catalog: Matched Local Library Grid */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#cdbdff] flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Matched Local Library ({localLibrary.length})
            </h3>

            {localLibrary.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {localLibrary.map((item) => {
                  const isLinked = scannedFiles.some(f => f.id === item.id);
                  return (
                    <div 
                      key={item.id}
                      className="glass-card bg-[#141417]/40 border border-white/5 hover:border-primary/30 rounded-xl overflow-hidden shadow-lg group flex flex-col relative transition-all"
                    >
                      <div className="aspect-[2/3] w-full bg-zinc-900 overflow-hidden relative border-b border-white/5">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3 transition-opacity opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              if (isLinked) {
                                const matched = scannedFiles.find(f => f.id === item.id)!;
                                launchPlayer({ ...item, localUrl: matched.localUrl });
                              } else {
                                alert("This file is not currently in memory. Please drag & drop or scan the folder containing this file to re-link and play!");
                              }
                            }}
                            className="w-full py-1.5 bg-primary text-on-primary text-[10px] font-bold rounded-lg hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" /> Play Video
                          </button>
                        </div>

                        {!isLinked && (
                          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-extrabold text-amber-400 border border-amber-400/20 flex items-center gap-1 shadow-md">
                            <AlertCircle className="w-2.5 h-2.5" /> Unlinked
                          </div>
                        )}
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between gap-1 select-text">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-white text-xs leading-snug truncate">{item.title}</h4>
                          <p className="text-[9px] text-[#cdbdff] font-mono leading-none flex items-center gap-1">
                            <span>{item.releaseYear}</span>
                            <span>•</span>
                            <span>{item.duration}</span>
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-1 mt-auto border-t border-white/5">
                          <span className="text-[8px] uppercase tracking-wider font-mono text-on-surface-variant truncate max-w-[80px]">
                            {item.genres[0] || 'Media'}
                          </span>
                          <button 
                            onClick={() => removeLibraryItem(item.id)}
                            className="p-1 text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                            title="Remove Match"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 bg-white/3 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
                <FileVideo className="w-12 h-12 text-on-surface-variant/30 animate-pulse" />
                <div className="space-y-1">
                  <p className="font-bold text-white text-sm">Local library is empty</p>
                  <p className="text-xs text-on-surface-variant px-6 max-w-sm">
                    Scan folder directories, tap on a video file, and match it with movie metadata from the cloud.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Cloud Metadata Match Dialog Modal */}
      {showMatchModal && selectedFileForMatching && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in select-text">
          <div className="glass-card bg-[#141416]/95 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-entrance flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest font-mono">
                  Cloud Metadata Search Integration
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1 leading-snug truncate max-w-lg">
                  {selectedFileForMatching.name}
                </h3>
              </div>
              <button 
                onClick={() => { setShowMatchModal(false); setSelectedFileForMatching(null); }}
                className="p-2 border border-white/10 hover:bg-white/5 text-white/80 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6 scrollbar-thin">
              
              {/* Manual search query bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' ? handleManualSearch() : null}
                    placeholder="Search movie title..."
                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={handleManualSearch}
                  className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  Search
                </button>
              </div>

              {/* Match catalog display */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-[#cdbdff]">
                  <span>Matches Found ({metadataMatches.length})</span>
                  {searching && <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />}
                </div>

                {metadataMatches.length > 0 ? (
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {metadataMatches.map((match) => (
                      <div 
                        key={match.id}
                        className="flex gap-4 p-3 bg-white/3 border border-white/5 rounded-2xl items-center hover:bg-white/5 hover:border-primary/20 transition-all group"
                      >
                        <img 
                          src={match.image} 
                          alt={match.title} 
                          className="w-14 aspect-[2/3] object-cover rounded-lg border border-white/5 shrink-0 bg-zinc-900" 
                        />
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-baseline gap-2">
                            <h4 className="font-extrabold text-white text-sm truncate leading-snug">{match.title}</h4>
                            <span className="text-[10px] text-[#cdbdff] font-mono">{match.releaseYear}</span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-1 leading-relaxed pr-2">
                            {match.description}
                          </p>
                        </div>
                        <button
                          onClick={() => confirmMetadataMatch(match)}
                          className="px-3.5 py-2 bg-primary/20 hover:bg-primary text-primary hover:text-on-primary text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" /> Match & Play
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  !searching && (
                    <div className="text-center py-8 bg-white/3 border border-white/5 rounded-2xl flex flex-col items-center justify-center p-4">
                      <AlertCircle className="w-8 h-8 text-on-surface-variant/30 mb-2" />
                      <p className="text-xs text-on-surface-variant font-bold">No cloud metadata found</p>
                      <p className="text-[10px] text-on-surface-variant/60 max-w-sm mt-0.5 leading-relaxed">
                        Try adjusting your search terms above or play the file directly as a raw local media asset.
                      </p>
                    </div>
                  )
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 bg-white/3 flex justify-between items-center gap-4">
              <button 
                onClick={playRawFile}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                Play Raw File (No Cover)
              </button>
              <button 
                onClick={() => { setShowMatchModal(false); setSelectedFileForMatching(null); }}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl text-xs hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

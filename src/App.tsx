import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import ShaderBackground from './components/ShaderBackground';
import Login from './components/Login';
import VideoPlayer from './components/VideoPlayer';
import DetailModal from './components/DetailModal';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TVShows from './pages/TVShows';
import Search from './pages/Search';
import Downloads from './pages/Downloads';
import Profile from './pages/Profile';
import ServerMonitorPage from './pages/ServerMonitorPage';
import { useAuthStore } from './store/authStore';
import { useLibraryStore } from './store/libraryStore';
import { usePlayerStore } from './store/playerStore';
import { useUiStore } from './store/uiStore';

function Layout() {
  return (
    <div className="min-h-screen text-on-background bg-[#0c0a10] flex flex-col pb-20 md:pb-6 relative leading-relaxed overflow-x-hidden select-none">
      <ShaderBackground />
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-4 relative z-10 select-text">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, hydrate, userId } = useAuthStore();
  const fetchItems = useLibraryStore((s) => s.fetchItems);
  const activeItem = usePlayerStore((s) => s.activeItem);
  const selectedItem = useUiStore((s) => s.selectedItem);

  // Hydrate auth from localStorage on first render
  useEffect(() => {
    hydrate();
  }, []);

  // Fetch library when authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchItems(userId);
    }
  }, [isAuthenticated, userId]);

  if (!isAuthenticated) {
    return (
      <>
        <ShaderBackground />
        <Login />
      </>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="movies" element={<Movies />} />
          <Route path="tv" element={<TVShows />} />
          <Route path="search" element={<Search />} />
          <Route path="downloads" element={<Downloads />} />
          <Route path="server" element={<ServerMonitorPage />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>

      {/* Global overlays — read state from stores, no prop drilling */}
      {activeItem && <VideoPlayer />}
      {selectedItem && <DetailModal />}
    </HashRouter>
  );
}

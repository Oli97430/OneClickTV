import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Menu, Sun, Moon, RefreshCw, Tv, Radio, Heart, History, Film } from 'lucide-react';
import Sidebar from './components/Sidebar';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import MiniPlayer from './components/MiniPlayer';
import SkeletonCard from './components/SkeletonCard';
import VpnInfo from './components/VpnInfo';
import VodBrowser from './components/VodBrowser';
import { fetchFrenchChannels } from './services/iptvService';
import { useI18n } from './i18n';

function loadFromStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

const SWIPE_CATEGORIES = ['all', 'favoris', 'recents', 'Actualités', 'Sport', 'Musique', 'Cinéma', 'Enfants', 'Culture', 'Généraliste'];
const SKELETON_COUNT = 12;

export default function App() {
  const { t } = useI18n();
  const [channels, setChannels]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [category, setCategory]         = useState('all');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [playerMode, setPlayerMode]     = useState('closed');
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [vpnInfoOpen, setVpnInfoOpen]   = useState(false);
  const [theme, setTheme]               = useState(() => loadFromStorage('theme', 'dark'));
  const [tvMode, setTvMode]             = useState(() => loadFromStorage('tvMode', false));
  const [favorites, setFavorites]       = useState(() => loadFromStorage('favorites', []));
  const [recents, setRecents]           = useState(() => loadFromStorage('recents', []));
  const [loadKey, setLoadKey]           = useState(0);
  const [vodActive, setVodActive]       = useState(false);

  const gridRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Ref tracking current navigable state for the back-button handler
  const navStateRef = useRef({});
  navStateRef.current = { playerMode, vpnInfoOpen, sidebarOpen, vodActive };

  // ─── Hardware back button (Android TV / Xiaomi Box) ─────────────────────
  // Push a dummy history state so the WebView always has somewhere to "go back"
  // instead of exiting the app. On popstate we handle in-app navigation.
  useEffect(() => {
    window.history.pushState({ app: 'oneclicktv' }, '');

    const handleBack = () => {
      // Re-push immediately so there's always an entry in the history stack
      window.history.pushState({ app: 'oneclicktv' }, '');

      const { playerMode: pm, vpnInfoOpen: vpn, sidebarOpen: sb, vodActive: vod } = navStateRef.current;

      // 1. Exit fullscreen first
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
        return;
      }
      // 2. Close the full player → back to grid
      if (pm === 'full') {
        setSelectedChannel(null);
        setPlayerMode('closed');
        return;
      }
      // 3. Close the mini-player
      if (pm === 'mini') {
        setSelectedChannel(null);
        setPlayerMode('closed');
        return;
      }
      // 4. Close VPN info modal
      if (vpn) {
        setVpnInfoOpen(false);
        return;
      }
      // 5. Close sidebar overlay
      if (sb) {
        setSidebarOpen(false);
        return;
      }
      // 6. Exit VOD → back to live channels
      if (vod) {
        setVodActive(false);
        return;
      }
      // 7. Already on main screen → do nothing (don't exit)
    };

    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tvMode', JSON.stringify(tvMode));
    if (tvMode) setSidebarOpen(false);
  }, [tvMode]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchFrenchChannels(loadKey > 0)
      .then((data) => setChannels(data))
      .catch((err) => setError(err.message || t('errorLoading')))
      .finally(() => setLoading(false));
  }, [loadKey]);

  const toggleFavorite = useCallback((channel) => {
    setFavorites((prev) => {
      const exists = prev.some((c) => c.id === channel.id);
      const next   = exists ? prev.filter((c) => c.id !== channel.id) : [...prev, channel];
      localStorage.setItem('favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const reorderFavorites = useCallback((fromIdx, toIdx) => {
    setFavorites((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      localStorage.setItem('favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSelectChannel = useCallback((channel) => {
    setSelectedChannel(channel);
    setPlayerMode('full');
    setRecents((prev) => {
      const without = prev.filter((c) => c.id !== channel.id);
      const next    = [channel, ...without].slice(0, 10);
      localStorage.setItem('recents', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleMinimize = useCallback(() => setPlayerMode('mini'), []);
  const handleExpandMini = useCallback(() => setPlayerMode('full'), []);
  const handleClosePlayer = useCallback(() => {
    setSelectedChannel(null);
    setPlayerMode('closed');
  }, []);

  const focusFirstCard = useCallback(() => {
    setTimeout(() => gridRef.current?.querySelector('[data-card]')?.focus(), 50);
  }, []);

  const handleCategoryChange = useCallback((id) => {
    setVodActive(false);
    setCategory(id);
    setSidebarOpen(false);
    focusFirstCard();
  }, [focusFirstCard]);

  const handleVodClick = useCallback(() => {
    setVodActive(true);
    setSidebarOpen(false);
  }, []);

  // Swipe between categories (#6)
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx)) return;
    if (vodActive) return;

    const idx = SWIPE_CATEGORIES.indexOf(category);
    if (idx === -1) return;

    if (dx < 0 && idx < SWIPE_CATEGORIES.length - 1) {
      handleCategoryChange(SWIPE_CATEGORIES[idx + 1]);
    } else if (dx > 0 && idx > 0) {
      handleCategoryChange(SWIPE_CATEGORIES[idx - 1]);
    }
  }, [category, vodActive, handleCategoryChange]);

  // D-pad navigation
  const handleGridKeyDown = useCallback((e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const grid = gridRef.current;
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('[data-card]'));
    const idx   = cards.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();

    if (e.key === 'ArrowRight') {
      cards[Math.min(idx + 1, cards.length - 1)]?.focus();
    } else if (e.key === 'ArrowLeft') {
      cards[Math.max(idx - 1, 0)]?.focus();
    } else {
      const rect = cards[idx].getBoundingClientRect();
      const pool = e.key === 'ArrowDown'
        ? cards.filter((c) => c.getBoundingClientRect().top > rect.top + 10)
        : cards.filter((c) => c.getBoundingClientRect().top < rect.top - 10);
      if (!pool.length) return;
      pool.reduce((best, c) =>
        Math.abs(c.getBoundingClientRect().left - rect.left) <
        Math.abs(best.getBoundingClientRect().left - rect.left) ? c : best
      ).focus();
    }
  }, []);

  const favoriteIds = useMemo(() => new Set(favorites.map((c) => c.id)), [favorites]);

  const filteredChannels = useMemo(() => {
    if (category === 'favoris') return favorites;
    if (category === 'recents') return recents;
    if (category !== 'all' && category !== 'vpn') {
      return channels.filter((c) => c.category === category);
    }
    return channels;
  }, [channels, category, favorites, recents]);

  // Contextual header text
  const headerText = useMemo(() => {
    if (vodActive) return t('filmsAndSeries');
    if (loading || error) return '';
    const n = filteredChannels.length;
    if (category === 'favoris') return `${n} ${t('favorites').toLowerCase()}`;
    if (category === 'recents') return `${n} ${t('recents').toLowerCase()}`;
    return t('channelsLive', { count: n, s: n !== 1 ? 's' : '' });
  }, [vodActive, loading, error, filteredChannels.length, category, t]);

  const emptyState = () => {
    if (category === 'favoris') return { icon: Heart, msg: t('noFavorites') };
    if (category === 'recents') return { icon: History, msg: t('noRecents') };
    return { icon: Tv, msg: t('noChannels') };
  };

  const gridCols = tvMode
    ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

  const isDraggableFavorites = category === 'favoris';

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      <Sidebar
        category={category}
        onCategoryChange={handleCategoryChange}
        onVpnClick={() => { setVpnInfoOpen(true); setSidebarOpen(false); }}
        channels={channels}
        favorites={favorites}
        recents={recents}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onFocusGrid={focusFirstCard}
        tvMode={tvMode}
        onVodClick={handleVodClick}
        vodActive={vodActive}
      />

      <main
        className="flex-1 flex flex-col min-w-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <header className={`sticky top-0 z-20 flex items-center gap-3 bg-[var(--bg-base)]/85 border-b border-[var(--border)] backdrop-blur-xl ${tvMode ? 'px-5 py-4' : 'px-4 py-3 lg:px-6 lg:py-3.5'}`}>
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className={`p-2.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--border-hover)] transition-colors ${tvMode ? '' : 'lg:hidden'}`}
            aria-label="Menu"
          >
            <Menu size={tvMode ? 26 : 22} />
          </button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="hidden lg:flex items-center gap-2 text-[var(--text-muted)]">
              {vodActive
                ? <Film size={16} className="text-orange-400" />
                : <Radio size={16} className="text-[var(--accent)] animate-pulse" />
              }
              <span className="text-sm font-medium">{headerText}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTvMode((m) => !m)}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                tvMode
                  ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-hover)]'
              }`}
              aria-label={t('tvMode')}
              title={tvMode ? t('tvModeOn') : t('tvModeOff')}
            >
              <Tv size={tvMode ? 22 : 20} />
            </button>

            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="p-2.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-hover)] transition-all duration-200 shrink-0"
              aria-label={t('switchTheme')}
              title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <div className={`flex-1 ${tvMode ? 'p-5 pb-12' : 'p-4 lg:p-6 lg:pb-10'}`}>
          {/* Skeleton loading (#5) */}
          {loading && (
            <div className="animate-fade-in">
              <div className={`grid gap-4 lg:gap-5 ${gridCols}`}>
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <SkeletonCard key={i} tvMode={tvMode} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-28 gap-4 animate-fade-in">
              <div className="rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent)]/20 p-8 shadow-[var(--shadow-md)] max-w-sm w-full text-center">
                <p className="font-semibold text-[var(--accent)] mb-5">{error}</p>
                <button
                  type="button"
                  onClick={() => setLoadKey((k) => k + 1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium transition-all duration-200 shadow-md shadow-[var(--accent)]/20"
                >
                  <RefreshCw size={16} />
                  {t('retry')}
                </button>
              </div>
            </div>
          )}

          {vodActive && <VodBrowser tvMode={tvMode} />}

          {!vodActive && !loading && !error && (
            <div key={category} className="animate-fade-in-up">
              {/* Drag hint for favorites */}
              {isDraggableFavorites && filteredChannels.length > 1 && (
                <p className="text-[var(--text-muted)] text-xs mb-3 flex items-center gap-1.5">
                  <span className="inline-block w-4 h-0.5 bg-[var(--text-muted)]/40 rounded" />
                  {t('dragToReorder')}
                </p>
              )}

              <div
                ref={gridRef}
                onKeyDown={handleGridKeyDown}
                className={`grid gap-4 lg:gap-5 ${gridCols}`}
              >
                {filteredChannels.map((channel, i) => (
                  <VideoCard
                    key={channel.id}
                    channel={channel}
                    onSelect={handleSelectChannel}
                    isFavorite={favoriteIds.has(channel.id)}
                    onToggleFavorite={toggleFavorite}
                    tvMode={tvMode}
                    index={i}
                    draggable={isDraggableFavorites}
                    onReorder={isDraggableFavorites ? reorderFavorites : undefined}
                  />
                ))}
              </div>

              {filteredChannels.length === 0 && (() => {
                const { icon: EmptyIcon, msg } = emptyState();
                return (
                  <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] py-20 text-center animate-fade-in">
                    <EmptyIcon size={40} className="mx-auto mb-4 text-[var(--text-muted)]/40" />
                    <p className="text-[var(--text-muted)] font-medium text-sm">{msg}</p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>

      <VideoPlayer
        channel={selectedChannel}
        onClose={handleClosePlayer}
        onMinimize={handleMinimize}
        isOpen={playerMode === 'full'}
        tvMode={tvMode}
      />

      {playerMode === 'mini' && selectedChannel && (
        <MiniPlayer
          channel={selectedChannel}
          onExpand={handleExpandMini}
          onClose={handleClosePlayer}
        />
      )}

      <VpnInfo isOpen={vpnInfoOpen} onClose={() => setVpnInfoOpen(false)} />
    </div>
  );
}

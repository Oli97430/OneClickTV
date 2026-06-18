import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Menu, Sun, Moon, RefreshCw, Tv, Radio, Heart, History, Film, Search, X, WifiOff } from 'lucide-react';
import Sidebar from './components/Sidebar';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import MiniPlayer from './components/MiniPlayer';
import SkeletonCard from './components/SkeletonCard';
import VpnInfo from './components/VpnInfo';
import VodBrowser from './components/VodBrowser';
import EpgGrid from './components/EpgGrid';
import { fetchFrenchChannels, getAvailableCountries, COUNTRY_NAMES } from './services/iptvService';
import { fetchFrenchRadios } from './services/radioService';
import { checkAllStreams, getStreamHealth } from './services/streamHealthService';
import { useI18n } from './i18n';
import { Capacitor } from '@capacitor/core';

function loadFromStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

const SWIPE_CATEGORIES = ['all', 'favoris', 'recents', 'Actualités', 'Sport', 'Musique', 'Cinéma', 'Enfants', 'Culture', 'Généraliste', 'Radio'];
const SKELETON_COUNT = 12;
const VIRTUAL_THRESHOLD = 60;
const CARD_MIN_W = 180;
const CARD_TV_MIN_W = 240;

function VirtualChannelList({ channels, tvMode, onSelect, favoriteIds, onToggleFavorite, healthTick }) {
  const gap = tvMode ? 20 : 16;
  const rowH = tvMode ? 300 : 265;
  const containerRef = useRef(null);
  const [cols, setCols] = useState(6);
  const rowCount = Math.ceil(channels.length / cols);
  const totalH = rowCount * (rowH + gap);

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 36 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      const minW = tvMode ? CARD_TV_MIN_W : CARD_MIN_W;
      setCols(Math.max(2, Math.floor((w + gap) / (minW + gap))));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tvMode, gap]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const viewTop = Math.max(0, -rect.top);
      const viewH = window.innerHeight;
      const overscan = 4;
      const startRow = Math.max(0, Math.floor(viewTop / (rowH + gap)) - overscan);
      const endRow = Math.min(rowCount, Math.ceil((viewTop + viewH) / (rowH + gap)) + overscan);
      setVisibleRange({ start: startRow * cols, end: endRow * cols });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [cols, rowH, gap, rowCount]);

  const visible = channels.slice(visibleRange.start, visibleRange.end);
  const topPad = Math.floor(visibleRange.start / cols) * (rowH + gap);
  const gridCols = tvMode
    ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

  return (
    <div ref={containerRef} style={{ height: totalH, position: 'relative' }}>
      <div style={{ position: 'absolute', top: topPad, left: 0, right: 0 }}>
        <div className={`grid gap-4 lg:gap-5 ${gridCols}`}>
          {visible.map((ch, i) => (
            <VideoCard
              key={ch.id}
              channel={ch}
              onSelect={onSelect}
              isFavorite={favoriteIds.has(ch.id)}
              onToggleFavorite={onToggleFavorite}
              tvMode={tvMode}
              index={visibleRange.start + i}
              streamDead={getStreamHealth(ch.url) === false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [searchQuery, setSearchQuery]   = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [radioChannels, setRadioChannels] = useState([]);
  const [radioActive, setRadioActive]   = useState(false);
  const [epgActive, setEpgActive]       = useState(false);
  const [healthTick, setHealthTick]     = useState(0);

  const gridRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Ref tracking current navigable state for the back-button handler
  const navStateRef = useRef({});
  navStateRef.current = { playerMode, vpnInfoOpen, sidebarOpen, vodActive, radioActive, epgActive };

  // ─── Hardware back button (Android TV / Xiaomi Box) ─────────────────────
  const handleBackAction = useCallback(() => {
    const { playerMode: pm, vpnInfoOpen: vpn, sidebarOpen: sb, vodActive: vod, radioActive: ra, epgActive: epg } = navStateRef.current;

    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    if (pm === 'full') { setSelectedChannel(null); setPlayerMode('closed'); return; }
    if (pm === 'mini') { setSelectedChannel(null); setPlayerMode('closed'); return; }
    if (vpn) { setVpnInfoOpen(false); return; }
    if (sb) { setSidebarOpen(false); return; }
    if (epg) { setEpgActive(false); return; }
    if (ra) { setRadioActive(false); setCategory('all'); return; }
    if (vod) { setVodActive(false); return; }
  }, []);

  useEffect(() => {
    // Capacitor native backButton (Android hardware/remote)
    if (Capacitor.isNativePlatform()) {
      let cleanup;
      import('@capacitor/app').then(({ App }) => {
        const listener = App.addListener('backButton', ({ canGoBack }) => {
          handleBackAction();
        });
        cleanup = () => listener.then(h => h.remove());
      });
      return () => cleanup?.();
    }

    // Web fallback: popstate for browser / Electron
    window.history.pushState({ app: 'oneclicktv' }, '');
    const handlePopstate = () => {
      window.history.pushState({ app: 'oneclicktv' }, '');
      handleBackAction();
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [handleBackAction]);

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

  useEffect(() => {
    fetchFrenchRadios().then(setRadioChannels).catch(() => {});
  }, []);

  useEffect(() => {
    if (channels.length > 0) {
      checkAllStreams(channels, () => setHealthTick(k => k + 1));
    }
  }, [channels]);


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
    setRadioActive(false);
    setEpgActive(false);
    setCategory(id);
    setSidebarOpen(false);
    focusFirstCard();
  }, [focusFirstCard]);

  const handleVodClick = useCallback(() => {
    setVodActive(true);
    setRadioActive(false);
    setEpgActive(false);
    setSidebarOpen(false);
  }, []);

  const handleRadioClick = useCallback(() => {
    setRadioActive(true);
    setVodActive(false);
    setEpgActive(false);
    setCountryFilter('all');
    setCategory('Radio');
    setSidebarOpen(false);
  }, []);

  const handleEpgClick = useCallback(() => {
    setEpgActive(true);
    setVodActive(false);
    setRadioActive(false);
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

  const availableCountries = useMemo(() => getAvailableCountries(channels), [channels]);

  const filteredChannels = useMemo(() => {
    let list;
    if (category === 'favoris') list = favorites;
    else if (category === 'recents') list = recents;
    else if (category === 'Radio') list = radioChannels;
    else if (category !== 'all' && category !== 'vpn') list = channels.filter(c => c.category === category);
    else list = channels;

    if (countryFilter !== 'all') {
      list = list.filter(c => c.country === countryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c =>
        (c.displayName || c.name).toLowerCase().includes(q)
        || (c.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [channels, category, favorites, recents, radioChannels, countryFilter, searchQuery]);

  // Contextual header text
  const headerText = useMemo(() => {
    if (epgActive) return t('epgGuide');
    if (vodActive) return t('filmsAndSeries');
    if (radioActive) return `${filteredChannels.length} ${t('radio').toLowerCase()}`;
    if (loading || error) return '';
    const n = filteredChannels.length;
    if (category === 'favoris') return `${n} ${t('favorites').toLowerCase()}`;
    if (category === 'recents') return `${n} ${t('recents').toLowerCase()}`;
    return t('channelsLive', { count: n, s: n !== 1 ? 's' : '' });
  }, [epgActive, vodActive, radioActive, loading, error, filteredChannels.length, category, t]);

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
        onRadioClick={handleRadioClick}
        radioActive={radioActive}
        onEpgClick={handleEpgClick}
        epgActive={epgActive}
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
            <div className="hidden lg:flex items-center gap-2 text-[var(--text-muted)] shrink-0">
              {vodActive
                ? <Film size={16} className="text-orange-400" />
                : <Radio size={16} className="text-[var(--accent)] animate-pulse" />
              }
              <span className="text-sm font-medium">{headerText}</span>
            </div>

            {/* Search bar */}
            <div className="relative flex-1 max-w-xs ml-auto">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={14} />
                </button>
              )}
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
          {/* Country filter pills */}
          {!vodActive && !epgActive && !loading && !error && availableCountries.length > 1 && (
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => setCountryFilter('all')}
                className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  countryFilter === 'all'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]'
                }`}
              >
                {t('allCountries')}
              </button>
              {availableCountries.slice(0, 12).map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCountryFilter(f => f === c.code ? 'all' : c.code)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    countryFilter === c.code
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]'
                  }`}
                  title={`${c.name} (${c.count})`}
                >
                  {c.flag} {c.count}
                </button>
              ))}
            </div>
          )}

          {/* Skeleton loading */}
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

          {epgActive && !loading && !error && (
            <EpgGrid channels={channels} tvMode={tvMode} />
          )}

          {!vodActive && !epgActive && !loading && !error && (
            <div key={`${category}-${countryFilter}`} className="animate-fade-in-up">
              {isDraggableFavorites && filteredChannels.length > 1 && (
                <p className="text-[var(--text-muted)] text-xs mb-3 flex items-center gap-1.5">
                  <span className="inline-block w-4 h-0.5 bg-[var(--text-muted)]/40 rounded" />
                  {t('dragToReorder')}
                </p>
              )}

              {/* Search no-results */}
              {searchQuery && filteredChannels.length === 0 && (
                <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] py-16 text-center animate-fade-in">
                  <Search size={36} className="mx-auto mb-3 text-[var(--text-muted)]/40" />
                  <p className="text-[var(--text-muted)] font-medium text-sm">
                    {t('noResults', { query: searchQuery })}
                  </p>
                </div>
              )}

              {/* Virtual grid for large lists */}
              {filteredChannels.length > VIRTUAL_THRESHOLD && !isDraggableFavorites ? (
                <VirtualChannelList
                  channels={filteredChannels}
                  tvMode={tvMode}
                  onSelect={handleSelectChannel}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                  healthTick={healthTick}
                />
              ) : (
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
                      streamDead={getStreamHealth(channel.url) === false}
                    />
                  ))}
                </div>
              )}

              {!searchQuery && filteredChannels.length === 0 && (() => {
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

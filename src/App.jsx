import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Menu, Loader2, Sun, Moon, RefreshCw, Tv, Radio } from 'lucide-react';
import Sidebar from './components/Sidebar';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import VpnInfo from './components/VpnInfo';
import VodBrowser from './components/VodBrowser';
import { fetchFrenchChannels } from './services/iptvService';

function loadFromStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [channels, setChannels]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [category, setCategory]         = useState('all');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [vpnInfoOpen, setVpnInfoOpen]   = useState(false);
  const [theme, setTheme]               = useState(() => loadFromStorage('theme', 'dark'));
  const [tvMode, setTvMode]             = useState(() => loadFromStorage('tvMode', false));
  const [favorites, setFavorites]       = useState(() => loadFromStorage('favorites', []));
  const [recents, setRecents]           = useState(() => loadFromStorage('recents', []));
  const [loadKey, setLoadKey]           = useState(0);
  const [vodActive, setVodActive]       = useState(false);

  const gridRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tvMode', JSON.stringify(tvMode));
    // En mode TV, on masque la sidebar par défaut (même sur grand écran)
    if (tvMode) setSidebarOpen(false);
  }, [tvMode]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchFrenchChannels(loadKey > 0)
      .then((data) => setChannels(data))
      .catch((err) => setError(err.message || 'Erreur lors du chargement des chaînes'))
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

  const handleSelectChannel = useCallback((channel) => {
    setSelectedChannel(channel);
    setRecents((prev) => {
      const without = prev.filter((c) => c.id !== channel.id);
      const next    = [channel, ...without].slice(0, 10);
      localStorage.setItem('recents', JSON.stringify(next));
      return next;
    });
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

  // Navigation D-pad dans la grille
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

  const emptyMessage = () => {
    if (category === 'favoris') return "Aucun favori pour l'instant. Cliquez sur ♥ pour en ajouter.";
    if (category === 'recents') return 'Aucune chaîne récemment regardée.';
    return 'Aucune chaîne disponible dans cette catégorie.';
  };

  // Grille responsive : mode TV = moins de colonnes, cartes plus grandes
  const gridCols = tvMode
    ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

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

      <main className="flex-1 flex flex-col min-w-0">
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
              <Radio size={16} className="text-[var(--accent)] animate-pulse" />
              <span className="text-sm font-medium">
                {!loading && !error && (
                  <>{filteredChannels.length} chaîne{filteredChannels.length !== 1 ? 's' : ''} en direct</>
                )}
              </span>
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
              aria-label="Mode TV"
              title={tvMode ? 'Désactiver le mode TV' : 'Activer le mode TV (box Android)'}
            >
              <Tv size={tvMode ? 22 : 20} />
            </button>

            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="p-2.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-hover)] transition-all duration-200 shrink-0"
              aria-label="Changer le thème"
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <div className={`flex-1 ${tvMode ? 'p-5 pb-12' : 'p-4 lg:p-6 lg:pb-10'}`}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-28 gap-5 animate-fade-in">
              <div className="rounded-2xl bg-[var(--bg-card)] p-7 shadow-[var(--shadow-lg)] border border-[var(--border)]">
                <Loader2 className="text-[var(--accent)] animate-spin" size={40} />
              </div>
              <p className="text-[var(--text-muted)] text-sm font-medium tracking-wide">Chargement des chaînes...</p>
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
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {vodActive && <VodBrowser tvMode={tvMode} />}

          {!vodActive && !loading && !error && (
            <div className="animate-fade-in-up">
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
                  />
                ))}
              </div>
              {filteredChannels.length === 0 && (
                <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] py-20 text-center animate-fade-in">
                  <p className="text-[var(--text-muted)] font-medium text-sm">{emptyMessage()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <VideoPlayer
        channel={selectedChannel}
        onClose={() => setSelectedChannel(null)}
        isOpen={!!selectedChannel}
        tvMode={tvMode}
      />

      <VpnInfo isOpen={vpnInfoOpen} onClose={() => setVpnInfoOpen(false)} />
    </div>
  );
}

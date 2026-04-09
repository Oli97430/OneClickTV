import { useState, useEffect, useMemo, useCallback } from 'react';
import { Menu, Loader2, Sun, Moon, RefreshCw } from 'lucide-react';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import VpnInfo from './components/VpnInfo';
import { fetchFrenchChannels } from './services/iptvService';

function loadFromStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vpnInfoOpen, setVpnInfoOpen] = useState(false);
  const [theme, setTheme] = useState(() => loadFromStorage('theme', 'dark'));
  const [favorites, setFavorites] = useState(() => loadFromStorage('favorites', []));
  const [recents, setRecents] = useState(() => loadFromStorage('recents', []));
  const [loadKey, setLoadKey] = useState(0);

  // Appliquer le thème
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Charger les chaînes (loadKey > 0 = force refresh du cache)
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
      const next = exists ? prev.filter((c) => c.id !== channel.id) : [...prev, channel];
      localStorage.setItem('favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSelectChannel = useCallback((channel) => {
    setSelectedChannel(channel);
    setRecents((prev) => {
      const without = prev.filter((c) => c.id !== channel.id);
      const next = [channel, ...without].slice(0, 10);
      localStorage.setItem('recents', JSON.stringify(next));
      return next;
    });
  }, []);

  const favoriteIds = useMemo(() => new Set(favorites.map((c) => c.id)), [favorites]);

  const filteredChannels = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchesSearch = (ch) =>
      !q ||
      (ch.displayName || ch.name).toLowerCase().includes(q) ||
      (ch.category || '').toLowerCase().includes(q);

    if (category === 'favoris') return favorites.filter(matchesSearch);
    if (category === 'recents') return recents.filter(matchesSearch);

    let list = channels;
    if (category !== 'all' && category !== 'vpn') {
      list = channels.filter((c) => c.category === category);
    }
    return list.filter(matchesSearch);
  }, [channels, category, search, favorites, recents]);

  const emptyMessage = () => {
    if (category === 'favoris') return 'Aucun favori pour l\'instant. Cliquez sur ♥ pour en ajouter.';
    if (category === 'recents') return 'Aucune chaîne récemment regardée.';
    return 'Aucune chaîne ne correspond à votre recherche.';
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      <Sidebar
        category={category}
        onCategoryChange={(id) => { setCategory(id); setSidebarOpen(false); }}
        onVpnClick={() => { setVpnInfoOpen(true); setSidebarOpen(false); }}
        channels={channels}
        favorites={favorites}
        recents={recents}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 lg:px-6 lg:py-4 bg-[var(--bg-base)]/80 border-b border-[var(--border)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="lg:hidden p-2.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--border-hover)] transition-colors"
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 max-w-xl">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="p-2.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-hover)] transition-colors shrink-0"
            aria-label="Changer le thème"
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="flex-1 p-4 lg:p-6 lg:pb-10">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="rounded-2xl bg-[var(--bg-card)] p-6 shadow-[var(--shadow-lg)]">
                <Loader2 className="text-[var(--accent)] animate-spin" size={44} />
              </div>
              <p className="text-[var(--text-secondary)] font-medium">Chargement des chaînes...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent)]/30 p-6 shadow-[var(--shadow-sm)] max-w-sm w-full text-center">
                <p className="font-medium text-[var(--accent)] mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => setLoadKey((k) => k + 1)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white font-medium transition-all"
                >
                  <RefreshCw size={16} />
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[var(--text-muted)] text-sm font-medium">
                  {filteredChannels.length} chaîne{filteredChannels.length !== 1 ? 's' : ''}
                </span>
                <span className="h-px flex-1 max-w-[120px] bg-[var(--border)]" aria-hidden />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
                {filteredChannels.map((channel) => (
                  <VideoCard
                    key={channel.id}
                    channel={channel}
                    onSelect={handleSelectChannel}
                    isFavorite={favoriteIds.has(channel.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
              {filteredChannels.length === 0 && (
                <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] py-16 text-center">
                  <p className="text-[var(--text-muted)] font-medium">{emptyMessage()}</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <VideoPlayer
        channel={selectedChannel}
        onClose={() => setSelectedChannel(null)}
        isOpen={!!selectedChannel}
      />

      <VpnInfo isOpen={vpnInfoOpen} onClose={() => setVpnInfoOpen(false)} />
    </div>
  );
}

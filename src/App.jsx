import { useState, useEffect, useMemo } from 'react';
import { Menu, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import VpnInfo from './components/VpnInfo';
import { fetchFrenchChannels } from './services/iptvService';

export default function App() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vpnInfoOpen, setVpnInfoOpen] = useState(false);

  useEffect(() => {
    fetchFrenchChannels()
      .then((data) => setChannels(data))
      .catch((err) => setError(err.message || 'Erreur lors du chargement des chaînes'))
      .finally(() => setLoading(false));
  }, []);

  const filteredChannels = useMemo(() => {
    let list = channels;
    if (category !== 'all' && category !== 'vpn') {
      list = channels.filter((c) => c.category === category);
    }
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q))
    );
  }, [channels, category, search]);

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      <Sidebar
        category={category}
        onCategoryChange={(id) => {
          setCategory(id);
          setSidebarOpen(false);
        }}
        onVpnClick={() => {
          setVpnInfoOpen(true);
          setSidebarOpen(false);
        }}
        channels={channels}
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
            <div className="rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent)]/30 text-[var(--accent)] p-5 shadow-[var(--shadow-sm)]">
              <p className="font-medium">{error}</p>
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
                    onSelect={setSelectedChannel}
                  />
                ))}
              </div>
              {filteredChannels.length === 0 && (
                <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] py-16 text-center">
                  <p className="text-[var(--text-muted)] font-medium">
                    Aucune chaîne ne correspond à votre recherche.
                  </p>
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

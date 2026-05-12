import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, RefreshCw, ExternalLink, Film, X } from 'lucide-react';
import VodCard from './VodCard';
import { useI18n } from '../i18n';
import {
  fetchArteVideos, resolveArteStream, fetchArteProgramMeta,
  ARTE_CATEGORIES, FRANCETV_CHANNELS,
} from '../services/vodService';

// ─── Onglets sources ──────────────────────────────────────────────────────────
const SOURCES = [
  { id: 'arte',     labelKey: 'arte'     },
  { id: 'francetv', labelKey: 'franceTv' },
];

// ─── Arte Browser ─────────────────────────────────────────────────────────────
function ArteBrowser({ onPlay, tvMode, gridKeyDown, gridRef }) {
  const { t } = useI18n();
  const [catId, setCatId]     = useState(ARTE_CATEGORIES[0].id);
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async (cId) => {
    setLoading(true);
    setError(null);
    try {
      const { items: newItems } = await fetchArteVideos(cId);
      setItems(newItems);
    } catch (e) {
      setError(t('arteLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(catId); }, [catId]);

  const cols = tvMode
    ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        {ARTE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCatId(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              catId === cat.id
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-orange-400/50 hover:text-[var(--text-primary)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {!loading && !error && items.length > 0 && (
        <div ref={gridRef} onKeyDown={gridKeyDown} className={`grid gap-4 ${cols} animate-fade-in-up`}>
          {items.map((item) => (
            <VodCard key={item.id} item={item} onPlay={onPlay} tvMode={tvMode} />
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16 animate-fade-in">
          <Loader2 className="text-orange-500 animate-spin" size={40} />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-3 py-16 animate-fade-in">
          <p className="text-[var(--text-muted)]">{error}</p>
          <button
            type="button"
            onClick={() => load(catId)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-all"
          >
            <RefreshCw size={14} /> {t('retry')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── France TV Browser ────────────────────────────────────────────────────────
function FranceTvBrowser({ tvMode }) {
  const { t } = useI18n();

  const openReplay = (url) => {
    if (window?.Capacitor?.isNativePlatform?.()) {
      import('@capacitor/browser').then(({ Browser }) => {
        Browser.open({ url });
      }).catch(() => window.open(url, '_blank'));
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[var(--text-muted)] text-sm">
        {t('franceTvNote')}
      </p>
      <div className={`grid gap-3 ${tvMode ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3'}`}>
        {FRANCETV_CHANNELS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => openReplay(ch.replay)}
            className="
              flex items-center justify-between gap-3 px-4 py-4 rounded-2xl
              bg-[var(--bg-card)] border border-[var(--border)]
              hover:border-blue-400/40 hover:bg-blue-500/5
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
              transition-all group text-left
            "
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Film size={18} className="text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{ch.label}</p>
                <p className="text-[var(--text-muted)] text-xs">{t('replay')}</p>
              </div>
            </div>
            <ExternalLink size={16} className="text-[var(--text-muted)] group-hover:text-blue-400 shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Lecteur VOD Arte ─────────────────────────────────────────────────────────
function VodPlayerOverlay({ programId, onClose }) {
  const { t } = useI18n();
  const [streamUrl, setStreamUrl] = useState(null);
  const [meta, setMeta]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const videoRef = useRef(null);
  const hlsRef   = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchArteProgramMeta(programId).then((m) => {
      if (!m) { setError(t('programNotFound')); setLoading(false); return; }
      setMeta(m);
      if (!m.streamUrl) { setError(t('streamGeoBlocked')); setLoading(false); return; }
      setStreamUrl(m.streamUrl);
    }).catch(() => { setError(t('loadError')); setLoading(false); });
  }, [programId, t]);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    const play = async () => {
      try {
        const { default: Hls } = await import('hls.js');
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
          hlsRef.current = hls;
          hls.loadSource(streamUrl);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => setLoading(false));
          hls.on(Hls.Events.ERROR, (_, d) => {
            if (d.fatal) { setLoading(false); setError(t('streamUnavailable')); hls.destroy(); }
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = streamUrl;
          setLoading(false);
        }
      } catch { setLoading(false); setError(t('playerUnavailable')); }
    };
    play();
    return () => { hlsRef.current?.destroy(); hlsRef.current = null; if (videoRef.current) videoRef.current.src = ''; };
  }, [streamUrl, t]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex-1 min-w-0">
          {meta && (
            <>
              <p className="text-white font-semibold text-lg truncate">{meta.title}</p>
              {meta.subtitle && <p className="text-white/50 text-sm truncate mt-0.5">{meta.subtitle}</p>}
            </>
          )}
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-orange-500/80 text-white uppercase tracking-wide">Arte</span>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
          aria-label={t('closePlayer')}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="text-orange-500 animate-spin" size={52} />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black p-8 text-center">
            <p className="text-white text-lg font-semibold">{error}</p>
            <p className="text-white/50 text-sm max-w-sm">{t('geoNote')}</p>
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white/10 text-white mt-2">{t('back')}</button>
          </div>
        )}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain"
          controls
          autoPlay
          playsInline
          onPlay={() => setLoading(false)}
        />
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function VodBrowser({ tvMode = false }) {
  const { t } = useI18n();
  const [source, setSource]         = useState('arte');
  const [playingId, setPlayingId]   = useState(null);
  const gridRef                     = useRef(null);

  const handleGridKeyDown = useCallback((e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const cards = Array.from(gridRef.current?.querySelectorAll('[data-card]') || []);
    const idx   = cards.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();

    if (e.key === 'ArrowRight') cards[Math.min(idx + 1, cards.length - 1)]?.focus();
    else if (e.key === 'ArrowLeft') cards[Math.max(idx - 1, 0)]?.focus();
    else {
      const rect = cards[idx].getBoundingClientRect();
      const pool = e.key === 'ArrowDown'
        ? cards.filter((c) => c.getBoundingClientRect().top > rect.top + 10)
        : cards.filter((c) => c.getBoundingClientRect().top < rect.top - 10);
      if (!pool.length) return;
      pool.reduce((b, c) =>
        Math.abs(c.getBoundingClientRect().left - rect.left) <
        Math.abs(b.getBoundingClientRect().left - rect.left) ? c : b
      ).focus();
    }
  }, []);

  const handlePlay = useCallback((item) => {
    if (item.source === 'arte') {
      setPlayingId(item.programId);
    } else if (item.source === 'francetv') {
      if (window?.Capacitor?.isNativePlatform?.()) {
        import('@capacitor/browser').then(({ Browser }) => Browser.open({ url: item.url }))
          .catch(() => window.open(item.url, '_blank'));
      } else {
        window.open(item.url, '_blank');
      }
    }
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSource(s.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              source === s.id
                ? s.id === 'arte' ? 'bg-orange-500 text-white shadow-md' : 'bg-blue-500 text-white shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t(s.labelKey)}
          </button>
        ))}
      </div>

      {source === 'arte' && (
        <ArteBrowser
          onPlay={handlePlay}
          tvMode={tvMode}
          gridRef={gridRef}
          gridKeyDown={handleGridKeyDown}
        />
      )}
      {source === 'francetv' && <FranceTvBrowser tvMode={tvMode} />}

      {playingId && (
        <VodPlayerOverlay programId={playingId} onClose={() => setPlayingId(null)} />
      )}
    </div>
  );
}

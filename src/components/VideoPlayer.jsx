import { useEffect, useRef, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, AlertCircle, Loader2, Tv, Download, Square, PictureInPicture2, Cast, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { getChannelLogoUrl } from '../services/iptvService';
import { fetchChannelEpg, getCurrentProgram, getNextProgram, getProgramProgress, formatTime } from '../services/epgService';
import { startTracking, stopTracking } from '../services/statsService';
import { useI18n } from '../i18n';
import ChromecastNative from '../plugins/ChromecastPlugin';
import ScreenSaver from './ScreenSaver';

function safeFilename(name) {
  return (name || 'chaîne').replace(/[<>:"/\\|?*]/g, '_').slice(0, 80);
}

// ─── Hook Cast natif Android ─────────────────────────────────────────────────
function useChromecastNative(channel, isOpen) {
  const [castState, setCastState] = useState('unavailable');
  useEffect(() => {
    if (castState !== 'connected' || !channel?.url || !isOpen) return;
    const logoUrl = getChannelLogoUrl(channel.tvgId, channel.name, channel.logo);
    ChromecastNative.loadMedia({ url: channel.url, title: channel.displayName || channel.name || '', imageUrl: logoUrl || '' }).catch(() => {});
  }, [castState, channel?.id, isOpen]);
  useEffect(() => {
    ChromecastNative.getState().then(({ state }) => setCastState(state)).catch(() => {});
    const listener = ChromecastNative.addListener('castStateChanged', ({ state }) => setCastState(state));
    return () => { listener.then((h) => h.remove()).catch(() => {}); };
  }, []);
  const requestCast = () => ChromecastNative.requestSession().catch(() => {});
  const stopCast    = () => ChromecastNative.endSession().catch(() => {});
  return { castState, requestCast, stopCast };
}

// ─── Hook Cast web ───────────────────────────────────────────────────────────
function useChromecastWeb(channel, isOpen) {
  const [castState, setCastState] = useState('unavailable');
  useEffect(() => {
    if (castState !== 'connected' || !channel?.url || !isOpen) return;
    try {
      const session = window.cast.framework.CastContext.getInstance().getCurrentSession();
      if (!session) return;
      const mediaInfo = new window.chrome.cast.media.MediaInfo(channel.url, 'application/x-mpegURL');
      const meta = new window.chrome.cast.media.GenericMediaMetadata();
      meta.title = channel.displayName || channel.name;
      mediaInfo.metadata = meta;
      const logoUrl = getChannelLogoUrl(channel.tvgId, channel.name, channel.logo);
      if (logoUrl) meta.images = [{ url: logoUrl }];
      session.loadMedia(new window.chrome.cast.media.LoadRequest(mediaInfo));
    } catch (_) {}
  }, [castState, channel?.id, isOpen]);
  useEffect(() => {
    const initCast = () => {
      try {
        const ctx = window.cast.framework.CastContext.getInstance();
        ctx.setOptions({ receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID, autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED });
        const syncState = () => {
          const MAP = { [window.cast.framework.CastState.NO_DEVICES_AVAILABLE]: 'no_devices', [window.cast.framework.CastState.NOT_CONNECTED]: 'not_connected', [window.cast.framework.CastState.CONNECTING]: 'connecting', [window.cast.framework.CastState.CONNECTED]: 'connected' };
          setCastState(MAP[ctx.getCastState()] ?? 'no_devices');
        };
        ctx.addEventListener(window.cast.framework.CastContextEventType.CAST_STATE_CHANGED, syncState);
        ctx.addEventListener(window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED, syncState);
        syncState();
      } catch (_) {}
    };
    if (window.cast?.framework) initCast();
    else window.__onGCastApiAvailable = (ok) => { if (ok) initCast(); };
  }, []);
  const requestCast = () => { try { window.cast.framework.CastContext.getInstance().requestSession(); } catch (_) {} };
  const stopCast    = () => { try { window.cast.framework.CastContext.getInstance().endCurrentSession(true); } catch (_) {} };
  return { castState, requestCast, stopCast };
}

function useChromecast(channel, isOpen) {
  const isAndroid = Capacitor.isNativePlatform();
  const native = useChromecastNative(channel, isOpen);
  const web    = useChromecastWeb(channel, isOpen);
  return isAndroid ? native : web;
}

// ─── EPG Panel ───────────────────────────────────────────────────────────────
function EpgPanel({ channel, tvMode }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(null);
  const [next, setNext]       = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!channel?.tvgId) return;
    let timer;
    fetchChannelEpg(channel.tvgId).then((data) => {
      const cur = getCurrentProgram(data);
      const nxt = getNextProgram(data);
      setCurrent(cur); setNext(nxt); setProgress(getProgramProgress(cur));
      timer = setInterval(() => setProgress(getProgramProgress(cur)), 30_000);
    });
    return () => clearInterval(timer);
  }, [channel?.tvgId]);

  if (!current) return null;
  return (
    <div className={`flex items-stretch overflow-hidden rounded-xl bg-black/60 backdrop-blur-md border border-white/10 ${tvMode ? 'text-base' : 'text-sm'}`}>
      <div className="flex-1 min-w-0 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-0.5">{t('nowPlaying')}</p>
        <p className="font-semibold text-white truncate">{current.title}</p>
        <p className="text-white/50 text-xs mt-0.5">{formatTime(current.start)} – {formatTime(current.stop)}</p>
        <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${progress}%`, transition: 'width 1s linear' }} />
        </div>
      </div>
      {next && (
        <>
          <div className="w-px bg-white/10 self-stretch" />
          <div className="flex items-center gap-2 px-4 py-3 min-w-0 max-w-[45%]">
            <ChevronRight size={14} className="text-white/30 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-0.5">{t('upNext')}</p>
              <p className="font-medium text-white/80 truncate text-sm">{next.title}</p>
              <p className="text-white/40 text-xs mt-0.5">{formatTime(next.start)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Player ─────────────────────────────────────────────────────────────
export default function VideoPlayer({ channel, onClose, onMinimize, isOpen, tvMode = false }) {
  const { t } = useI18n();
  const videoRef = useRef(null);
  const hlsRef   = useRef(null);
  const containerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [error, setError]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [fallbackMsg, setFallbackMsg] = useState(null);
  const [recording, setRecording] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fallbackIdx = useRef(0);

  const pipSupported = typeof document !== 'undefined' && document.pictureInPictureEnabled && typeof HTMLVideoElement !== 'undefined' && !!HTMLVideoElement.prototype.requestPictureInPicture;
  const { castState, requestCast, stopCast } = useChromecast(channel, isOpen);
  const isCasting   = castState === 'connected';
  const castVisible = castState !== 'unavailable' && castState !== 'no_devices';

  // ─── Stats tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && channel?.id) startTracking(channel.displayName || channel.name || channel.id);
    return () => stopTracking();
  }, [isOpen, channel?.id]);

  // ─── Fallback URL helper ─────────────────────────────────────────────────
  const tryFallback = useCallback(() => {
    const alts = channel?.altUrls || [];
    if (fallbackIdx.current < alts.length) {
      const nextUrl = alts[fallbackIdx.current];
      fallbackIdx.current++;
      setFallbackMsg(t('tryingFallback'));
      setError(null);
      setLoading(true);
      loadStream(nextUrl);
    } else {
      setFallbackMsg(null);
      setError(t('streamUnavailable'));
    }
  }, [channel, t]);

  // ─── Stream loader (lazy HLS import) ─────────────────────────────────────
  const loadStream = useCallback(async (url) => {
    const video = videoRef.current;
    if (!video) return;

    // Cleanup previous
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    video.src = '';

    const isHls = url.toLowerCase().includes('.m3u8');
    try {
      const { default: Hls } = await import('hls.js');
      if (Hls.isSupported() && isHls) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); setFallbackMsg(null); });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) { setLoading(false); hls.destroy(); hlsRef.current = null; tryFallback(); }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => { setLoading(false); setFallbackMsg(null); }, { once: true });
        video.addEventListener('error', () => { setLoading(false); tryFallback(); }, { once: true });
      } else {
        tryFallback();
      }
    } catch {
      tryFallback();
    }
  }, [tryFallback]);

  useEffect(() => {
    if (!channel || !isOpen) return;
    setError(null); setLoading(true); setFallbackMsg(null);
    fallbackIdx.current = 0;
    loadStream(channel.url);
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (videoRef.current) videoRef.current.src = '';
    };
  }, [channel?.id, isOpen]);

  // ─── Fullscreen (#7) ─────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); }
      else { await containerRef.current?.requestFullscreen(); }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ─── Keyboard shortcuts (#8) ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      const video = videoRef.current;
      if (!video) return;
      switch (e.key) {
        case ' ':  e.preventDefault(); video.paused ? video.play() : video.pause(); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'm': case 'M': video.muted = !video.muted; break;
        case 'Escape':
          if (document.fullscreenElement) document.exitFullscreen();
          else if (onMinimize) onMinimize();
          else onClose();
          break;
        case 'ArrowRight': video.currentTime += 10; break;
        case 'ArrowLeft':  video.currentTime -= 10; break;
        case 'ArrowUp':    e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); break;
        case 'ArrowDown':  e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, toggleFullscreen, onClose, onMinimize]);

  // ─── Recording & PiP ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) setRecording(false);
    return () => { if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop(); mediaRecorderRef.current = null; };
  }, [isOpen, channel?.id]);

  useEffect(() => {
    const onEnter = () => setPipActive(true);
    const onLeave = () => setPipActive(false);
    const video = videoRef.current; if (!video) return;
    video.addEventListener('enterpictureinpicture', onEnter);
    video.addEventListener('leavepictureinpicture', onLeave);
    return () => { video.removeEventListener('enterpictureinpicture', onEnter); video.removeEventListener('leavepictureinpicture', onLeave); };
  }, [isOpen]);

  const togglePip = async () => {
    if (!videoRef.current) return;
    try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else await videoRef.current.requestPictureInPicture(); } catch (_) {}
  };

  const canRecord = () => {
    if (!videoRef.current || error || loading) return false;
    try { const stream = videoRef.current.captureStream?.(); return stream && typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm'); } catch { return false; }
  };

  const startRecording = () => {
    const video = videoRef.current; if (!video?.captureStream || recording) return;
    try {
      const stream = video.captureStream();
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 128_000 });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const u = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const a = document.createElement('a');
        a.href = u; a.download = `OneClickTV - ${safeFilename(channel?.displayName || channel?.name)} - ${date}.webm`; a.click();
        URL.revokeObjectURL(u); setRecording(false);
      };
      recorder.start(1000); mediaRecorderRef.current = recorder; setRecording(true);
    } catch (_) { setError(t('streamUnavailable')); }
  };

  const stopRecording = () => { if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop(); mediaRecorderRef.current = null; };

  if (!isOpen) return null;

  const channelLogoUrl = channel ? getChannelLogoUrl(channel.tvgId, channel.name, channel.logo) : null;
  const displayName    = channel?.displayName || channel?.name;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center shrink-0 backdrop-blur-sm">
            {channelLogoUrl && (
              <img src={channelLogoUrl} alt="" className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden'); }} />
            )}
            <Tv size={20} className={`text-white/50 ${channelLogoUrl ? 'hidden' : ''}`} />
          </div>
          <div className="min-w-0">
            <h3 className={`text-white font-semibold truncate leading-tight ${tvMode ? 'text-xl' : 'text-base'}`}>{displayName}</h3>
            {isCasting && <p className="text-blue-400 text-xs font-medium flex items-center gap-1 mt-0.5"><Cast size={11} /> {t('castingTo')}</p>}
            {fallbackMsg && <p className="text-amber-400 text-xs font-medium mt-0.5">{fallbackMsg}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {castVisible && (
            <button type="button" onClick={isCasting ? stopCast : requestCast}
              className={`p-2.5 rounded-xl transition-all backdrop-blur-sm ${isCasting ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : castState === 'connecting' ? 'bg-white/20 text-blue-300 animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}
              aria-label={isCasting ? t('stopCast') : t('castTo')} title={isCasting ? t('stopCast') : t('castTo')}
            ><Cast size={20} /></button>
          )}

          {pipSupported && !error && !loading && (
            <button type="button" onClick={togglePip}
              className={`p-2.5 rounded-xl transition-all backdrop-blur-sm ${pipActive ? 'bg-[var(--accent)] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              aria-label={t('pip')} title={t('pip')}
            ><PictureInPicture2 size={20} /></button>
          )}

          {/* Fullscreen */}
          <button type="button" onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm"
            aria-label={t('fullscreen')} title={`${t('fullscreen')} (F)`}
          >{isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</button>

          {channel && !error && !loading && (
            recording ? (
              <button type="button" onClick={stopRecording}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white font-medium transition-all backdrop-blur-sm shadow-lg"
              ><Square size={18} fill="currentColor" /><span className="text-sm">{t('stopRecording')}</span></button>
            ) : (
              <button type="button" onClick={startRecording} disabled={!canRecord()}
                className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:pointer-events-none transition-all backdrop-blur-sm"
                title={t('recording')}
              ><Download size={22} /></button>
            )
          )}

          {/* Minimize to mini-player */}
          {onMinimize && (
            <button type="button" onClick={onMinimize}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
              aria-label={t('minimize')} title={`${t('minimize')} (Esc)`}
            ><ChevronRight size={22} className="rotate-90" /></button>
          )}

          <button type="button" onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
            aria-label={t('closePlayer')}
          ><X size={22} /></button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 relative min-h-0 w-full">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="rounded-2xl bg-[var(--bg-card)]/90 p-8 shadow-2xl">
              <Loader2 className="text-[var(--accent)] animate-spin" size={52} />
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black p-8">
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-8 max-w-sm text-center">
              <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-white mb-1">{error}</p>
              <p className="text-sm text-[var(--text-secondary)] mb-6">{t('geoBlocked')}</p>
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[var(--border)] hover:bg-[var(--border-hover)] text-white font-medium transition-colors"
              >{t('back')}</button>
            </div>
          </div>
        )}
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain" controls autoPlay playsInline
          onPlay={() => setLoading(false)} />

        {/* Screensaver (#17) — only in TV mode */}
        {tvMode && !error && !loading && (
          <ScreenSaver channel={channel} idleTimeout={30000} />
        )}
      </div>

      {/* EPG bottom bar */}
      {!error && !loading && channel?.tvgId && (
        <div className={`absolute bottom-0 left-0 right-0 z-10 px-4 ${tvMode ? 'pb-6' : 'pb-4'}`}>
          <EpgPanel channel={channel} tvMode={tvMode} />
        </div>
      )}
    </div>
  );
}

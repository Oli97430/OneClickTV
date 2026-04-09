import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, AlertCircle, Loader2, Tv, Download, Square, PictureInPicture2 } from 'lucide-react';
import { getChannelLogoUrl } from '../services/iptvService';

function safeFilename(name) {
  return (name || 'chaîne').replace(/[<>:"/\\|?*]/g, '_').slice(0, 80);
}

export default function VideoPlayer({ channel, onClose, isOpen }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const pipSupported =
    typeof document !== 'undefined' &&
    document.pictureInPictureEnabled &&
    typeof HTMLVideoElement !== 'undefined' &&
    !!HTMLVideoElement.prototype.requestPictureInPicture;

  useEffect(() => {
    if (!channel || !isOpen) return;

    setError(null);
    setLoading(true);
    const video = videoRef.current;
    if (!video) return;

    const url = channel.url;
    const isHls = url.toLowerCase().includes('.m3u8');

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = '';
    };

    if (Hls.isSupported() && isHls) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => setLoading(false));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setLoading(false);
          setError('Flux indisponible');
          cleanup();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => setLoading(false));
      video.addEventListener('error', () => { setLoading(false); setError('Flux indisponible'); });
    } else {
      setLoading(false);
      setError('Flux indisponible');
    }

    return cleanup;
  }, [channel?.id, channel?.url, isOpen]);

  // Arrêter l'enregistrement si on ferme ou change de chaîne
  useEffect(() => {
    if (!isOpen) setRecording(false);
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    };
  }, [isOpen, channel?.id]);

  // Sync état PiP
  useEffect(() => {
    const onEnter = () => setPipActive(true);
    const onLeave = () => setPipActive(false);
    const video = videoRef.current;
    if (!video) return;
    video.addEventListener('enterpictureinpicture', onEnter);
    video.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter);
      video.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, [isOpen]);

  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (_) {}
  };

  const canRecord = () => {
    if (!videoRef.current || error || loading) return false;
    try {
      const stream = videoRef.current.captureStream?.();
      return stream && typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm');
    } catch { return false; }
  };

  const startRecording = () => {
    const video = videoRef.current;
    if (!video?.captureStream || recording) return;
    try {
      const stream = video.captureStream();
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000, audioBitsPerSecond: 128000 });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const a = document.createElement('a');
        a.href = url;
        a.download = `OneClickTV - ${safeFilename(channel?.displayName || channel?.name)} - ${date}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (_) { setError('Enregistrement non disponible'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
  };

  if (!isOpen) return null;

  const channelLogoUrl = channel ? getChannelLogoUrl(channel.tvgId, channel.name, channel.logo) : null;
  const displayName = channel?.displayName || channel?.name;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-lg">
            {channelLogoUrl && (
              <img
                src={channelLogoUrl}
                alt=""
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            )}
            <Tv size={22} className={`text-[var(--text-muted)] ${channelLogoUrl ? 'hidden' : ''}`} />
          </div>
          <h3 className="text-white font-semibold truncate text-lg">{displayName}</h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* PiP */}
          {pipSupported && !error && !loading && (
            <button
              type="button"
              onClick={togglePip}
              className={`p-2.5 rounded-xl transition-all backdrop-blur-sm ${pipActive ? 'bg-[var(--accent)] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              aria-label="Picture-in-Picture"
              title="Flottant (Picture-in-Picture)"
            >
              <PictureInPicture2 size={20} />
            </button>
          )}
          {/* Enregistrement */}
          {channel && !error && !loading && (
            recording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white font-medium transition-all backdrop-blur-sm shadow-lg"
                aria-label="Arrêter l'enregistrement"
              >
                <Square size={18} fill="currentColor" />
                <span className="text-sm">Arrêter</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={!canRecord()}
                className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:pointer-events-none transition-all backdrop-blur-sm"
                aria-label="Enregistrer le programme"
                title="Enregistrer le programme en cours"
              >
                <Download size={22} />
              </button>
            )
          )}
          {/* Fermer */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
            aria-label="Fermer le lecteur"
          >
            <X size={22} />
          </button>
        </div>
      </div>

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
              <p className="text-sm text-[var(--text-secondary)] mb-6">Ce flux est peut-être hors ligne ou géo-bloqué.</p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[var(--border)] hover:bg-[var(--border-hover)] text-white font-medium transition-colors"
              >
                Retour
              </button>
            </div>
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

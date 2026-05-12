import { useState, useEffect, useRef } from 'react';
import { getChannelLogoUrl } from '../services/iptvService';
import { fetchChannelEpg, getCurrentProgram, getProgramProgress, formatTime } from '../services/epgService';
import { useI18n } from '../i18n';

export default function ScreenSaver({ channel, onWake, idleTimeout = 30000 }) {
  const { t } = useI18n();
  const [active, setActive] = useState(false);
  const [time, setTime] = useState('');
  const [program, setProgram] = useState(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const idleRef = useRef(null);

  // Idle detection
  useEffect(() => {
    const reset = () => {
      if (active) { setActive(false); onWake?.(); }
      clearTimeout(idleRef.current);
      idleRef.current = setTimeout(() => setActive(true), idleTimeout);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    idleRef.current = setTimeout(() => setActive(true), idleTimeout);
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      clearTimeout(idleRef.current);
    };
  }, [active, idleTimeout, onWake]);

  // Clock
  useEffect(() => {
    if (!active) return;
    const tick = () => setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [active]);

  // EPG
  useEffect(() => {
    if (!active || !channel?.tvgId) return;
    fetchChannelEpg(channel.tvgId).then(data => {
      const cur = getCurrentProgram(data);
      setProgram(cur);
      setProgress(getProgramProgress(cur));
    });
    const id = setInterval(() => {
      setProgress(prev => Math.min(100, prev + 0.5));
    }, 30_000);
    return () => clearInterval(id);
  }, [active, channel?.tvgId]);

  if (!active) return null;

  const displayName = channel?.displayName || channel?.name || '';
  const logoUrl = channel ? getChannelLogoUrl(channel.tvgId, channel.name, channel.logo) : null;

  return (
    <div
      className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center cursor-pointer animate-fade-in"
      onClick={() => { setActive(false); onWake?.(); }}
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-7xl font-extralight text-white/90 tabular-nums tracking-tight">{time}</p>

        <div className="flex items-center gap-4">
          {logoUrl && (
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
              <img src={logoUrl} alt="" className="w-full h-full object-contain p-1.5" />
            </div>
          )}
          <div className="text-left">
            <p className="text-xl font-semibold text-white">{displayName}</p>
            {program && (
              <>
                <p className="text-white/50 text-sm mt-0.5">{program.title}</p>
                <div className="mt-2 h-1 w-48 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${progress}%`, transition: 'width 1s linear' }} />
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-white/25 text-xs font-medium mt-8 uppercase tracking-widest">
          {t('pressAnyKey')}
        </p>
      </div>
    </div>
  );
}

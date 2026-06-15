import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchChannelEpg, formatTime, hasEpgMapping } from '../services/epgService';
import { getChannelLogoUrl, getChannelFallbackLogoUrl } from '../services/iptvService';
import { useI18n } from '../i18n';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const WINDOW_HOURS = 4;
const CELL_PX_PER_MIN = 3;
const ROW_HEIGHT = 56;
const CHANNEL_COL_W = 160;
const BATCH_SIZE = 12;

function timeToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function ProgramBlock({ program, windowStart, totalMinutes }) {
  const start = Math.max(0, (new Date(program.start).getTime() - windowStart) / 60000);
  const end = Math.min(totalMinutes, (new Date(program.stop).getTime() - windowStart) / 60000);
  const width = Math.max(20, (end - start) * CELL_PX_PER_MIN);
  const left = start * CELL_PX_PER_MIN;

  const now = Date.now();
  const isLive = new Date(program.start).getTime() <= now && new Date(program.stop).getTime() > now;

  const title = program.title || '';

  return (
    <div
      className={`absolute top-1 bottom-1 rounded-lg px-2 flex items-center overflow-hidden text-xs font-medium border transition-colors ${
        isLive
          ? 'bg-[var(--accent-muted)] border-[var(--accent)]/30 text-[var(--accent)]'
          : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
      }`}
      style={{ left, width }}
      title={`${formatTime(program.start)} - ${formatTime(program.stop)}\n${title}`}
    >
      <span className="truncate">{title || '—'}</span>
    </div>
  );
}

export default function EpgGrid({ channels, tvMode }) {
  const { t } = useI18n();
  const scrollRef = useRef(null);
  const [epgData, setEpgData] = useState({});
  const [offset, setOffset] = useState(0);

  const now = useMemo(() => new Date(), []);
  const windowStart = useMemo(() => {
    const d = new Date(now);
    d.setHours(d.getHours() - 1 + offset * WINDOW_HOURS, 0, 0, 0);
    return d.getTime();
  }, [now, offset]);

  const windowEnd = windowStart + WINDOW_HOURS * 60 * 60 * 1000;
  const totalMinutes = WINDOW_HOURS * 60;
  const timelineWidth = totalMinutes * CELL_PX_PER_MIN;

  const visibleChannels = useMemo(
    () => channels.filter(ch => ch.tvgId && hasEpgMapping(ch.tvgId)).slice(0, 80),
    [channels]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      for (let i = 0; i < visibleChannels.length; i += BATCH_SIZE) {
        if (cancelled) break;
        const batch = visibleChannels.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(ch => fetchChannelEpg(ch.tvgId).then(data => [ch.tvgId, data]))
        );
        if (cancelled) break;
        setEpgData(prev => {
          const next = { ...prev };
          for (const [id, data] of results) {
            if (data) next[id] = data;
          }
          return next;
        });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [visibleChannels, offset]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const nowMin = (Date.now() - windowStart) / 60000;
    const scrollTo = Math.max(0, nowMin * CELL_PX_PER_MIN - 200);
    scrollRef.current.scrollLeft = scrollTo;
  }, [windowStart]);

  const hours = [];
  for (let m = 0; m < totalMinutes; m += 30) {
    const d = new Date(windowStart + m * 60000);
    hours.push({ m, label: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) });
  }

  const nowOffset = (Date.now() - windowStart) / 60000;
  const nowPx = nowOffset * CELL_PX_PER_MIN;
  const showNowLine = nowOffset >= 0 && nowOffset <= totalMinutes;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <Clock size={20} className="text-[var(--accent)]" />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('epgGuide')}</h2>
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setOffset(o => o - 1)}
            className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-hover)]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setOffset(0)}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--border-hover)]"
          >
            {t('nowPlaying')}
          </button>
          <button
            type="button"
            onClick={() => setOffset(o => o + 1)}
            className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-hover)]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
        <div className="flex">
          <div className="shrink-0" style={{ width: CHANNEL_COL_W }}>
            <div className="h-8 border-b border-[var(--border)] bg-[var(--bg-card)]" />
          </div>

          <div className="flex-1 overflow-x-auto" ref={scrollRef}>
            <div style={{ width: timelineWidth, position: 'relative' }}>
              <div className="h-8 border-b border-[var(--border)] bg-[var(--bg-card)] flex items-end relative">
                {hours.map(h => (
                  <div
                    key={h.m}
                    className="absolute text-[10px] text-[var(--text-muted)] font-medium pb-1"
                    style={{ left: h.m * CELL_PX_PER_MIN }}
                  >
                    {h.label}
                  </div>
                ))}
              </div>

              {visibleChannels.map(ch => {
                const epg = epgData[ch.tvgId];
                const programs = (epg?.programme || []).filter(p => {
                  const s = new Date(p.start).getTime();
                  const e = new Date(p.stop).getTime();
                  return e > windowStart && s < windowEnd;
                });

                return (
                  <div
                    key={ch.id}
                    className="relative border-b border-[var(--border)]"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {programs.map((p, i) => (
                      <ProgramBlock
                        key={i}
                        program={p}
                        windowStart={windowStart}
                        totalMinutes={totalMinutes}
                      />
                    ))}
                    {programs.length === 0 && (
                      <div className="absolute inset-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]/50 flex items-center justify-center">
                        <span className="text-[10px] text-[var(--text-muted)]">—</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {showNowLine && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                  style={{ left: nowPx }}
                >
                  <div className="absolute -top-0 -left-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex" style={{ marginTop: -(visibleChannels.length * ROW_HEIGHT + 8) }}>
          <div className="shrink-0 bg-[var(--bg-elevated)] z-10 border-r border-[var(--border)]" style={{ width: CHANNEL_COL_W }}>
            <div className="h-8" />
            {visibleChannels.map(ch => {
              const logoUrl = getChannelLogoUrl(ch.tvgId, ch.name, ch.logo);
              const fallback = getChannelFallbackLogoUrl(ch.displayName || ch.name);
              return (
                <div
                  key={ch.id}
                  className="flex items-center gap-2 px-2 border-b border-[var(--border)]"
                  style={{ height: ROW_HEIGHT }}
                >
                  <img
                    src={logoUrl || fallback}
                    alt=""
                    className="w-7 h-7 rounded object-contain bg-[var(--bg-card)] shrink-0"
                    onError={e => { e.target.src = fallback; }}
                  />
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {ch.displayName || ch.name}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ width: timelineWidth }} />
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-muted)] mt-2">
        {visibleChannels.length} {t('channelsWithEpg')}
      </p>
    </div>
  );
}

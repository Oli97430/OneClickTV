import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { fetchChannelEpg, getCurrentProgram, getNextProgram, getProgramProgress, minutesUntil, formatTime } from '../services/epgService';

export default function EpgBadge({ tvgId, tvMode = false }) {
  const [program, setProgram] = useState(null);
  const [nextProg, setNextProg] = useState(null);
  const [progress, setProgress] = useState(0);
  const [minsUntilNext, setMinsUntilNext] = useState(Infinity);
  const timerRef = useRef(null);
  const observerRef = useRef(null);
  const containerRef = useRef(null);
  const fetchedRef = useRef(false);

  const load = () => {
    if (fetchedRef.current || !tvgId) return;
    fetchedRef.current = true;

    fetchChannelEpg(tvgId).then((data) => {
      const current = getCurrentProgram(data);
      const next = getNextProgram(data);
      if (!current) return;
      setProgram(current);
      setNextProg(next);
      setProgress(getProgramProgress(current));
      setMinsUntilNext(minutesUntil(next));

      timerRef.current = setInterval(() => {
        setProgress(getProgramProgress(current));
        setMinsUntilNext(minutesUntil(next));
      }, 60_000);
    });
  };

  useEffect(() => {
    if (!tvgId) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { load(); observerRef.current?.disconnect(); } },
      { rootMargin: '200px' }
    );
    if (containerRef.current) observerRef.current.observe(containerRef.current);

    return () => {
      observerRef.current?.disconnect();
      clearInterval(timerRef.current);
    };
  }, [tvgId]);

  // EPG notification: upcoming program within 5 minutes (#4)
  const showNotification = minsUntilNext <= 5 && minsUntilNext > 0 && nextProg;

  return (
    <div ref={containerRef} className={`px-3.5 pb-3 ${!program ? 'min-h-[20px]' : ''}`}>
      {program && (
        <>
          <div className="flex items-center gap-1.5">
            <p
              className={`truncate text-[var(--text-muted)] leading-tight flex-1 ${tvMode ? 'text-xs' : 'text-[10px]'}`}
              title={program.title}
            >
              {program.title}
            </p>
            {showNotification && (
              <span
                className="flex items-center gap-0.5 text-amber-400 shrink-0"
                title={`${nextProg.title} - ${minsUntilNext} min`}
              >
                <Bell size={9} className="animate-pulse" />
                <span className="text-[8px] font-bold tabular-nums">{minsUntilNext}m</span>
              </span>
            )}
          </div>
          <div className="mt-1.5 h-[2px] rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full"
              style={{ width: `${progress}%`, transition: 'width 1s linear' }}
            />
          </div>
        </>
      )}
    </div>
  );
}

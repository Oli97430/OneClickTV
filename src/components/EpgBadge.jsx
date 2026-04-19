import { useEffect, useState, useRef } from 'react';
import { fetchChannelEpg, getCurrentProgram, getProgramProgress } from '../services/epgService';

export default function EpgBadge({ tvgId, tvMode = false }) {
  const [program, setProgram] = useState(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const observerRef = useRef(null);
  const containerRef = useRef(null);
  const fetchedRef = useRef(false);

  const load = () => {
    if (fetchedRef.current || !tvgId) return;
    fetchedRef.current = true;

    fetchChannelEpg(tvgId).then((data) => {
      const current = getCurrentProgram(data);
      if (!current) return;
      setProgram(current);
      setProgress(getProgramProgress(current));

      // Rafraîchir la progression chaque minute
      timerRef.current = setInterval(() => {
        setProgress(getProgramProgress(current));
      }, 60_000);
    });
  };

  useEffect(() => {
    if (!tvgId) return;

    // Chargement différé via IntersectionObserver pour ne pas tout fetch en même temps
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

  return (
    <div ref={containerRef} className={`px-3.5 pb-3 -mt-0.5 ${!program ? 'min-h-[24px]' : ''}`}>
      {program && (
        <>
          <p
            className={`truncate text-[var(--text-muted)] leading-tight ${tvMode ? 'text-xs' : 'text-[10px]'}`}
            title={program.title}
          >
            {program.title}
          </p>
          <div className="mt-1 h-[3px] rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)]/70 rounded-full"
              style={{ width: `${progress}%`, transition: 'width 1s linear' }}
            />
          </div>
        </>
      )}
    </div>
  );
}

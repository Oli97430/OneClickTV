import { useRef, useCallback } from 'react';
import { Heart, Clock, Play } from 'lucide-react';
import { getChannelLogoUrl, getChannelFallbackLogoUrl } from '../services/iptvService';
import { useI18n } from '../i18n';
import EpgBadge from './EpgBadge';

export default function VideoCard({
  channel, onSelect, isFavorite, onToggleFavorite,
  tvMode = false, index = 0,
  draggable = false, onReorder,
}) {
  const { t } = useI18n();
  const displayName = channel.displayName || channel.name;
  const logoUrl = getChannelLogoUrl(channel.tvgId, channel.name, channel.logo);
  const fallbackUrl = getChannelFallbackLogoUrl(displayName);
  const dragIdxRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onSelect(channel); }
    if (e.key === ' ')     { e.preventDefault(); onToggleFavorite(channel); }
  };

  // Drag-drop reorder (#13)
  const handleDragStart = useCallback((e) => {
    if (!draggable) return;
    dragIdxRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    e.currentTarget.style.opacity = '0.5';
  }, [draggable, index]);

  const handleDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = '1';
  }, []);

  const handleDragOver = useCallback((e) => {
    if (!draggable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [draggable]);

  const handleDrop = useCallback((e) => {
    if (!draggable || !onReorder) return;
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIdx) && fromIdx !== index) {
      onReorder(fromIdx, index);
    }
  }, [draggable, onReorder, index]);

  return (
    <article
      tabIndex={0}
      data-card="true"
      onKeyDown={handleKeyDown}
      onClick={() => onSelect(channel)}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ animationDelay: `${Math.min(index * 30, 600)}ms` }}
      className={`
        group relative rounded-2xl overflow-hidden
        bg-[var(--bg-card)] border border-[var(--border)]
        hover:border-[var(--accent)]/30 hover:shadow-[var(--shadow-lg)] hover:shadow-[var(--accent)]/5
        active:scale-[0.97]
        transition-all duration-200 cursor-pointer
        flex flex-col
        focus:outline-none
        animate-fade-in-up card-virtual
        ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      <div className={`bg-[var(--bg-base)] flex items-center justify-center relative overflow-hidden ${tvMode ? 'aspect-[4/3]' : 'aspect-video'}`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className={`w-full h-full object-contain group-hover:scale-110 group-focus:scale-110 transition-transform duration-500 ease-out ${tvMode ? 'p-6' : 'p-5'}`}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <img
          src={fallbackUrl}
          alt=""
          className={`w-full h-full object-contain group-hover:scale-110 group-focus:scale-110 transition-transform duration-500 ease-out ${tvMode ? 'p-6' : 'p-5'} ${logoUrl ? 'hidden' : ''}`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div
          className="hidden w-full h-full items-center justify-center text-[var(--text-muted)] bg-[var(--bg-base)]"
          aria-hidden
        >
          <span className={`font-bold ${tvMode ? 'text-4xl' : 'text-2xl'}`}>
            {displayName.trim().slice(0, 2).toUpperCase()}
          </span>
        </div>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus:bg-black/20 transition-all duration-300 flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 group-focus:scale-100 bg-[var(--accent)]/90 rounded-full p-2.5 shadow-xl backdrop-blur-sm">
            <Play size={tvMode ? 20 : 16} className="text-white" fill="currentColor" />
          </div>
        </div>

        <span className="absolute bottom-2 right-2 text-[9px] font-semibold px-2 py-0.5 rounded-md bg-black/60 text-white/70 backdrop-blur-sm">
          {channel.category}
        </span>

        {channel.not247 && (
          <span
            className="absolute top-2 left-2 flex items-center px-1.5 py-1 rounded-md bg-black/60 text-sky-400 backdrop-blur-sm"
            title={t('not247')}
          >
            <Clock size={10} />
          </span>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(channel); }}
          tabIndex={-1}
          className={`
            absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-sm transition-all duration-200
            ${isFavorite
              ? 'text-rose-400 bg-black/60 opacity-100 scale-100'
              : 'text-white/70 bg-black/40 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 group-focus:opacity-100 group-focus:scale-100'}
          `}
          aria-label={isFavorite ? t('removeFavorite') : t('addFavorite')}
        >
          <Heart size={tvMode ? 16 : 14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className={`${tvMode ? 'px-4 pt-3.5 pb-1' : 'px-3.5 pt-3 pb-0.5'}`}>
        <h3
          className={`font-semibold text-[var(--text-primary)] truncate leading-snug ${tvMode ? 'text-base' : 'text-[13px]'}`}
          title={displayName}
        >
          {displayName}
        </h3>
      </div>

      <EpgBadge tvgId={channel.tvgId} tvMode={tvMode} />
    </article>
  );
}

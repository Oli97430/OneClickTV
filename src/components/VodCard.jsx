import { Play, Clock, ExternalLink } from 'lucide-react';
import { formatDuration } from '../services/vodService';

export default function VodCard({ item, onPlay, tvMode = false }) {
  const isFranceTv = item.source === 'francetv';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(item); }
  };

  return (
    <article
      tabIndex={0}
      data-card="true"
      onKeyDown={handleKeyDown}
      onClick={() => onPlay(item)}
      className="
        group relative rounded-2xl overflow-hidden cursor-pointer
        bg-[var(--bg-card)] border border-[var(--border)]
        hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-lg)] hover:shadow-[var(--accent)]/5
        focus:outline-none active:scale-[0.98]
        transition-all duration-200 flex flex-col
      "
    >
      {/* Poster / vignette */}
      <div className={`relative overflow-hidden bg-[var(--bg-base)] ${tvMode ? 'aspect-[16/9]' : 'aspect-[16/9]'}`}>
        {item.image ? (
          <img
            src={item.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden'); }}
          />
        ) : null}
        {/* Fallback fond coloré avec initiales */}
        <div className={`${item.image ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)]`}>
          <span className={`font-bold text-[var(--text-muted)] ${tvMode ? 'text-4xl' : 'text-2xl'}`}>
            {item.title.slice(0, 2).toUpperCase()}
          </span>
        </div>

        {/* Overlay Play */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 group-focus:bg-black/30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 bg-[var(--accent)] rounded-full p-3 shadow-xl">
            {isFranceTv
              ? <ExternalLink size={tvMode ? 28 : 22} className="text-white" />
              : <Play size={tvMode ? 28 : 22} className="text-white" fill="currentColor" />
            }
          </div>
        </div>

        {/* Badge durée */}
        {item.duration > 0 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/75 text-white backdrop-blur-sm">
            <Clock size={9} />
            {formatDuration(item.duration)}
          </span>
        )}

        {/* Badge source */}
        <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm uppercase tracking-wide ${
          item.source === 'arte'     ? 'bg-orange-500/80 text-white' :
          item.source === 'francetv' ? 'bg-blue-500/80 text-white'   :
                                       'bg-[var(--accent)]/80 text-white'
        }`}>
          {item.source === 'arte' ? 'Arte' : item.source === 'francetv' ? 'France TV' : 'IPTV'}
        </span>
      </div>

      {/* Infos */}
      <div className={`flex flex-col gap-0.5 ${tvMode ? 'p-4' : 'p-3'}`}>
        <h3
          className={`font-semibold text-[var(--text-primary)] truncate leading-tight ${tvMode ? 'text-base' : 'text-sm'}`}
          title={item.title}
        >
          {item.title}
        </h3>
        {item.subtitle && (
          <p className="text-[var(--text-muted)] truncate text-xs" title={item.subtitle}>
            {item.subtitle}
          </p>
        )}
        {item.category && (
          <p className="text-[var(--accent)]/70 text-[10px] font-medium mt-0.5">{item.category}</p>
        )}
      </div>
    </article>
  );
}

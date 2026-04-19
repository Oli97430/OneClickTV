import { Heart, Clock } from 'lucide-react';
import { getChannelLogoUrl, getChannelFallbackLogoUrl } from '../services/iptvService';
import EpgBadge from './EpgBadge';

export default function VideoCard({ channel, onSelect, isFavorite, onToggleFavorite, tvMode = false }) {
  const displayName = channel.displayName || channel.name;
  const logoUrl = getChannelLogoUrl(channel.tvgId, channel.name, channel.logo);
  const fallbackUrl = getChannelFallbackLogoUrl(displayName);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onSelect(channel); }
    if (e.key === ' ')     { e.preventDefault(); onToggleFavorite(channel); }
  };

  return (
    <article
      tabIndex={0}
      data-card="true"
      onKeyDown={handleKeyDown}
      onClick={() => onSelect(channel)}
      className="
        group relative rounded-2xl overflow-hidden
        bg-[var(--bg-card)] border border-[var(--border)]
        hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-lg)] hover:shadow-[var(--accent)]/5
        active:scale-[0.98]
        transition-all duration-200 cursor-pointer
        flex flex-col
        focus:outline-none
      "
    >
      <div className={`bg-[var(--bg-base)] flex items-center justify-center relative overflow-hidden ${tvMode ? 'aspect-[4/3]' : 'aspect-video'}`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className={`w-full h-full object-contain group-hover:scale-105 group-focus:scale-105 transition-transform duration-300 ${tvMode ? 'p-6' : 'p-5'}`}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <img
          src={fallbackUrl}
          alt=""
          className={`w-full h-full object-contain group-hover:scale-105 group-focus:scale-105 transition-transform duration-300 ${tvMode ? 'p-6' : 'p-5'} ${logoUrl ? 'hidden' : ''}`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div
          className="hidden w-full h-full items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent)]/80 bg-[var(--bg-base)]"
          aria-hidden
        >
          <span className={`font-bold ${tvMode ? 'text-4xl' : 'text-2xl'}`}>
            {displayName.trim().slice(0, 2).toUpperCase()}
          </span>
        </div>

        {/* Badge catégorie */}
        <span className="absolute bottom-2.5 right-2.5 text-[10px] font-medium px-2 py-1 rounded-lg bg-black/70 text-[var(--text-secondary)] backdrop-blur-sm">
          {channel.category}
        </span>

        {/* Badge pas 24h24 */}
        <div className="absolute top-2 left-2 flex gap-1">
          {channel.not247 && (
            <span
              className="flex items-center px-1.5 py-1 rounded-md bg-black/70 text-sky-400 backdrop-blur-sm"
              title="Pas disponible 24h/24"
            >
              <Clock size={10} />
            </span>
          )}
        </div>

        {/* Bouton favori */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(channel); }}
          tabIndex={-1}
          className={`
            absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-sm transition-all duration-200
            ${isFavorite
              ? 'text-rose-400 bg-black/70 opacity-100'
              : 'text-white/60 bg-black/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100'}
          `}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={tvMode ? 16 : 14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className={`${tvMode ? 'p-4' : 'p-3.5'}`}>
        <h3
          className={`font-semibold text-[var(--text-primary)] truncate ${tvMode ? 'text-base' : 'text-sm'}`}
          title={displayName}
        >
          {displayName}
        </h3>
      </div>

      <EpgBadge tvgId={channel.tvgId} tvMode={tvMode} />
    </article>
  );
}

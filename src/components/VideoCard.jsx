import { Heart, Lock, Clock } from 'lucide-react';
import { getChannelLogoUrl, getChannelFallbackLogoUrl } from '../services/iptvService';

export default function VideoCard({ channel, onSelect, isFavorite, onToggleFavorite }) {
  const displayName = channel.displayName || channel.name;
  const logoUrl = getChannelLogoUrl(channel.tvgId, channel.name, channel.logo);
  const fallbackUrl = getChannelFallbackLogoUrl(displayName);

  return (
    <article
      className="
        group relative rounded-2xl overflow-hidden
        bg-[var(--bg-card)] border border-[var(--border)]
        hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-lg)] hover:shadow-[var(--accent)]/5
        active:scale-[0.98]
        transition-all duration-200 cursor-pointer
        flex flex-col
      "
      onClick={() => onSelect(channel)}
    >
      <div className="aspect-video bg-[var(--bg-base)] flex items-center justify-center relative overflow-hidden">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="w-full h-full object-contain p-5 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <img
          src={fallbackUrl}
          alt=""
          className={`w-full h-full object-contain p-5 group-hover:scale-105 transition-transform duration-300 ${logoUrl ? 'hidden' : ''}`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div
          className="hidden w-full h-full items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent)]/80 bg-[var(--bg-base)]"
          aria-hidden
        >
          <span className="text-2xl font-bold">{displayName.trim().slice(0, 2).toUpperCase()}</span>
        </div>

        {/* Badge catégorie */}
        <span className="absolute bottom-2.5 right-2.5 text-[10px] font-medium px-2 py-1 rounded-lg bg-black/70 text-[var(--text-secondary)] backdrop-blur-sm">
          {channel.category}
        </span>

        {/* Badges géo-bloqué / pas 24h24 */}
        <div className="absolute top-2 left-2 flex gap-1">
          {channel.geoBlocked && (
            <span
              className="flex items-center px-1.5 py-1 rounded-md bg-black/70 text-amber-400 backdrop-blur-sm"
              title="Flux géo-bloqué — VPN recommandé"
            >
              <Lock size={10} />
            </span>
          )}
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
          className={`
            absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-sm transition-all duration-200
            ${isFavorite
              ? 'text-rose-400 bg-black/70'
              : 'text-white/60 bg-black/40 opacity-0 group-hover:opacity-100 hover:text-rose-300'}
          `}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-3.5">
        <h3 className="font-semibold text-[var(--text-primary)] truncate text-sm" title={displayName}>
          {displayName}
        </h3>
      </div>
    </article>
  );
}

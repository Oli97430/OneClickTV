import { getChannelLogoUrl, getChannelFallbackLogoUrl } from '../services/iptvService';

export default function VideoCard({ channel, onSelect }) {
  const logoUrl = getChannelLogoUrl(channel.tvgId, channel.name, channel.logo);
  const fallbackUrl = getChannelFallbackLogoUrl(channel.name);

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
          <span className="text-2xl font-bold">{channel.name.trim().slice(0, 2).toUpperCase()}</span>
        </div>
        <span className="absolute bottom-2.5 right-2.5 text-[10px] font-medium px-2 py-1 rounded-lg bg-black/70 text-[var(--text-secondary)] backdrop-blur-sm">
          {channel.category}
        </span>
      </div>
      <div className="p-3.5">
        <h3 className="font-semibold text-[var(--text-primary)] truncate text-sm" title={channel.name}>
          {channel.name}
        </h3>
      </div>
    </article>
  );
}

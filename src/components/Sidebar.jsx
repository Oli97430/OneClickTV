import { Tv, Newspaper, Trophy, Music, LayoutGrid, Shield } from 'lucide-react';
import { getChannelLogoUrl, getChannelFallbackLogoUrl } from '../services/iptvService';

const CATEGORIES = [
  { id: 'all', label: 'Toutes', icon: LayoutGrid },
  { id: 'Actualités', label: 'Actualités', icon: Newspaper },
  { id: 'Sport', label: 'Sport', icon: Trophy },
  { id: 'Musique', label: 'Musique', icon: Music },
  { id: 'Généraliste', label: 'Généraliste', icon: Tv },
  { id: 'vpn', label: 'Accès VPN / Géoblocage', icon: Shield },
];

const LOGOS_PER_CATEGORY = 4;

function CategoryLogos({ channels }) {
  if (!channels || channels.length === 0) return null;
  const toShow = channels.slice(0, LOGOS_PER_CATEGORY);
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {toShow.map((ch) => {
        const logoUrl = getChannelLogoUrl(ch.tvgId, ch.name, ch.logo);
        const fallbackUrl = getChannelFallbackLogoUrl(ch.name);
        return (
          <div
            key={ch.id}
            className="w-6 h-6 rounded-md overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center shrink-0"
            title={ch.name}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <img
              src={fallbackUrl}
              alt=""
              className={`w-full h-full object-contain ${logoUrl ? 'hidden' : ''}`}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <Tv size={12} className="hidden text-zinc-500" />
          </div>
        );
      })}
    </div>
  );
}

export default function Sidebar({ category, onCategoryChange, onVpnClick, channels = [], isOpen, onClose }) {
  const byCategory = {};
  if (channels.length) {
    for (const ch of channels) {
      if (ch.category && ch.category !== 'all') {
        if (!byCategory[ch.category]) byCategory[ch.category] = [];
        if (byCategory[ch.category].length < LOGOS_PER_CATEGORY) byCategory[ch.category].push(ch);
      }
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 bg-[var(--bg-elevated)] border-r border-[var(--border)]
          flex flex-col shadow-[var(--shadow-lg)] lg:shadow-none
          transform transition-transform duration-300 ease-out
          lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="" className="w-14 h-14 rounded-xl object-contain shrink-0 shadow-md" />
            <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">OneClickTV</span>
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              const categoryChannels = byCategory[cat.id] || [];
              const isVpn = cat.id === 'vpn';
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => (isVpn ? onVpnClick?.() : onCategoryChange(cat.id))}
                    className={`
                      w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
                      transition-all duration-200
                      ${isSelected
                        ? 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/30 shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] border border-transparent'}
                    `}
                  >
                    <Icon size={20} className="shrink-0 opacity-90" />
                    <span className="flex-1 truncate min-w-0 font-medium">{cat.label}</span>
                    {!isVpn && categoryChannels.length > 0 && (
                      <CategoryLogos channels={categoryChannels} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}

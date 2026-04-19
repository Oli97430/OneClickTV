import { Tv, Newspaper, Trophy, Music, LayoutGrid, Heart, History, Film } from 'lucide-react';
import { getChannelLogoUrl, getChannelFallbackLogoUrl } from '../services/iptvService';

const CATEGORIES = [
  { id: 'all',         label: 'Toutes',     icon: LayoutGrid },
  { id: 'favoris',    label: 'Favoris',     icon: Heart      },
  { id: 'recents',    label: 'Récents',     icon: History    },
  { id: 'Actualités', label: 'Actualités',  icon: Newspaper  },
  { id: 'Sport',      label: 'Sport',       icon: Trophy     },
  { id: 'Musique',    label: 'Musique',     icon: Music      },
  { id: 'Généraliste',label: 'Généraliste', icon: Tv         },
];

// Séparé du live — section VOD
export const VOD_ENTRY = { id: 'vod', label: 'Films & Séries', icon: Film };

const LOGOS_PER_CATEGORY = 4;

function CategoryLogos({ channels }) {
  if (!channels || channels.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {channels.slice(0, LOGOS_PER_CATEGORY).map((ch) => {
        const logoUrl = getChannelLogoUrl(ch.tvgId, ch.name, ch.logo);
        const fallbackUrl = getChannelFallbackLogoUrl(ch.displayName || ch.name);
        return (
          <div
            key={ch.id}
            className="w-6 h-6 rounded-md overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center shrink-0"
            title={ch.displayName || ch.name}
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

export default function Sidebar({
  category, onCategoryChange, onVpnClick,
  channels = [], favorites = [], recents = [],
  isOpen, onClose, onFocusGrid, tvMode = false,
  onVodClick, vodActive = false,
}) {
  const byCategory = {};
  for (const ch of channels) {
    if (ch.category && ch.category !== 'all') {
      if (!byCategory[ch.category]) byCategory[ch.category] = [];
      if (byCategory[ch.category].length < LOGOS_PER_CATEGORY) byCategory[ch.category].push(ch);
    }
  }

  const channelsForCat = (id) => {
    if (id === 'favoris') return favorites;
    if (id === 'recents') return recents;
    return byCategory[id] || [];
  };

  const badgeCount = (id) => {
    if (id === 'favoris') return favorites.length || null;
    if (id === 'recents') return recents.length || null;
    return null;
  };

  // Navigation flèches haut/bas dans la liste de catégories
  const handleNavKeyDown = (e) => {
    const btns = Array.from(e.currentTarget.querySelectorAll('[data-sidebar-btn]'));
    const idx = btns.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      btns[(idx + 1) % btns.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      btns[(idx - 1 + btns.length) % btns.length]?.focus();
    } else if (e.key === 'ArrowRight' && onFocusGrid) {
      e.preventDefault();
      onFocusGrid();
    }
  };

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
          fixed inset-y-0 left-0 z-40
          bg-[var(--bg-elevated)] border-r border-[var(--border)]
          flex flex-col shadow-[var(--shadow-lg)]
          transform transition-transform duration-300 ease-out
          ${tvMode ? 'w-80' : 'w-72 lg:static lg:shadow-none lg:transform-none'}
          ${isOpen ? 'translate-x-0' : tvMode ? '-translate-x-full' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="py-6 px-5 border-b border-[var(--border)] flex flex-col items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}logo.jpg`}
            alt="OneClickTV"
            className="w-28 h-28 rounded-2xl object-contain shadow-xl"
          />
          <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">OneClickTV</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" onKeyDown={handleNavKeyDown}>
          <ul className="space-y-1.5">
            {/* Chaînes live */}
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = !vodActive && category === cat.id;
              const catChannels = channelsForCat(cat.id);
              const count = badgeCount(cat.id);
              const isFavOrRecent = cat.id === 'favoris' || cat.id === 'recents';
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    data-sidebar-btn="true"
                    onClick={() => onCategoryChange(cat.id)}
                    className={`
                      w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
                      transition-all duration-200 focus:outline-none
                      ${isSelected
                        ? 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/30 shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] border border-transparent'}
                    `}
                  >
                    <Icon size={20} className="shrink-0 opacity-90" />
                    <span className="flex-1 truncate min-w-0 font-medium">{cat.label}</span>
                    {isFavOrRecent
                      ? count ? (
                          <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold shrink-0 tabular-nums ${isSelected ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                            {count}
                          </span>
                        ) : null
                      : catChannels.length > 0 ? <CategoryLogos channels={catChannels} /> : null
                    }
                  </button>
                </li>
              );
            })}

            {/* Séparateur */}
            <li><div className="h-px bg-[var(--border)] mx-2 my-1" /></li>

            {/* VOD en bas */}
            <li>
              <button
                type="button"
                data-sidebar-btn="true"
                onClick={() => { onVodClick?.(); onClose?.(); }}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
                  transition-all duration-200 focus:outline-none
                  ${vodActive
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] border border-transparent'}
                `}
              >
                <Film size={20} className="shrink-0 opacity-90" />
                <span className="flex-1 truncate min-w-0 font-medium">{VOD_ENTRY.label}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 uppercase tracking-wide">VOD</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

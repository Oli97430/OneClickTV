import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Rechercher une chaîne ou un pays...' }) {
  return (
    <div className="relative">
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        size={20}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-11 pr-11 py-3 rounded-2xl
          bg-[var(--bg-card)] border border-[var(--border)]
          text-[var(--text-primary)] placeholder-[var(--text-muted)]
          focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]
          transition-all duration-200
          shadow-[var(--shadow-sm)]
        "
        aria-label="Rechercher"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--border)]/50 transition-colors"
          aria-label="Effacer la recherche"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

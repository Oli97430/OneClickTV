import { X, Maximize2, Volume2 } from 'lucide-react';
import { getChannelLogoUrl } from '../services/iptvService';
import { useI18n } from '../i18n';

export default function MiniPlayer({ channel, onExpand, onClose }) {
  const { t } = useI18n();
  if (!channel) return null;
  const displayName = channel.displayName || channel.name;
  const logoUrl = getChannelLogoUrl(channel.tvgId, channel.name, channel.logo);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-fade-in-up">
      <div className="mx-auto max-w-2xl mb-4 px-4">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl
            bg-[var(--bg-elevated)] border border-[var(--border)]
            shadow-[var(--shadow-lg)] backdrop-blur-xl cursor-pointer
            hover:border-[var(--accent)]/30 transition-all duration-200"
          onClick={onExpand}
        >
          {/* Logo */}
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-full h-full object-contain" />
            ) : (
              <Volume2 size={18} className="text-[var(--text-muted)]" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName}</p>
            <p className="text-[10px] text-[var(--accent)] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              {t('nowPlaying')}
            </p>
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            className="p-2 rounded-lg bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-hover)] transition-colors"
            aria-label={t('expand')}
          >
            <Maximize2 size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 rounded-lg bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors"
            aria-label={t('closePlayer')}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

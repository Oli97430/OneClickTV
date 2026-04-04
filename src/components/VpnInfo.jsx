import { Shield, ExternalLink, Info, X } from 'lucide-react';

const VPN_PROVIDERS = [
  { name: 'NordVPN', url: 'https://nordvpn.com', desc: 'Serveurs en France' },
  { name: 'ExpressVPN', url: 'https://www.expressvpn.com', desc: 'Réseau mondial' },
  { name: 'CyberGhost', url: 'https://www.cyberghostvpn.com', desc: 'Option abordable' },
  { name: 'Proton VPN', url: 'https://protonvpn.com', desc: 'Gratuit et payant' },
  { name: 'Mullvad', url: 'https://mullvad.net', desc: 'Confidentialité' },
];

export default function VpnInfo({ onClose, isOpen }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)]">
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--bg-elevated)]/95 backdrop-blur-sm z-10">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/20">
              <Shield className="text-emerald-400" size={22} />
            </span>
            Chaînes géobloquées & VPN
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 text-[var(--text-secondary)] text-sm">
          <div className="flex gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Info size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong className="text-amber-200 font-semibold">Pourquoi certains flux ne marchent pas ?</strong>
              <br />
              <span className="text-[var(--text-secondary)]">Certaines chaînes (TF1, M6, 6ter, Canal+, etc.) limitent la lecture à la France ou à un pays précis. Si vous êtes à l’étranger, le flux peut afficher « Flux indisponible » ou ne pas démarrer.</span>
            </p>
          </div>

          <div>
            <p className="mb-4">
              Vous pouvez <strong className="text-[var(--text-primary)]">utiliser un VPN sur votre appareil</strong> puis rafraîchir cette page : les chaînes géobloquées pourront alors être accessibles si vous vous connectez via un serveur en France.
            </p>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Comment faire en pratique ?</h3>
            <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted)]">
              <li>Installez un <strong className="text-[var(--text-secondary)]">client VPN</strong> sur votre ordinateur, téléphone ou tablette.</li>
              <li>Connectez-vous à un <strong className="text-[var(--text-secondary)]">serveur en France</strong> (ou au pays de la chaîne).</li>
              <li>Ouvrez ou rafraîchissez <strong className="text-[var(--text-secondary)]">OneClickTV</strong> dans le navigateur.</li>
              <li>Relancez la lecture de la chaîne qui était bloquée.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">Quelques fournisseurs VPN (avec serveurs en France)</h3>
            <p className="text-[var(--text-muted)] text-xs mb-3">
              Liens externes à titre informatif. OneClickTV n’est pas affilié à ces services.
            </p>
            <ul className="space-y-2">
              {VPN_PROVIDERS.map((vpn) => (
                <li key={vpn.name}>
                  <a
                    href={vpn.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--border)]/30 border border-[var(--border)] hover:border-emerald-500/30 transition-all group"
                  >
                    <span className="font-medium text-[var(--text-primary)] group-hover:text-emerald-400">{vpn.name}</span>
                    <span className="text-[var(--text-muted)] text-xs">{vpn.desc}</span>
                    <ExternalLink size={14} className="text-[var(--text-muted)] group-hover:text-emerald-400 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[var(--text-muted)] text-xs pt-4 border-t border-[var(--border)]">
            L’usage d’un VPN peut être soumis aux conditions d’utilisation des chaînes et à la législation de votre pays. Utilisez un VPN de manière responsable.
          </p>
        </div>
      </div>
    </div>
  );
}

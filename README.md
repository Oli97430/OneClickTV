# OneClickTV

**Application de streaming TV francophone — 100 % gratuite**

OneClickTV est une application de bureau (Windows / macOS / Linux) et mobile (Android) permettant de regarder les chaînes de télévision francophones en direct ainsi que des films et séries en VOD, sans abonnement, sans inscription et sans publicité.

---

## Fonctionnalités

### Chaînes live
- **416 chaînes francophones en direct** — France, Belgique, Suisse, Canada, Sénégal, Côte d'Ivoire, Maroc, Cameroun… via [iptv-org/iptv](https://github.com/iptv-org/iptv) (`languages/fra.m3u`)
- **7 catégories** — Actualités, Sport, Musique, Cinéma, Enfants, Culture & Docs, Généraliste
- **Favoris & Récents** — Accès rapide, réorganisation par glisser-déposer
- **Lecteur HLS lazy** — Lecture fluide des flux `.m3u8` via HLS.js (chargé à la demande)
- **Flux de secours** — Basculement automatique sur une URL alternative si le flux principal est indisponible
- **EPG temps réel** — Programme en cours + notification cloche si le prochain programme démarre dans < 5 min
- **Skeleton loading** — Cartes shimmer animées pendant le chargement de la playlist

### VOD
- **Arte** — Catalogue complet via API v4 (Films, Séries, Documentaires, Concerts, Histoire, Sciences, Culture…)
- **France TV** — Accès direct aux replays France 2, France 3, France 4, France 5, Franceinfo, La 1ère

### Lecteur vidéo
- **Mini-player** — Réduire en barre flottante pour continuer à naviguer
- **Plein écran** — Touche `F` ou bouton dédié
- **Raccourcis clavier** — `Espace` play/pause · `F` fullscreen · `M` muet · `Échap` minimiser · `↑↓` volume · `←→` avancer/reculer
- **Chromecast** — Web Cast SDK + plugin natif Android

### Expérience TV / Box Android
- **Mode TV** — Grille large, cartes plus grandes, sidebar en overlay
- **Navigation D-pad complète** — Flèches directionnelles, Enter pour télécommande
- **Bouton Retour télécommande** — Ferme le lecteur au lieu de quitter l'app (intercept `popstate`)
- **Icône dans le launcher TV** — Catégorie `LEANBACK_LAUNCHER` pour apparaître sur les box Android TV
- **Swipe** — Glissement gauche/droite pour changer de catégorie (mobile/tactile)
- **Screensaver** — Écran de veille après 30 s d'inactivité (horloge + EPG + chaîne en cours)

### Général
- **i18n 4 langues** — Français · English · Deutsch · Español
- **Thème clair / sombre** — Transition fluide
- **Statistiques de visionnage** — Temps de visionnage mensuel par chaîne (local, aucun serveur)
- **PWA installable** — Service Worker cache-first, manifeste, icône, `theme-color`
- **Glisser-déposer favoris** — Réorganiser l'ordre des chaînes favorites
- **Virtual grid** — `content-visibility: auto` pour les performances sur les grandes listes
- **Multi-plateforme** — Windows, macOS, Linux (Electron) et Android (Capacitor)
- **100 % gratuit** — Aucun abonnement, aucune donnée collectée, aucune publicité

---

## Installation

### Application de bureau (Windows)

Téléchargez le dernier installateur depuis les [Releases GitHub](https://github.com/Oli97430/OneClickTV/releases).

- **Windows** : `OneClickTV Setup 1.3.0.exe` (installateur NSIS, 64-bit)

### Android

Téléchargez `OneClickTV-1.3.0.apk` depuis les [Releases GitHub](https://github.com/Oli97430/OneClickTV/releases) ou compilez depuis les sources.

### Web (PWA)

Ouvrez l'application dans Chrome/Edge et cliquez sur **Installer** dans la barre d'adresse pour l'utiliser hors-ligne.

---

## Développement

### Prérequis

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9
- Android Studio + SDK Android 33+ (build Android uniquement)
- Java 17+ (Gradle)

### Installation

```bash
git clone https://github.com/Oli97430/OneClickTV.git
cd OneClickTV
npm install
```

### Lancer en mode développement (Electron)

```bash
npm run electron
```

Démarre Vite sur `http://localhost:8080` et ouvre la fenêtre Electron automatiquement.

### Lancer en mode web uniquement

```bash
npm run dev
```

### Compiler l'application de bureau (Windows .exe)

```bash
npm run build:desktop
```

Génère `release/OneClickTV Setup 1.3.0.exe`.

### Compiler pour Android

```bash
npm run build:android          # vite build + cap sync
cd android
./gradlew assembleDebug        # APK debug
# ou
./gradlew assembleRelease      # APK release (nécessite une keystore)
```

### Ouvrir dans Android Studio

```bash
npm run cap:android
```

---

## Stack technique

| Technologie | Rôle |
|---|---|
| React 19 | Interface utilisateur |
| Vite 7 | Build tool & serveur de développement |
| Tailwind CSS 4 | Styles |
| HLS.js | Lecture des flux live et VOD M3U8 (lazy import) |
| Electron 33 | Application de bureau |
| Capacitor 8 | Application Android |
| Google Cast SDK 22 | Chromecast natif Android |
| @capacitor/browser | Ouverture de liens externes (Android) |
| Axios | Requêtes HTTP |
| lucide-react | Icônes |

---

## Sources de contenu

| Source | Type | Notes |
|---|---|---|
| [iptv-org/iptv](https://github.com/iptv-org/iptv) | Chaînes live | Playlist `languages/fra.m3u`, 416 chaînes francophones mondiales |
| [Arte API v4](https://api.arte.tv/api/emac/v4/fr/web/pages/HOME/) | VOD | Catalogue Arte (France + Allemagne + DOM-TOM) |
| [Arte Player API v2](https://api.arte.tv/api/player/v2/config/fr/) | VOD stream | Résolution HLS, accessible globalement |
| [France TV](https://www.france.tv) | Replay | Liens directs vers les replays officiels |
| [EPG.pw](https://epg.pw) | EPG | Guide des programmes temps réel, batch queue |

---

## Notes

- Les flux IPTV proviennent de sources publiques et appartiennent à leurs diffuseurs respectifs.
- Le catalogue Arte est accessible depuis la France (métropole et DOM-TOM) et l'Allemagne.
- Certains flux live peuvent être temporairement hors ligne selon les diffuseurs.
- Les statistiques de visionnage sont stockées uniquement en local (`localStorage`), aucune donnée n'est envoyée.

---

## Auteur

**Olivier Hoarau**  
✉ [Tarraw974@gmail.com](mailto:Tarraw974@gmail.com)

---

*OneClickTV — La TV francophone, en un clic, gratuitement.*

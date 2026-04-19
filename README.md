# OneClickTV

**Application de streaming TV francophone — 100 % gratuite**

OneClickTV est une application de bureau (Windows / macOS / Linux) et mobile (Android) permettant de regarder les chaînes de télévision francophones en direct ainsi que des films et séries en VOD, sans abonnement, sans inscription et sans publicité.

---

## Fonctionnalités

### Chaînes live
- **Plus de 100 chaînes en direct** — Actualités, Sport, Musique, Généraliste
- **Recherche instantanée** — Filtrez par nom ou catégorie
- **Favoris & Récents** — Accès rapide aux chaînes préférées et dernièrement regardées
- **Lecteur HLS intégré** — Lecture fluide des flux `.m3u8` via HLS.js
- **EPG temps réel** — Programme en cours affiché sur chaque chaîne avec barre de progression

### VOD
- **Arte** — Catalogue complet (Cinéma, Documentaires, Séries, Concerts, Sciences…) avec lecteur HLS intégré
- **France TV** — Accès direct aux replays France 2, France 3, France 4, France 5, Franceinfo, La 1ère

### Expérience TV / Box Android
- **Mode TV** — Grille large, cartes plus grandes, sidebar en overlay
- **Navigation D-pad complète** — Flèches directionnelles, Enter, Retour pour télécommande
- **Chromecast natif Android** — Cast SDK intégré (plugin Capacitor natif), diffusion sur TV depuis l'app Android

### Général
- **Thème clair / sombre**
- **Multi-plateforme** — Windows, macOS, Linux (Electron) et Android (Capacitor)
- **100 % gratuit** — Aucun abonnement, aucune donnée collectée, aucune publicité

---

## Installation

### Application de bureau (Windows)

Téléchargez le dernier installateur depuis le dossier `release/` ou les releases GitHub.

- **Windows** : `OneClickTV Setup 1.0.0.exe` (installateur NSIS, 64-bit)

### Android

Transférez `app-debug.apk` sur votre appareil (dossier `android/app/build/outputs/apk/debug/`) ou compilez depuis les sources.

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

Génère `release/OneClickTV Setup 1.0.0.exe`.

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
| HLS.js | Lecture des flux live et VOD M3U8 |
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
| [iptv-org/iptv](https://github.com/iptv-org/iptv) | Chaînes live | Playlist `fr.m3u`, flux HLS publics |
| [Arte API v3](https://api.arte.tv/api/emac/v3/fr/web/data/) | VOD | Catalogue Arte (France + Allemagne + DOM-TOM) |
| [Arte Player API v2](https://api.arte.tv/api/player/v2/config/fr/) | VOD stream | Résolution HLS, accessible globalement |
| [France TV](https://www.france.tv) | Replay | Liens directs vers les replays officiels |
| [EPG.pw](https://epg.pw) | EPG | Guide des programmes temps réel |

---

## Notes

- Les flux IPTV proviennent de sources publiques et appartiennent à leurs diffuseurs respectifs.
- Le catalogue Arte est accessible depuis la France (métropole et DOM-TOM) et l'Allemagne.
- Certains flux live peuvent être temporairement hors ligne selon les diffuseurs.

---

## Auteur

**Olivier Hoarau**
✉ [Tarraw974@gmail.com](mailto:Tarraw974@gmail.com)

---

*OneClickTV — La TV francophone, en un clic, gratuitement.*

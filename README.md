# OneClickTV

**Application de streaming TV francophone — 100 % gratuite**

OneClickTV est une application de bureau (Windows / macOS / Linux) et mobile (Android) permettant de regarder les chaînes de télévision francophones en direct, sans abonnement, sans inscription et sans publicité.

---

## Fonctionnalités

- **Chaînes en direct** — Actualités, Sport, Musique, Généraliste et bien plus
- **Recherche instantanée** — Filtrez les chaînes par nom ou catégorie
- **Lecteur HLS intégré** — Lecture fluide des flux `.m3u8` via HLS.js
- **Enregistrement** — Enregistrez le programme en cours au format `.webm`
- **Multi-plateforme** — Windows, macOS, Linux (Electron) et Android (Capacitor)
- **100 % gratuit** — Aucun abonnement, aucune donnée collectée, aucune publicité

---

## Installation

### Application de bureau (Windows / macOS / Linux)

Téléchargez le dernier installateur dans le dossier `release/` ou depuis les releases GitHub.

- **Windows** : `OneClickTV Setup x.x.x.exe` (installateur NSIS)
- **macOS** : `OneClickTV-x.x.x.dmg`

### Android

Compilez l'APK depuis les sources (voir section Développement) ou transférez le fichier `.apk` sur votre appareil.

---

## Développement

### Prérequis

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### Installation des dépendances

```bash
git clone https://github.com/votre-repo/oneclicktv.git
cd oneclicktv
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

### Compiler l'application de bureau

```bash
npm run build:desktop
```

Génère l'installateur dans le dossier `release/`.

### Compiler pour Android

```bash
npm run build:android
# Puis ouvrir Android Studio :
npm run cap:android
```

---

## Stack technique

| Technologie | Rôle |
|---|---|
| React 19 | Interface utilisateur |
| Vite 7 | Build tool & serveur de développement |
| Tailwind CSS 4 | Styles |
| HLS.js | Lecture des flux live M3U8 |
| Electron 33 | Application de bureau |
| Capacitor 8 | Application Android |
| Axios | Requêtes HTTP |
| lucide-react | Icônes |

---

## Source des chaînes

Les flux proviennent du projet open source [iptv-org/iptv](https://github.com/iptv-org/iptv), une liste publique de chaînes IPTV francophones (`fr.m3u`).

> Certaines chaînes peuvent être géo-bloquées ou temporairement hors ligne selon votre localisation.
> Utilisez un VPN si certains flux ne fonctionnent pas depuis votre pays.

---

## Gratuit et open source

OneClickTV est **entièrement gratuit**. Aucun paiement, aucun abonnement, aucune collecte de données personnelles.
Les flux IPTV utilisés appartiennent à leurs diffuseurs respectifs.

---

## Auteur

**Olivier Hoarau**
✉ [Tarraw974@gmail.com](mailto:Tarraw974@gmail.com)

---

*OneClickTV — La TV francophone, en un clic, gratuitement.*

# 🎵 MyxJam

Your Spotify experience, elevated. Create playlists from any combination of artists, albums, and playlists. Discover forgotten favorites. Battle your friends. See your music DNA.

**[🚀 Try it live → myx-jam.vercel.app](https://myx-jam.vercel.app)**

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

---

## ✨ Features

### 🎛️ Dashboard
Your music command center. Everything at a glance — what you're listening to, your taste profile, top artists, and quick access to every feature.

### 🎵 Now Playing
Live playback widget with a spinning vinyl record, synced lyrics (via LRCLIB), media controls, progress bar, and Up Next queue. Lyrics highlight in real-time as the song plays. Click the record to pause. The vinyl freezes at its current rotation.

### 🎚️ Playlist Creator
Build playlists from **three source types** — mix and match freely:
- **🎤 Artists** — pick top tracks per artist (1-10 configurable)
- **💿 Albums** — add full albums
- **📋 Playlists** — import tracks from existing playlists

Name it, save it to Spotify in one click.

### ⛏️ Song Archaeology
Dig through your listening history to unearth forgotten favorites. Compares your all-time top tracks against recent listening to find songs you used to love but haven't played in ages. Grouped by era — Ancient History, The Golden Era, The Middle Ages, and more.

### ⚔️ Playlist Battles
Challenge friends to playlist curation battles:
1. Pick a theme ("Songs for a 3am drive", "Your villain era")
2. Each person creates a playlist on Spotify
3. Paste the URLs, generate a shareable battle link
4. Friends vote — winner takes bragging rights

No database needed. Everything lives in the URL.

### 📊 Listening Stats
Deep dive into your taste with time range toggles (4 weeks / 6 months / all time):
- **Music Personality** — genre-based taste profile (mainstream vs underground, hip-hop, rock, electronic, indie...)
- **Top Artists & Tracks** — ranked with album art
- **Genre Breakdown** — weighted tag cloud
- **Recently Played** — with relative timestamps

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **Auth** | NextAuth.js v5 + Spotify OAuth |
| **API** | Spotify Web API |
| **Lyrics** | LRCLIB (synced) + lyrics.ovh (fallback) |
| **Hosting** | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- [Spotify Developer Account](https://developer.spotify.com/dashboard)

### Setup

```bash
git clone https://github.com/HaseebKhalid1507/MyxJam.git
cd MyxJam
npm install
```

Create `.env.local`:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
AUTH_SECRET=your_random_secret
AUTH_URL=http://127.0.0.1:3000
NEXTAUTH_URL=http://127.0.0.1:3000
AUTH_TRUST_HOST=true
```

Add redirect URI in [Spotify Dashboard](https://developer.spotify.com/dashboard):
```
http://127.0.0.1:3000/api/auth/callback/spotify
```

### Run

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── dashboard/       # Main hub — now playing, stats, quick actions
│   ├── create/          # Playlist builder (artists + albums + playlists)
│   ├── stats/           # Listening stats & music personality
│   ├── archaeology/     # Forgotten favorites dig
│   ├── battles/         # Playlist battle creator
│   │   └── view/        # Battle voting page
│   └── api/spotify/     # API routes
│       ├── search/      # Artist search
│       ├── search-all/  # Album & playlist search
│       ├── stats/       # Listening stats + music personality
│       ├── archaeology/ # Forgotten gems analysis
│       ├── now-playing/ # Current track + queue
│       ├── lyrics/      # Synced lyrics (LRCLIB + fallback)
│       ├── player/      # Playback controls
│       └── playlists/   # Playlist creation + fetching
├── components/          # Auth button, providers
├── lib/
│   └── spotify.ts       # Spotify API client (20+ methods)
└── auth.ts              # NextAuth config + token refresh
```

---

## 🎵 Spotify Scopes Used

| Scope | Used For |
|-------|----------|
| `user-read-email` | Profile |
| `user-read-private` | Profile |
| `playlist-modify-public` | Create playlists |
| `playlist-modify-private` | Create playlists |
| `user-top-read` | Top artists/tracks for stats |
| `user-read-recently-played` | Recently played + archaeology |
| `user-read-playback-state` | Now playing + queue |
| `user-read-currently-playing` | Now playing |
| `user-modify-playback-state` | Media controls |

---

## 📄 License

MIT

---

Built by [Haseeb Khalid](https://haseebkhalid1507.github.io)

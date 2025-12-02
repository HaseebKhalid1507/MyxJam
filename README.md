# 🎵 MyxJam

Create personalized Spotify playlists from your favorite artists in seconds.

**[🚀 Try it live → myx-jam.vercel.app](https://myx-jam.vercel.app)**

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## ✨ Features

- 🔐 **Spotify OAuth** — Secure login with your Spotify account
- 🔍 **Artist Search** — Find any artist on Spotify
- 🎚️ **Customizable** — Choose 1-10 songs per artist
- 📝 **Custom Names** — Name your playlist anything you want
- ⚡ **One-Click Create** — Instantly save to your Spotify library

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: NextAuth.js v5 with Spotify OAuth
- **Styling**: Tailwind CSS v4
- **API**: Spotify Web API
- **Hosting**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Spotify Developer Account

### Setup

1. Clone the repo
   ```bash
   git clone https://github.com/HaseebKhalid1507/MyxJam.git
   cd MyxJam
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create `.env.local` with your credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   AUTH_SECRET=your_random_secret
   AUTH_URL=http://127.0.0.1:3000
   NEXTAUTH_URL=http://127.0.0.1:3000
   AUTH_TRUST_HOST=true
   ```

4. Add redirect URI in [Spotify Dashboard](https://developer.spotify.com/dashboard):
   ```
   http://127.0.0.1:3000/api/auth/callback/spotify
   ```

5. Run the dev server
   ```bash
   npm run dev
   ```

6. Open [http://127.0.0.1:3000](http://127.0.0.1:3000)

## 📄 License

MIT

---

**A Piexxes Creation** ✨

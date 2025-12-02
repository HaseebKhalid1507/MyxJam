# MyxJam - Copilot Instructions

## Project Overview
MyxJam is a Next.js 16 (App Router) application that creates personalized Spotify playlists from selected artists. Uses NextAuth.js v5 beta for Spotify OAuth with token refresh.

## Architecture

### Authentication Flow
- `src/auth.ts` - Central NextAuth config with Spotify OAuth, JWT token storage, and automatic refresh
- Session includes `accessToken` for Spotify API calls (extended in `src/types/next-auth.d.ts`)
- Always use `127.0.0.1` not `localhost` (Spotify OAuth redirect requirement)

### Data Flow
```
Client Page → API Route → SpotifyClient → Spotify Web API
     ↑                         ↑
useSession()              auth() for accessToken
```

### Key Files
| File | Purpose |
|------|---------|
| `src/auth.ts` | NextAuth config, token refresh logic |
| `src/lib/spotify.ts` | Typed `SpotifyClient` class wrapping Spotify Web API |
| `src/app/api/spotify/*` | API routes proxy Spotify calls (search, playlists, top-tracks) |
| `src/components/providers.tsx` | `SessionProvider` wrapper for client components |

## Patterns & Conventions

### API Routes
- Always check `session?.accessToken` first, return 401 if missing
- Use `createSpotifyClient(session.accessToken)` from `@/lib/spotify`
- Sanitize all inputs (slice strings, validate URIs with regex)
```typescript
// Example pattern from src/app/api/spotify/playlists/route.ts
const session = await auth();
if (!session?.accessToken) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const spotify = createSpotifyClient(session.accessToken);
```

### Client Components
- Mark with `"use client"` directive
- Use `useSession()` from `next-auth/react` for auth state
- Redirect unauthenticated users: `if (status === "unauthenticated") router.push("/")`
- Use `mounted` state pattern for hydration-safe animations

### Spotify API
- Extend `SpotifyClient` in `src/lib/spotify.ts` for new endpoints
- All methods return typed interfaces (`SpotifyArtist`, `SpotifyTrack`, etc.)
- Batch operations: Spotify limits 100 tracks per request (handled in `addTracksToPlaylist`)

## Development

### Commands
```bash
npm run dev        # Start dev server on 127.0.0.1:3000
npm run dev:https  # HTTPS mode (uses certificates/)
npm run build      # Production build
npm run lint       # ESLint
```

### Environment Variables (`.env.local`)
```env
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
AUTH_SECRET=xxx
AUTH_URL=http://127.0.0.1:3000
NEXTAUTH_URL=http://127.0.0.1:3000
AUTH_TRUST_HOST=true
```

### Spotify Dashboard Setup
Add redirect URI: `http://127.0.0.1:3000/api/auth/callback/spotify`

## Styling
- Tailwind CSS v4 with custom design system
- Spotify green: `#1DB954` / `[#1DB954]`
- Dark theme: `zinc-950` background, gradient overlays
- Images from Spotify CDN allowed via `next.config.ts` `remotePatterns`

## Adding New Features

### New Spotify API Endpoint
1. Add method to `SpotifyClient` class in `src/lib/spotify.ts`
2. Create API route in `src/app/api/spotify/[feature]/route.ts`
3. Follow existing auth + sanitization patterns

### New Page
1. Create in `src/app/[route]/page.tsx`
2. Add auth redirect logic if protected
3. Use `@/components` path alias for shared components

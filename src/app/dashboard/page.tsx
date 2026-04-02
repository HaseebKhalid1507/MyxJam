"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthButton } from "@/components/auth-button";

interface DashboardData {
  topArtists: any[];
  topTracks: any[];
  topGenres: { genre: string; count: number }[];
  audioFeatures: Record<string, number> | null;
  recentlyPlayed: any[];
  stats: {
    totalRecentMinutes: number;
    uniqueArtists: number;
    uniqueTracks: number;
  };
}

interface ArchData {
  forgottenGems: any[];
  stillLoved: any[];
  forgottenArtists: any[];
  stats: { totalDugUp: number; stillLovedCount: number };
}

const PERSONALITY_LABELS: Record<string, { label: string; emoji: string }> = {
  mainstream: { label: "Mainstream", emoji: "📻" },
  underground: { label: "Underground", emoji: "🕳️" },
  hip_hop: { label: "Hip-Hop", emoji: "🎤" },
  rock: { label: "Rock", emoji: "🎸" },
  electronic: { label: "Electronic", emoji: "🎛️" },
  pop: { label: "Pop", emoji: "🎵" },
  indie: { label: "Indie", emoji: "🌙" },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [statsData, setStatsData] = useState<DashboardData | null>(null);
  const [archData, setArchData] = useState<ArchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowPlaying, setNowPlaying] = useState<any>(null);
  const [localProgress, setLocalProgress] = useState(0);
  const [lyricsData, setLyricsData] = useState<{ synced: boolean; lines: { time: number; text: string }[]; plainLyrics: string | null } | null>(null);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [extraTracks, setExtraTracks] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lastLyricsTrack, setLastLyricsTrack] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (status === "unauthenticated") router.push("/"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/spotify/stats?time_range=short_term").then((r) => r.ok ? r.json() : null),
      fetch("/api/spotify/archaeology").then((r) => r.ok ? r.json() : null),
      fetch("/api/spotify/now-playing").then((r) => r.ok ? r.json() : null),
    ])
      .then(([stats, arch, np]) => {
        setStatsData(stats);
        setArchData(arch);
        setNowPlaying(np);
      })
      .finally(() => setLoading(false));

    // Poll now playing every 30s
    const interval = setInterval(() => {
      fetch("/api/spotify/now-playing").then((r) => r.ok ? r.json() : null).then((np) => {
        setNowPlaying(np);
        if (np?.playing && np.track) setLocalProgress(np.track.progress_ms);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [status]);

  // Sync extra tracks with lyrics
  useEffect(() => {
    setExtraTracks(lyricsOpen);
  }, [lyricsOpen]);

  // Clear lyrics when track changes
  useEffect(() => {
    if (!nowPlaying?.track) return;
    const trackKey = `${nowPlaying.track.name}-${nowPlaying.track.artists?.[0]}`;
    if (lastLyricsTrack && lastLyricsTrack !== trackKey) {
      setLyricsData(null);
      setLastLyricsTrack("");
      // Auto-refetch if lyrics panel is open
      if (lyricsOpen) {
        setLyricsLoading(true);
        setLastLyricsTrack(trackKey);
        fetch(`/api/spotify/lyrics?artist=${encodeURIComponent(nowPlaying.track.artists[0])}&title=${encodeURIComponent(nowPlaying.track.name)}&duration=${nowPlaying.track.duration_ms}`)
          .then((r) => r.json())
          .then((d) => setLyricsData(d))
          .catch(() => setLyricsData(null))
          .finally(() => setLyricsLoading(false));
      }
    }
  }, [nowPlaying?.track?.name]);

  // Tick progress every second while playing, refetch when song should end
  useEffect(() => {
    if (!nowPlaying?.playing) return;
    setLocalProgress(nowPlaying.track?.progress_ms || 0);
    const tick = setInterval(() => {
      setLocalProgress((p: number) => {
        const max = nowPlaying.track?.duration_ms || 0;
        if (max > 0 && p + 1000 >= max) {
          // Song ended — refetch immediately
          fetch("/api/spotify/now-playing").then((r) => r.ok ? r.json() : null).then((np) => {
            setNowPlaying(np);
            if (np?.playing && np.track) setLocalProgress(np.track.progress_ms);
          });
          return max;
        }
        return max > 0 ? Math.min(p + 1000, max) : p;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [nowPlaying]);

  if (status === "loading" || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#1DB954]/30" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954]">
              <MusicIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-zinc-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  if (!session) return null;

  const userName = session.user?.name?.split(" ")[0] || "there";

  return (
    <div className={`min-h-screen bg-zinc-950 text-white transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/3 left-1/4 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-[#1DB954]/15 via-emerald-900/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 right-1/3 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-purple-900/10 to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1DB954] to-emerald-600 shadow-lg shadow-[#1DB954]/25">
              <MusicIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">MyxJam</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-[#1DB954] font-medium">Home</a>
            <a href="/create" className="text-sm text-zinc-400 hover:text-white transition-colors">Create</a>
            <a href="/stats" className="text-sm text-zinc-400 hover:text-white transition-colors">Stats</a>
            <a href="/archaeology" className="text-sm text-zinc-400 hover:text-white transition-colors">Dig</a>
            <a href="/battles" className="text-sm text-zinc-400 hover:text-white transition-colors">Battles</a>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Hey, <span className="bg-gradient-to-r from-[#1DB954] via-emerald-400 to-cyan-400 bg-clip-text text-transparent">{userName}</span> 👋
          </h1>
          <p className="text-lg text-zinc-400">Here&apos;s what&apos;s going on with your music</p>
        </div>

        {/* Now Playing */}
        {nowPlaying?.playing && nowPlaying.track && (
          <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_260px]">
            <div
              className="group relative flex items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all duration-500 ease-out animate-[cardIn_600ms_ease-out]"
            >
              <div className="relative h-40 w-48 flex-shrink-0">
                {nowPlaying.track.image && (
                  <div className="relative h-40 w-40">
                    {/* Spinning vinyl */}
                    <div className="absolute inset-0 animate-[spin_16s_linear_infinite] rounded-full bg-zinc-900 shadow-2xl">
                      <Image
                        src={nowPlaying.track.image}
                        alt={nowPlaying.track.album}
                        width={160}
                        height={160}
                        className="h-40 w-40 rounded-full object-cover"
                      />
                      <div className="absolute inset-0 rounded-full" style={{
                        background: 'repeating-radial-gradient(circle at center, transparent 0px, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 6px)'
                      }} />
                      <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-700 bg-zinc-950" />
                    </div>
                    {/* Tonearm */}
                    <div className="absolute -right-6 -top-2 z-10" style={{ transformOrigin: '85% 15%', transform: 'rotate(22deg)' }}>
                      {/* Pivot base */}
                      <div className="absolute right-0 top-0 h-4 w-4 rounded-full bg-zinc-600 shadow-md" />
                      {/* Arm */}
                      <div className="absolute right-1.5 top-3 h-24 w-1 origin-top rounded-full bg-gradient-to-b from-zinc-500 to-zinc-600 shadow" />
                      {/* Headshell */}
                      <div className="absolute right-0.5 top-[104px] h-3 w-2.5 rounded-b bg-zinc-400 shadow" />
                      {/* Needle tip */}
                      <div className="absolute right-1 top-[116px] h-2 w-0.5 bg-zinc-300" />
                    </div>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-xs font-medium text-[#1DB954]">NOW PLAYING</span>
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#1DB954]"></span>
                  <a
                    href={nowPlaying.track.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-zinc-600 transition-all hover:text-[#1DB954] hover:scale-110"
                    title="Open in Spotify"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="h-7 w-7 translate-y-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </a>
                </div>
                <div className="truncate font-semibold text-lg">{nowPlaying.track.name}</div>
                <div className="truncate text-sm text-zinc-400 mb-3">
                  {nowPlaying.track.artists.join(", ")} · {nowPlaying.track.album}
                </div>
                {/* Lyrics toggle */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const trackKey = `${nowPlaying.track.name}-${nowPlaying.track.artists[0]}`;
                    if (lyricsOpen) {
                      setLyricsOpen(false);
                    } else {
                      setLyricsOpen(true);
                      if (lastLyricsTrack !== trackKey) {
                        setLyricsLoading(true);
                        setLyricsData(null);
                        setLastLyricsTrack(trackKey);
                        fetch(`/api/spotify/lyrics?artist=${encodeURIComponent(nowPlaying.track.artists[0])}&title=${encodeURIComponent(nowPlaying.track.name)}&duration=${nowPlaying.track.duration_ms}`)
                          .then((r) => r.json())
                          .then((d) => setLyricsData(d))
                          .catch(() => setLyricsData(null))
                          .finally(() => setLyricsLoading(false));
                      }
                    }
                  }}
                  className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#1DB954] transition-colors"
                >
                  <span>{lyricsOpen ? "▼" : "▶"}</span>
                  <span>Lyrics</span>
                </button>

                <div
                  className="overflow-hidden transition-[max-height,opacity] duration-500 ease-out"
                  style={{
                    maxHeight: lyricsOpen ? '200px' : '0px',
                    opacity: lyricsOpen ? 1 : 0,
                  }}
                >
                  <SyncedLyrics
                    data={lyricsData}
                    loading={lyricsLoading}
                    progressMs={localProgress}
                  />
                </div>

                {nowPlaying.track.duration_ms > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-[#1DB954] transition-[width] duration-[1000ms] ease-linear"
                        style={{ width: `${(localProgress / nowPlaying.track.duration_ms) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] tabular-nums text-zinc-500">
                      <span>{formatMs(localProgress)}</span>
                      <span>{formatMs(nowPlaying.track.duration_ms)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Up Next */}
            {nowPlaying.nextUp && nowPlaying.nextUp.length > 0 && (
              <div className="hidden lg:flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all duration-500 ease-out animate-[cardInRight_600ms_ease-out_150ms_both]">
                <span className="mb-3 text-xs font-medium text-zinc-500">UP NEXT</span>
                <div className="flex flex-col gap-2.5 flex-1 transition-all duration-500 ease-out">
                  {nowPlaying.nextUp.slice(0, extraTracks ? 6 : 4).map((track: any, i: number) => (
                    <div key={track.name + i} className={`flex items-center gap-2.5${i >= 4 ? ' animate-[cardIn_300ms_ease-out]' : ''}`}>
                      {track.image && (
                        <Image
                          src={track.image}
                          alt={track.album}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-md object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">{track.name}</div>
                        <div className="truncate text-[11px] text-zinc-500">{track.artists.join(", ")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/create" icon="🎵" title="Create Playlist" subtitle="Mix artists, albums & playlists" color="from-[#1DB954] to-emerald-600" />
          <QuickAction href="/battles" icon="⚔️" title="Start a Battle" subtitle="Challenge friends" color="from-orange-500 to-red-500" />
          <QuickAction href="/archaeology" icon="⛏️" title="Dig for Gems" subtitle="Find forgotten favorites" color="from-amber-500 to-yellow-600" />
          <QuickAction href="/stats" icon="📊" title="Full Stats" subtitle="Deep dive into your taste" color="from-purple-500 to-blue-500" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Spinner />
            <p className="mt-4 text-zinc-500">Crunching your data...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Stats Row */}
            {statsData && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MiniStat icon="🎧" value={`${statsData.stats.totalRecentMinutes}`} unit="min" label="Recent Listening" />
                <MiniStat icon="🎤" value={`${statsData.stats.uniqueArtists}`} label="Artists This Month" />
                <MiniStat icon="🎵" value={`${statsData.stats.uniqueTracks}`} label="Unique Tracks" />
                <MiniStat icon="🏷️" value={statsData.topGenres[0]?.genre || "—"} label="Top Genre" />
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Music Personality (compact) */}
              {(statsData as any)?.musicPersonality && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">🧬 Music DNA</h2>
                    <a href="/stats" className="text-xs text-zinc-500 hover:text-[#1DB954]">See all →</a>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(PERSONALITY_LABELS).map(([key, { label, emoji }]) => {
                      const value = ((statsData as any).musicPersonality)?.[key] ?? 0;
                      if (value === 0) return null;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-lg">{emoji}</span>
                          <div className="flex-1">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-zinc-400">{label}</span>
                              <span className="text-zinc-500">{Math.round(value * 100)}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#1DB954] to-emerald-400 transition-all duration-1000" style={{ width: `${value * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top Artists */}
              {statsData && statsData.topArtists.length > 0 && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">🔥 Top Artists</h2>
                    <a href="/stats" className="text-xs text-zinc-500 hover:text-[#1DB954]">See all →</a>
                  </div>
                  <div className="space-y-3">
                    {statsData.topArtists.slice(0, 5).map((artist: any, i: number) => (
                      <div key={artist.id} className="flex items-center gap-3">
                        <span className="w-5 text-right text-xs font-bold text-zinc-600">{i + 1}</span>
                        {artist.images?.[0] ? (
                          <Image src={artist.images[0].url} alt={artist.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover ring-1 ring-zinc-700" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm">🎤</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{artist.name}</div>
                          <div className="truncate text-xs text-zinc-500">{artist.genres?.slice(0, 2).join(", ")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Tracks */}
              {statsData && statsData.topTracks.length > 0 && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">💿 Top Tracks</h2>
                    <a href="/stats" className="text-xs text-zinc-500 hover:text-[#1DB954]">See all →</a>
                  </div>
                  <div className="space-y-3">
                    {statsData.topTracks.slice(0, 5).map((track: any, i: number) => (
                      <div key={track.id} className="flex items-center gap-3">
                        <span className="w-5 text-right text-xs font-bold text-zinc-600">{i + 1}</span>
                        {track.album?.images?.[0] && (
                          <Image src={track.album.images[0].url} alt={track.album.name} width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{track.name}</div>
                          <div className="truncate text-xs text-zinc-500">{track.artists?.map((a: any) => a.name).join(", ")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Genres + Archaeology Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Genre Cloud */}
              {statsData && statsData.topGenres.length > 0 && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">🏷️ Your Genres</h2>
                    <a href="/stats" className="text-xs text-zinc-500 hover:text-[#1DB954]">See all →</a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {statsData.topGenres.slice(0, 10).map(({ genre, count }) => {
                      const max = statsData.topGenres[0]?.count || 1;
                      const opacity = 0.5 + (count / max) * 0.5;
                      return (
                        <span
                          key={genre}
                          className="rounded-full border border-[#1DB954]/20 px-3 py-1.5 text-sm transition-all hover:border-[#1DB954] hover:bg-[#1DB954]/10"
                          style={{ opacity }}
                        >
                          {genre}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Archaeology Preview */}
              {archData && archData.forgottenGems.length > 0 && (
                <div className="rounded-2xl border border-amber-800/20 bg-gradient-to-br from-amber-900/10 to-zinc-900/50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">⛏️ Forgotten Gems</h2>
                    <a href="/archaeology" className="text-xs text-zinc-500 hover:text-amber-400">Dig deeper →</a>
                  </div>
                  <div className="mb-3 flex gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-amber-400">{archData.stats.totalDugUp}</div>
                      <div className="text-xs text-zinc-500">Buried</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">{archData.stats.stillLovedCount}</div>
                      <div className="text-xs text-zinc-500">Timeless</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-stone-400">{archData.forgottenArtists.length}</div>
                      <div className="text-xs text-zinc-500">Ghost Artists</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {archData.forgottenGems.slice(0, 3).map((track: any) => (
                      <div key={track.id} className="flex items-center gap-3">
                        {track.album?.images?.[0] && (
                          <Image src={track.album.images[0].url} alt={track.album.name} width={32} height={32} className="h-8 w-8 rounded-md object-cover ring-1 ring-white/10" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{track.name}</div>
                          <div className="truncate text-xs text-zinc-500">{track.artists?.map((a: any) => a.name).join(", ")}</div>
                        </div>
                        <span className="text-xs text-amber-600">{track.era}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recently Played */}
            {statsData && statsData.recentlyPlayed.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h2 className="mb-4 text-lg font-bold">🕐 Recently Played</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {statsData.recentlyPlayed.slice(0, 5).map((item: any, i: number) => (
                    <div key={`${item.track?.id}-${i}`} className="flex items-center gap-3 rounded-xl bg-zinc-800/50 p-3">
                      {item.track?.album?.images?.[0] && (
                        <Image src={item.track.album.images[0].url} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{item.track?.name}</div>
                        <div className="truncate text-xs text-zinc-500">{item.track?.artists?.[0]?.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-zinc-800/50 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-600">
          Made with <span className="text-[#1DB954]">♥</span> using the Spotify API
        </div>
      </footer>
    </div>
  );
}

// Components
function QuickAction({ href, icon, title, subtitle, color }: { href: string; icon: string; title: string; subtitle: string; color: string }) {
  return (
    <a href={href} className="group relative flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 transition-all hover:border-zinc-600 hover:bg-zinc-800/80 active:scale-[0.98]">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white">{title}</h3>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
      <span className="text-zinc-600 transition-all group-hover:translate-x-1 group-hover:text-white">→</span>
    </a>
  );
}

function SyncedLyrics({ data, loading, progressMs }: { data: any; loading: boolean; progressMs: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Find current line index (offset ahead to compensate for API/render delay)
  const adjustedProgress = progressMs + 1500;
  let currentIdx = -1;
  if (data?.synced && data.lines?.length > 0) {
    for (let i = data.lines.length - 1; i >= 0; i--) {
      if (adjustedProgress >= data.lines[i].time) {
        currentIdx = i;
        break;
      }
    }
  }

  // Auto-scroll to current line
  useEffect(() => {
    if (currentIdx < 0 || !containerRef.current) return;
    const el = containerRef.current.children[currentIdx] as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIdx]);

  if (loading) {
    return (
      <div className="mb-3 rounded-xl bg-zinc-800/50 p-4">
        <p className="text-sm text-zinc-500 animate-pulse">Fetching lyrics...</p>
      </div>
    );
  }

  if (!data || (!data.synced && !data.plainLyrics)) {
    return (
      <div className="mb-3 rounded-xl bg-zinc-800/50 p-4">
        <p className="text-sm text-zinc-500">Lyrics not available for this track</p>
      </div>
    );
  }

  // Synced lyrics
  if (data.synced && data.lines?.length > 0) {
    return (
      <div ref={containerRef} className="mb-3 max-h-36 overflow-y-auto rounded-xl bg-zinc-800/50 p-4 scroll-smooth">
        {data.lines.map((line: { time: number; text: string }, i: number) => (
          <p
            key={i}
            className={`py-1 text-sm transition-all duration-300 ${
              i === currentIdx
                ? "text-[#1DB954] font-semibold text-base scale-[1.02] origin-left"
                : i < currentIdx
                ? "text-zinc-600"
                : "text-zinc-400"
            }`}
          >
            {line.text}
          </p>
        ))}
      </div>
    );
  }

  // Plain lyrics fallback
  return (
    <div className="mb-3 max-h-52 overflow-y-auto rounded-xl bg-zinc-800/50 p-4">
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">{data.plainLyrics}</pre>
    </div>
  );
}

function MiniStat({ icon, value, unit, label }: { icon: string; value: string; unit?: string; label: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-1 text-xl">{icon}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="text-sm text-zinc-500">{unit}</span>}
      </div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  );
}

function Spinner() {
  return <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>;
}

function MusicIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
}

function formatMs(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

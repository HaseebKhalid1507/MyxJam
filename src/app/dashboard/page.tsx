"use client";

import { useState, useEffect } from "react";
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

const FEATURE_LABELS: Record<string, { label: string; emoji: string }> = {
  danceability: { label: "Dance", emoji: "💃" },
  energy: { label: "Energy", emoji: "⚡" },
  valence: { label: "Happy", emoji: "😊" },
  acousticness: { label: "Acoustic", emoji: "🎸" },
  instrumentalness: { label: "Instrumental", emoji: "🎹" },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [statsData, setStatsData] = useState<DashboardData | null>(null);
  const [archData, setArchData] = useState<ArchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (status === "unauthenticated") router.push("/"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/spotify/stats?time_range=short_term").then((r) => r.ok ? r.json() : null),
      fetch("/api/spotify/archaeology").then((r) => r.ok ? r.json() : null),
    ])
      .then(([stats, arch]) => {
        setStatsData(stats);
        setArchData(arch);
      })
      .finally(() => setLoading(false));
  }, [status]);

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
              {/* Audio DNA (compact) */}
              {statsData?.audioFeatures && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">🧬 Audio DNA</h2>
                    <a href="/stats" className="text-xs text-zinc-500 hover:text-[#1DB954]">See all →</a>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(FEATURE_LABELS).map(([key, { label, emoji }]) => {
                      const value = (statsData.audioFeatures as any)?.[key] ?? 0;
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
    <a href={href} className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900 hover:scale-[1.02]">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${color} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`} />
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-zinc-500">{subtitle}</p>
    </a>
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

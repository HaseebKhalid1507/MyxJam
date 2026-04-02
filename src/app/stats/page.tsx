"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthButton } from "@/components/auth-button";

type TimeRange = "short_term" | "medium_term" | "long_term";

interface StatsData {
  topArtists: any[];
  topTracks: any[];
  topGenres: { genre: string; count: number }[];
  audioFeatures: {
    danceability: number;
    energy: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
    tempo: number;
    speechiness: number;
    liveness: number;
  } | null;
  recentlyPlayed: any[];
  stats: {
    totalRecentMinutes: number;
    uniqueArtists: number;
    uniqueTracks: number;
  };
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  short_term: "Last 4 Weeks",
  medium_term: "Last 6 Months",
  long_term: "All Time",
};

const FEATURE_LABELS: Record<string, { label: string; emoji: string; description: string }> = {
  danceability: { label: "Danceability", emoji: "💃", description: "How suitable for dancing" },
  energy: { label: "Energy", emoji: "⚡", description: "Intensity and activity" },
  valence: { label: "Happiness", emoji: "😊", description: "Musical positivity" },
  acousticness: { label: "Acoustic", emoji: "🎸", description: "Acoustic vs electronic" },
  instrumentalness: { label: "Instrumental", emoji: "🎹", description: "Lack of vocals" },
  speechiness: { label: "Speechiness", emoji: "🗣️", description: "Spoken word presence" },
  liveness: { label: "Live Feel", emoji: "🎤", description: "Audience presence" },
};

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    setError(null);
    fetch(`/api/spotify/stats?time_range=${timeRange}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [timeRange, status]);

  if (status === "loading" || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className={`min-h-screen bg-zinc-950 text-white transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/4 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-purple-900/20 via-[#1DB954]/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-blue-900/15 via-transparent to-transparent blur-3xl" />
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
            <a href="/create" className="text-sm text-zinc-400 hover:text-white transition-colors">Create</a>
            <a href="/stats" className="text-sm text-[#1DB954] font-medium">Stats</a>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Your <span className="bg-gradient-to-r from-[#1DB954] via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Listening Stats</span>
            </h1>
            <p className="text-lg text-zinc-400">See what you&apos;ve been vibing to</p>
          </div>

          {/* Time Range Selector */}
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
            {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  timeRange === range
                    ? "bg-[#1DB954] text-white shadow-lg shadow-[#1DB954]/25"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {TIME_RANGE_LABELS[range]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Spinner size="lg" />
            <p className="mt-4 text-zinc-400">Loading your stats...</p>
          </div>
        ) : data ? (
          <div className="space-y-10">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Recent Listening" value={`${data.stats.totalRecentMinutes} min`} icon="🎧" />
              <StatCard label="Unique Artists" value={data.stats.uniqueArtists.toString()} icon="🎤" />
              <StatCard label="Unique Tracks" value={data.stats.uniqueTracks.toString()} icon="🎵" />
              <StatCard label="Top Genre" value={data.topGenres[0]?.genre || "—"} icon="🏷️" />
            </div>

            {/* Audio DNA */}
            {data.audioFeatures && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">Your Audio DNA</h2>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(FEATURE_LABELS).map(([key, { label, emoji, description }]) => {
                      const value = (data.audioFeatures as any)?.[key] ?? 0;
                      return (
                        <div key={key} className="flex items-center gap-4">
                          <span className="text-2xl">{emoji}</span>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium">{label}</span>
                              <span className="text-sm text-zinc-400">{Math.round(value * 100)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#1DB954] to-emerald-400 transition-all duration-1000"
                                style={{ width: `${value * 100}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-zinc-500">{description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {data.audioFeatures.tempo && (
                    <div className="mt-6 flex items-center gap-3 rounded-xl bg-zinc-800/50 px-5 py-3">
                      <span className="text-2xl">🥁</span>
                      <div>
                        <span className="font-semibold">{Math.round(data.audioFeatures.tempo)} BPM</span>
                        <span className="ml-2 text-sm text-zinc-400">Average Tempo</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Top Artists */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">Top Artists</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data.topArtists.slice(0, 8).map((artist: any, i: number) => (
                  <div
                    key={artist.id}
                    className="group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    <div className="relative">
                      <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950 text-xs font-bold text-zinc-400 ring-1 ring-zinc-700">
                        {i + 1}
                      </span>
                      {artist.images?.[0] ? (
                        <Image
                          src={artist.images[0].url}
                          alt={artist.name}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-full object-cover ring-2 ring-zinc-700 group-hover:ring-[#1DB954]/50"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-zinc-700">
                          <MusicIcon className="h-6 w-6 text-zinc-500" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{artist.name}</div>
                      <div className="truncate text-sm text-zinc-500">
                        {artist.genres?.slice(0, 2).join(", ") || "Artist"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Top Tracks */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">Top Tracks</h2>
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
                {data.topTracks.slice(0, 10).map((track: any, i: number) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-4 px-5 py-3 transition-colors hover:bg-zinc-800/50 ${
                      i !== 0 ? "border-t border-zinc-800/50" : ""
                    }`}
                  >
                    <span className="w-6 text-right text-sm font-bold text-zinc-500">{i + 1}</span>
                    {track.album?.images?.[0] && (
                      <Image
                        src={track.album.images[0].url}
                        alt={track.album.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-lg object-cover shadow-md"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{track.name}</div>
                      <div className="truncate text-sm text-zinc-500">
                        {track.artists?.map((a: any) => a.name).join(", ")}
                      </div>
                    </div>
                    <span className="text-sm tabular-nums text-zinc-500">
                      {formatDuration(track.duration_ms)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Genre Breakdown */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">Genre Breakdown</h2>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex flex-wrap gap-3">
                  {data.topGenres.map(({ genre, count }, i) => {
                    const maxCount = data.topGenres[0]?.count || 1;
                    const opacity = 0.4 + (count / maxCount) * 0.6;
                    return (
                      <span
                        key={genre}
                        className="rounded-full border border-[#1DB954]/30 px-4 py-2 text-sm font-medium transition-all hover:border-[#1DB954] hover:bg-[#1DB954]/10"
                        style={{ opacity, fontSize: `${Math.max(0.75, 0.75 + (count / maxCount) * 0.5)}rem` }}
                      >
                        {genre}
                      </span>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Recently Played */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">Recently Played</h2>
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
                {data.recentlyPlayed.slice(0, 10).map((item: any, i: number) => (
                  <div
                    key={`${item.track.id}-${item.played_at}`}
                    className={`flex items-center gap-4 px-5 py-3 transition-colors hover:bg-zinc-800/50 ${
                      i !== 0 ? "border-t border-zinc-800/50" : ""
                    }`}
                  >
                    {item.track.album?.images?.[0] && (
                      <Image
                        src={item.track.album.images[0].url}
                        alt={item.track.album.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-lg object-cover shadow-md"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.track.name}</div>
                      <div className="truncate text-sm text-zinc-500">
                        {item.track.artists?.map((a: any) => a.name).join(", ")}
                      </div>
                    </div>
                    <span className="text-sm text-zinc-500">
                      {formatTimeAgo(item.played_at)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
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
function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-2 text-2xl">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  );
}

function Spinner({ size = "md" }: { size?: "md" | "lg" }) {
  const cls = size === "lg" ? "h-8 w-8" : "h-5 w-5";
  return (
    <svg className={`${cls} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}

// Utils
function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

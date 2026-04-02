"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthButton } from "@/components/auth-button";

interface Track {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  depth: number;
  era: string;
  album: { name: string; images: { url: string }[] };
  artists: { name: string }[];
}

interface ArchData {
  forgottenGems: Track[];
  stillLoved: Track[];
  forgottenArtists: any[];
  stats: {
    totalDugUp: number;
    stillLovedCount: number;
    deepestFind: Track | null;
    forgottenArtistCount: number;
  };
}

const ERA_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  "Ancient History": { bg: "from-amber-900/30 to-amber-950/10", border: "border-amber-700/30", icon: "🏛️" },
  "The Golden Era": { bg: "from-yellow-900/30 to-yellow-950/10", border: "border-yellow-700/30", icon: "✨" },
  "The Middle Ages": { bg: "from-stone-800/30 to-stone-900/10", border: "border-stone-600/30", icon: "⚔️" },
  "Recent Past": { bg: "from-blue-900/30 to-blue-950/10", border: "border-blue-700/30", icon: "📼" },
  "Just Fading": { bg: "from-purple-900/30 to-purple-950/10", border: "border-purple-700/30", icon: "💨" },
};

export default function ArchaeologyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ArchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealCount, setRevealCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (status === "unauthenticated") router.push("/"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/spotify/archaeology")
      .then((r) => { if (!r.ok) throw new Error("Dig failed"); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  // Reveal animation — show gems one by one
  useEffect(() => {
    if (!data || data.forgottenGems.length === 0) return;
    const timer = setInterval(() => {
      setRevealCount((c) => {
        if (c >= data.forgottenGems.length) { clearInterval(timer); return c; }
        return c + 1;
      });
    }, 150);
    return () => clearInterval(timer);
  }, [data]);

  if (status === "loading" || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Spinner />
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className={`min-h-screen bg-zinc-950 text-white transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/3 left-1/3 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-amber-900/15 via-yellow-900/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-stone-800/15 to-transparent blur-3xl" />
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
            <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">Home</a>
            <a href="/create" className="text-sm text-zinc-400 hover:text-white transition-colors">Create</a>
            <a href="/stats" className="text-sm text-zinc-400 hover:text-white transition-colors">Stats</a>
            <a href="/archaeology" className="text-sm text-amber-400 font-medium">Dig</a>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 text-6xl">⛏️</div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Song <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">Archaeology</span>
          </h1>
          <p className="text-lg text-zinc-400">
            Digging through your listening history to unearth forgotten favorites
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-center text-red-300">{error}</div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-32">
            <div className="mb-4 animate-bounce text-5xl">⛏️</div>
            <p className="text-zinc-400 animate-pulse">Digging deep into your history...</p>
          </div>
        ) : data ? (
          <div className="space-y-10">
            {/* Dig Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-amber-800/30 bg-gradient-to-br from-amber-900/20 to-zinc-900/50 p-5">
                <div className="mb-1 text-2xl">💎</div>
                <div className="text-3xl font-bold text-amber-400">{data.stats.totalDugUp}</div>
                <div className="text-sm text-zinc-500">Gems Unearthed</div>
              </div>
              <div className="rounded-2xl border border-green-800/30 bg-gradient-to-br from-green-900/20 to-zinc-900/50 p-5">
                <div className="mb-1 text-2xl">💚</div>
                <div className="text-3xl font-bold text-green-400">{data.stats.stillLovedCount}</div>
                <div className="text-sm text-zinc-500">Still Loved</div>
              </div>
              <div className="rounded-2xl border border-stone-700/30 bg-gradient-to-br from-stone-800/20 to-zinc-900/50 p-5">
                <div className="mb-1 text-2xl">🎤</div>
                <div className="text-3xl font-bold text-stone-300">{data.stats.forgottenArtistCount}</div>
                <div className="text-sm text-zinc-500">Forgotten Artists</div>
              </div>
              <div className="rounded-2xl border border-purple-800/30 bg-gradient-to-br from-purple-900/20 to-zinc-900/50 p-5">
                <div className="mb-1 text-2xl">🕳️</div>
                <div className="text-3xl font-bold text-purple-400">Layer {data.forgottenGems.length}</div>
                <div className="text-sm text-zinc-500">Deepest Dig</div>
              </div>
            </div>

            {/* Forgotten Gems */}
            {data.forgottenGems.length > 0 ? (
              <section>
                <h2 className="mb-2 text-2xl font-bold">⛏️ Unearthed Gems</h2>
                <p className="mb-6 text-zinc-500">Songs you used to love but haven&apos;t played in ages</p>

                {/* Group by era */}
                {["Ancient History", "The Golden Era", "The Middle Ages", "Recent Past", "Just Fading"].map((era) => {
                  const eraTracks = data.forgottenGems.filter((t) => t.era === era);
                  if (eraTracks.length === 0) return null;
                  const style = ERA_STYLES[era] || ERA_STYLES["Just Fading"];

                  return (
                    <div key={era} className="mb-6">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xl">{style.icon}</span>
                        <h3 className="text-lg font-semibold text-zinc-300">{era}</h3>
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">{eraTracks.length}</span>
                      </div>
                      <div className={`overflow-hidden rounded-2xl border ${style.border} bg-gradient-to-br ${style.bg}`}>
                        {eraTracks.map((track, i) => {
                          const isRevealed = data.forgottenGems.indexOf(track) < revealCount;
                          return (
                            <div
                              key={track.id}
                              className={`flex items-center gap-4 px-5 py-3 transition-all duration-500 ${
                                isRevealed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                              } ${i !== 0 ? "border-t border-white/5" : ""}`}
                            >
                              <span className="w-8 text-center text-xs font-mono text-zinc-600">
                                ⛏ {track.depth}
                              </span>
                              {track.album?.images?.[0] && (
                                <Image
                                  src={track.album.images[0].url}
                                  alt={track.album.name}
                                  width={44}
                                  height={44}
                                  className="h-11 w-11 rounded-lg object-cover shadow-md ring-1 ring-white/10"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">{track.name}</div>
                                <div className="truncate text-sm text-zinc-500">
                                  {track.artists.map((a) => a.name).join(", ")} · {track.album.name}
                                </div>
                              </div>
                              <span className="text-sm tabular-nums text-zinc-600">
                                {formatDuration(track.duration_ms)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 text-center">
                <div className="mb-4 text-5xl">🎉</div>
                <h3 className="text-xl font-semibold">Nothing buried!</h3>
                <p className="text-zinc-500">You still listen to all your old favorites. Respect.</p>
              </div>
            )}

            {/* Forgotten Artists */}
            {data.forgottenArtists.length > 0 && (
              <section>
                <h2 className="mb-2 text-2xl font-bold">👻 Forgotten Artists</h2>
                <p className="mb-4 text-zinc-500">Artists you used to be obsessed with</p>
                <div className="flex flex-wrap gap-4">
                  {data.forgottenArtists.map((artist: any) => (
                    <div key={artist.id} className="flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/80 py-2 pl-2 pr-5 transition-all hover:border-zinc-700">
                      {artist.images?.[0] ? (
                        <Image src={artist.images[0].url} alt={artist.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover ring-2 ring-zinc-700" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-zinc-700">👤</div>
                      )}
                      <span className="font-medium">{artist.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Still Loved */}
            {data.stillLoved.length > 0 && (
              <section>
                <h2 className="mb-2 text-2xl font-bold">💚 Timeless Favorites</h2>
                <p className="mb-4 text-zinc-500">Songs that have stood the test of time</p>
                <div className="overflow-hidden rounded-2xl border border-green-800/20 bg-gradient-to-br from-green-900/10 to-zinc-900/50">
                  {data.stillLoved.map((track: any, i: number) => (
                    <div key={track.id} className={`flex items-center gap-4 px-5 py-3 hover:bg-white/5 ${i !== 0 ? "border-t border-white/5" : ""}`}>
                      {track.album?.images?.[0] && (
                        <Image src={track.album.images[0].url} alt={track.album.name} width={44} height={44} className="h-11 w-11 rounded-lg object-cover shadow-md" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{track.name}</div>
                        <div className="truncate text-sm text-zinc-500">{track.artists.map((a: any) => a.name).join(", ")}</div>
                      </div>
                      <span className="text-lg">💚</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </main>

      <footer className="mt-auto border-t border-zinc-800/50 py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-zinc-600">
          Made with <span className="text-amber-500">⛏️</span> using the Spotify API
        </div>
      </footer>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
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

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

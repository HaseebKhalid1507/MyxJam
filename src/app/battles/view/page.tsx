"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AuthButton } from "@/components/auth-button";

interface PlaylistData {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  owner: { display_name: string; id: string };
  tracks: {
    total: number;
    items: { track: any }[];
  };
}

function BattleContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();

  const theme = params.get("theme") || "Untitled Battle";
  const playlistIds = (params.get("p") || "").split(",").filter(Boolean);

  const [playlists, setPlaylists] = useState<(PlaylistData | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // Load votes from localStorage
  useEffect(() => {
    const storageKey = `battle_${playlistIds.sort().join(",")}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setVotedId(data.votedId);
        setVotes(data.votes);
      } catch {}
    }
  }, []);

  // Fetch all playlists
  useEffect(() => {
    if (status !== "authenticated" || playlistIds.length === 0) return;

    setLoading(true);
    Promise.all(
      playlistIds.map(async (id) => {
        try {
          const res = await fetch(`/api/spotify/playlists/${id}`);
          if (!res.ok) return null;
          const data = await res.json();
          return data.playlist as PlaylistData;
        } catch {
          return null;
        }
      })
    )
      .then((results) => {
        setPlaylists(results);
        // Initialize vote counts
        const initial: Record<string, number> = {};
        results.forEach((p) => {
          if (p) initial[p.id] = votes[p.id] || 0;
        });
        setVotes((prev) => ({ ...initial, ...prev }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  const castVote = (playlistId: string) => {
    if (votedId) return; // Already voted

    const newVotes = { ...votes, [playlistId]: (votes[playlistId] || 0) + 1 };
    setVotes(newVotes);
    setVotedId(playlistId);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);

    // Save to localStorage
    const storageKey = `battle_${playlistIds.sort().join(",")}`;
    localStorage.setItem(storageKey, JSON.stringify({ votedId: playlistId, votes: newVotes }));
  };

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const validPlaylists = playlists.filter((p): p is PlaylistData => p !== null);
  const winner = votedId && validPlaylists.length > 0
    ? validPlaylists.reduce((best, p) => (votes[p.id] || 0) > (votes[best.id] || 0) ? p : best)
    : null;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-950"><Spinner /></div>;
  }
  if (!session) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/3 left-1/4 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-red-900/15 via-orange-900/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 right-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-yellow-900/10 to-transparent blur-3xl" />
      </div>

      {/* Confetti */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="text-8xl animate-bounce">🔥</div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1DB954] to-emerald-600 shadow-lg shadow-[#1DB954]/25">
              <MusicIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">MyxJam</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/battles" className="text-sm text-orange-400 font-medium">Battles</a>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Battle Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-800/30 bg-orange-900/20 px-4 py-2 text-sm text-orange-300">
            ⚔️ Playlist Battle
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
            &ldquo;<span className="bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent">{theme}</span>&rdquo;
          </h1>
          <p className="text-zinc-400">
            {validPlaylists.length} contestants • {totalVotes} vote{totalVotes !== 1 ? "s" : ""} cast
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-center text-red-300">{error}</div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-32">
            <Spinner />
            <p className="mt-4 text-zinc-400">Loading battle playlists...</p>
          </div>
        ) : validPlaylists.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 text-center">
            <div className="mb-4 text-5xl">😬</div>
            <h3 className="text-xl font-semibold">No valid playlists found</h3>
            <p className="text-zinc-500">Make sure the playlist URLs are correct and public.</p>
          </div>
        ) : (
          <>
            {/* Playlist Cards */}
            <div className={`grid gap-6 ${validPlaylists.length === 2 ? "sm:grid-cols-2" : validPlaylists.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
              {validPlaylists.map((playlist) => {
                const voteCount = votes[playlist.id] || 0;
                const votePercent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                const isWinner = votedId && winner?.id === playlist.id;
                const isVoted = votedId === playlist.id;
                const tracks = playlist.tracks?.items?.slice(0, 8) || [];

                return (
                  <div
                    key={playlist.id}
                    className={`relative overflow-hidden rounded-2xl border transition-all ${
                      isWinner
                        ? "border-orange-500/50 bg-gradient-to-br from-orange-900/20 to-zinc-900/80 shadow-lg shadow-orange-500/10"
                        : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                    }`}
                  >
                    {/* Winner badge */}
                    {isWinner && (
                      <div className="absolute right-3 top-3 z-10 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold shadow-lg">
                        👑 Leading
                      </div>
                    )}

                    {/* Playlist Cover */}
                    <div className="relative aspect-square overflow-hidden">
                      {playlist.images?.[0] ? (
                        <Image
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-zinc-800">
                          <MusicIcon className="h-16 w-16 text-zinc-600" />
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <h3 className="mb-1 text-lg font-bold truncate">{playlist.name}</h3>
                      <p className="mb-3 text-sm text-zinc-500">
                        by {playlist.owner?.display_name} • {playlist.tracks?.total || 0} tracks
                      </p>

                      {/* Track preview */}
                      <div className="mb-4 space-y-1.5">
                        {tracks.map((item, i) => (
                          item.track && (
                            <div key={`${item.track.id}-${i}`} className="flex items-center gap-2 text-sm">
                              <span className="w-4 text-right text-xs text-zinc-600">{i + 1}</span>
                              <span className="truncate text-zinc-300">{item.track.name}</span>
                              <span className="ml-auto text-xs text-zinc-600 whitespace-nowrap">
                                {item.track.artists?.[0]?.name}
                              </span>
                            </div>
                          )
                        ))}
                        {(playlist.tracks?.total || 0) > 8 && (
                          <p className="text-xs text-zinc-600 pl-6">+{(playlist.tracks?.total || 0) - 8} more</p>
                        )}
                      </div>

                      {/* Vote section */}
                      {votedId ? (
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className={isVoted ? "font-semibold text-orange-400" : "text-zinc-400"}>
                              {isVoted ? "Your vote ✓" : `${voteCount} votes`}
                            </span>
                            <span className="font-bold text-zinc-300">{votePercent}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isWinner ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-zinc-600"
                              }`}
                              style={{ width: `${votePercent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => castVote(playlist.id)}
                          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-3 font-semibold shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          🔥 Vote for this
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Share Section */}
            <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
              <h3 className="mb-2 text-lg font-semibold">Share this battle</h3>
              <p className="mb-4 text-sm text-zinc-500">Send the link to friends so they can vote!</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-300 outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                  }}
                  className="rounded-xl bg-zinc-800 px-5 py-3 font-medium transition-all hover:bg-zinc-700"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-zinc-800/50 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-600">
          Made with <span className="text-orange-500">⚔️</span> using the Spotify API
        </div>
      </footer>
    </div>
  );
}

export default function BattleViewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-950"><Spinner /></div>}>
      <BattleContent />
    </Suspense>
  );
}

function Spinner() {
  return <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>;
}

function MusicIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
}

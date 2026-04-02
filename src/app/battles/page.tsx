"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthButton } from "@/components/auth-button";

const THEME_SUGGESTIONS = [
  "Songs for a 3am drive",
  "Your villain era",
  "Main character energy",
  "Songs that hit different at night",
  "Crying in the shower",
  "Getting ready to go out",
  "Songs from your high school years",
  "Gym beast mode",
  "Rainy day melancholy",
  "Summer road trip",
];

function extractPlaylistId(input: string): string | null {
  // Handle full URLs: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
  const urlMatch = input.match(/playlist\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  // Handle bare IDs
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) return input.trim();
  return null;
}

export default function BattlesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [theme, setTheme] = useState("");
  const [playlistInputs, setPlaylistInputs] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (status === "unauthenticated") router.push("/"); }, [status, router]);

  const addSlot = () => {
    if (playlistInputs.length < 8) setPlaylistInputs([...playlistInputs, ""]);
  };

  const removeSlot = (idx: number) => {
    if (playlistInputs.length > 2) setPlaylistInputs(playlistInputs.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx: number, value: string) => {
    const updated = [...playlistInputs];
    updated[idx] = value;
    setPlaylistInputs(updated);
  };

  const startBattle = () => {
    if (!theme.trim()) { setError("Pick a theme!"); return; }

    const ids = playlistInputs
      .map(extractPlaylistId)
      .filter((id): id is string => id !== null);

    if (ids.length < 2) { setError("Need at least 2 valid playlist URLs"); return; }

    const params = new URLSearchParams({
      theme: theme.trim(),
      p: ids.join(","),
    });
    router.push(`/battles/view?${params.toString()}`);
  };

  if (status === "loading" || !mounted) {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-950"><Spinner /></div>;
  }
  if (!session) return null;

  return (
    <div className={`min-h-screen bg-zinc-950 text-white transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/3 right-1/4 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-red-900/15 via-orange-900/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-yellow-900/10 to-transparent blur-3xl" />
      </div>

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
            <a href="/stats" className="text-sm text-zinc-400 hover:text-white transition-colors">Stats</a>
            <a href="/archaeology" className="text-sm text-zinc-400 hover:text-white transition-colors">Dig</a>
            <a href="/battles" className="text-sm text-orange-400 font-medium">Battles</a>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-10 text-center">
          <div className="mb-4 text-6xl">⚔️</div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Playlist <span className="bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent">Battles</span>
          </h1>
          <p className="text-lg text-zinc-400">Whose playlist hits harder? There&apos;s only one way to find out.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-center text-red-300">{error}</div>
        )}

        {/* Theme */}
        <section className="mb-8">
          <label className="mb-3 block text-sm font-medium text-zinc-400">🎯 Battle Theme</label>
          <input
            type="text"
            value={theme}
            onChange={(e) => { setTheme(e.target.value); setError(null); }}
            placeholder="What's the vibe?"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-lg text-white placeholder-zinc-500 outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {THEME_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setTheme(s)}
                className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-400 transition-all hover:border-orange-500/30 hover:text-orange-300"
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Playlist URLs */}
        <section className="mb-8">
          <label className="mb-3 block text-sm font-medium text-zinc-400">🎵 Contestant Playlists</label>
          <p className="mb-4 text-sm text-zinc-500">Paste Spotify playlist URLs or IDs. Each person makes a playlist for the theme, then drop the links here.</p>
          <div className="space-y-3">
            {playlistInputs.map((val, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-400">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => updateSlot(idx, e.target.value)}
                  placeholder="https://open.spotify.com/playlist/... or playlist ID"
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                />
                {playlistInputs.length > 2 && (
                  <button onClick={() => removeSlot(idx)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {playlistInputs.length < 8 && (
            <button onClick={addSlot} className="mt-3 text-sm text-zinc-500 hover:text-orange-400 transition-colors">
              + Add another contestant
            </button>
          )}
        </section>

        {/* Start Battle */}
        <button
          onClick={startBattle}
          className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-5 text-lg font-bold shadow-xl shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.01]"
        >
          ⚔️ Start Battle
        </button>

        <p className="mt-4 text-center text-sm text-zinc-600">
          The battle link is shareable — send it to friends to vote!
        </p>
      </main>
    </div>
  );
}

function Spinner() {
  return <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>;
}
function MusicIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthButton } from "@/components/auth-button";

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
  followers: { total: number };
}

interface Track {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  album: {
    name: string;
    images: { url: string }[];
  };
  artists: { name: string }[];
}

interface SelectedArtist extends Artist {
  tracks?: Track[];
}

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState<SelectedArtist[]>([]);
  const [tracksPerArtist, setTracksPerArtist] = useState(5);
  const [playlistName, setPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdPlaylist, setCreatedPlaylist] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Animation mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Search artists
  const searchArtists = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setSearchResults(data.artists);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchArtists(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchArtists]);

  // Add artist
  const addArtist = async (artist: Artist) => {
    if (selectedArtists.find(a => a.id === artist.id)) return;
    
    setError(null);
    
    try {
      // Fetch top tracks for this artist
      const response = await fetch(`/api/spotify/artists/${artist.id}/top-tracks`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setSelectedArtists(prev => [...prev, { ...artist, tracks: data.tracks }]);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add artist");
    }
  };

  // Remove artist
  const removeArtist = (artistId: string) => {
    setSelectedArtists(prev => prev.filter(a => a.id !== artistId));
  };

  // Get all selected tracks
  const getSelectedTracks = () => {
    return selectedArtists.flatMap(artist => 
      (artist.tracks || []).slice(0, tracksPerArtist)
    );
  };

  // Create playlist
  const createPlaylist = async () => {
    const tracks = getSelectedTracks();
    if (tracks.length === 0) {
      setError("No tracks selected");
      return;
    }

    const name = playlistName.trim() || `MyxJam - ${new Date().toLocaleDateString()}`;
    
    setIsCreating(true);
    setError(null);
    
    try {
      const response = await fetch("/api/spotify/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: `Created with MyxJam • ${selectedArtists.map(a => a.name).join(", ")}`,
          trackUris: tracks.map(t => t.uri),
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setCreatedPlaylist({ url: data.playlist.url, name: data.playlist.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  // Reset
  const reset = () => {
    setSelectedArtists([]);
    setCreatedPlaylist(null);
    setPlaylistName("");
    setError(null);
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#1DB954]/30" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954]">
              <MusicIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-zinc-400">Loading your studio...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const selectedTracks = getSelectedTracks();
  const totalDuration = selectedTracks.reduce((acc, t) => acc + t.duration_ms, 0);

  return (
    <div className={`min-h-screen bg-zinc-950 text-white transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#1DB954]/20 via-emerald-900/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="group flex items-center gap-3 transition-transform hover:scale-[1.02]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1DB954] to-emerald-600 shadow-lg shadow-[#1DB954]/25">
              <MusicIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">MyxJam</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/create" className="text-sm text-[#1DB954] font-medium">Create</a>
            <a href="/stats" className="text-sm text-zinc-400 hover:text-white transition-colors">Stats</a>
            <a href="/archaeology" className="text-sm text-zinc-400 hover:text-white transition-colors">Dig</a>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {createdPlaylist ? (
          // Success State
          <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative mb-8">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#1DB954]/30" style={{ animationDuration: '2s' }} />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#1DB954] to-emerald-600 shadow-2xl shadow-[#1DB954]/40">
                <CheckIcon className="h-12 w-12" />
              </div>
            </div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight">Playlist Created!</h1>
            <p className="mb-2 text-lg text-zinc-400">
              &quot;{createdPlaylist.name}&quot;
            </p>
            <p className="mb-10 text-zinc-500">
              {selectedTracks.length} tracks • {formatDurationLong(totalDuration)}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <a
                href={createdPlaylist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 rounded-full bg-[#1DB954] px-8 py-4 font-semibold shadow-lg shadow-[#1DB954]/25 transition-all hover:bg-[#1ed760] hover:shadow-[#1DB954]/40 hover:scale-[1.02]"
              >
                <SpotifyIcon className="h-5 w-5" />
                Open in Spotify
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/50 px-8 py-4 font-semibold transition-all hover:bg-zinc-800 hover:border-zinc-600"
              >
                <PlusIcon className="h-5 w-5" />
                Create Another
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="mb-10">
              <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">
                Create Your Mix
              </h1>
              <p className="text-lg text-zinc-400">
                Select artists and we&apos;ll build a playlist from their top tracks
              </p>
            </div>

            {error && (
              <div className="mb-8 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
                <AlertIcon className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Search Section */}
            <section className="mb-10">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                <SearchIcon className="h-4 w-4" />
                <span>Search Artists</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type an artist name..."
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 pl-12 text-lg text-white placeholder-zinc-500 outline-none transition-all focus:border-[#1DB954]/50 focus:bg-zinc-900 focus:ring-2 focus:ring-[#1DB954]/20"
                />
                <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Spinner />
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
                  {searchResults.map((artist, index) => (
                    <button
                      key={artist.id}
                      onClick={() => addArtist(artist)}
                      disabled={selectedArtists.some(a => a.id === artist.id)}
                      className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-all hover:bg-zinc-800/80 disabled:opacity-50 ${
                        index !== 0 ? 'border-t border-zinc-800/50' : ''
                      }`}
                    >
                      {artist.images[0] ? (
                        <Image
                          src={artist.images[0].url}
                          alt={artist.name}
                          width={52}
                          height={52}
                          className="h-13 w-13 rounded-full object-cover ring-2 ring-zinc-700"
                        />
                      ) : (
                        <div className="flex h-13 w-13 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-zinc-700">
                          <MusicIcon className="h-6 w-6 text-zinc-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold">{artist.name}</div>
                        <div className="text-sm text-zinc-500">
                          {formatNumber(artist.followers.total)} followers
                        </div>
                      </div>
                      {selectedArtists.some(a => a.id === artist.id) ? (
                        <span className="flex items-center gap-1 text-sm font-medium text-[#1DB954]">
                          <CheckIcon className="h-4 w-4" />
                          Added
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-400 transition-colors group-hover:bg-[#1DB954] group-hover:text-white">
                          Add
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Selected Artists */}
            {selectedArtists.length > 0 && (
              <section className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                    <UsersIcon className="h-4 w-4" />
                    <span>Selected Artists</span>
                    <span className="ml-1 rounded-full bg-[#1DB954] px-2 py-0.5 text-xs font-bold text-white">
                      {selectedArtists.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedArtists([])}
                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 py-1.5 pl-1.5 pr-4 transition-all hover:border-zinc-700 hover:bg-zinc-800"
                    >
                      {artist.images[0] ? (
                        <Image
                          src={artist.images[0].url}
                          alt={artist.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                          <MusicIcon className="h-4 w-4 text-zinc-500" />
                        </div>
                      )}
                      <span className="font-medium">{artist.name}</span>
                      <button
                        onClick={() => removeArtist(artist.id)}
                        className="ml-1 rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-white"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Settings */}
            {selectedArtists.length > 0 && (
              <section className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-400">
                  <SlidersIcon className="h-4 w-4" />
                  <span>Settings</span>
                </div>
                <div className="grid gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-zinc-300">
                      Songs per artist
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTracksPerArtist(Math.max(1, tracksPerArtist - 1))}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-xl font-bold text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-700 hover:text-white active:scale-95"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={tracksPerArtist}
                        onChange={(e) => setTracksPerArtist(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                        className="w-20 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-center text-lg font-semibold text-white outline-none transition-all focus:border-[#1DB954]/50 focus:ring-2 focus:ring-[#1DB954]/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setTracksPerArtist(Math.min(10, tracksPerArtist + 1))}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-xl font-bold text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-700 hover:text-white active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-medium text-zinc-300">
                      Playlist name
                    </label>
                    <input
                      type="text"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      placeholder={`MyxJam - ${new Date().toLocaleDateString()}`}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none transition-all focus:border-[#1DB954]/50 focus:ring-2 focus:ring-[#1DB954]/20"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Preview */}
            {selectedTracks.length > 0 && (
              <section className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                    <ListIcon className="h-4 w-4" />
                    <span>Track Preview</span>
                  </div>
                  <span className="text-sm text-zinc-500">
                    {selectedTracks.length} tracks • {formatDurationLong(totalDuration)}
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/50">
                  {selectedTracks.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className={`flex items-center gap-4 px-5 py-3 transition-colors hover:bg-zinc-800/50 ${
                        index !== 0 ? 'border-t border-zinc-800/50' : ''
                      }`}
                    >
                      <span className="w-6 text-right text-sm font-medium text-zinc-600">
                        {index + 1}
                      </span>
                      {track.album.images[0] && (
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
                          {track.artists.map(a => a.name).join(", ")}
                        </div>
                      </div>
                      <span className="text-sm tabular-nums text-zinc-500">
                        {formatDuration(track.duration_ms)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Create Button */}
            {selectedArtists.length > 0 && (
              <button
                onClick={createPlaylist}
                disabled={isCreating || selectedTracks.length === 0}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#1DB954] to-emerald-500 py-5 text-lg font-bold shadow-xl shadow-[#1DB954]/25 transition-all hover:shadow-[#1DB954]/40 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
              >
                {isCreating ? (
                  <>
                    <Spinner />
                    <span>Creating your playlist...</span>
                  </>
                ) : (
                  <>
                    <SpotifyIcon className="h-6 w-6" />
                    <span>Create Playlist</span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm">
                      {selectedTracks.length} tracks
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Empty State */}
            {selectedArtists.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-zinc-800">
                  <MusicIcon className="h-10 w-10 text-zinc-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-zinc-400">No artists selected</h3>
                <p className="text-zinc-500">Search for artists above to start building your playlist</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/50 py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-zinc-600">
          Made with <span className="text-[#1DB954]">♥</span> using the Spotify API
        </div>
      </footer>
    </div>
  );
}

// Utility functions
function formatDuration(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDurationLong(ms: number) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}

function formatNumber(num: number) {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// Icons
function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

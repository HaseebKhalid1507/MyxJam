"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthButton } from "@/components/auth-button";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect authenticated users to create page
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/create");
    }
  }, [status, router]);

  return (
    <div className={`flex min-h-screen flex-col bg-zinc-950 text-white transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#1DB954]/25 via-emerald-900/15 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-purple-900/20 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1DB954] to-emerald-600 shadow-lg shadow-[#1DB954]/25">
              <MusicIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">MyxJam</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/create" className="text-sm text-zinc-400 hover:text-white transition-colors">Create</a>
            <a href="/stats" className="text-sm text-zinc-400 hover:text-white transition-colors">Stats</a>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="flex flex-col items-center max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm backdrop-blur-sm">
            <span className="text-zinc-400">A Piexxes Creation</span>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl">
            Create playlists from your{" "}
            <span className="bg-gradient-to-r from-[#1DB954] via-emerald-400 to-[#1DB954] bg-clip-text text-transparent">
              favorite artists
            </span>
          </h1>

          {/* Subheading */}
          <p className="mb-10 max-w-xl text-lg text-zinc-400 sm:text-xl">
            Select your favorite artists, pick how many songs you want from each,
            and we&apos;ll create a personalized playlist in seconds.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <AuthButton />
            <p className="text-sm text-zinc-500">Free • No credit card required</p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid max-w-5xl gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<SearchIcon />}
            title="Search Artists"
            description="Find any artist on Spotify and add them to your mix"
            step="1"
          />
          <FeatureCard
            icon={<SlidersIcon />}
            title="Customize"
            description="Choose how many songs per artist to include"
            step="2"
          />
          <FeatureCard
            icon={<PlaylistIcon />}
            title="Save Playlist"
            description="One click to save directly to your Spotify account"
            step="3"
          />
        </div>

        {/* Stats */}
        <div className="mt-32 flex flex-wrap justify-center gap-12 text-center">
          <div>
            <div className="text-4xl font-bold text-white">∞</div>
            <div className="mt-1 text-sm text-zinc-500">Artists Available</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#1DB954]">10</div>
            <div className="mt-1 text-sm text-zinc-500">Tracks per Artist</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-white">1-Click</div>
            <div className="mt-1 text-sm text-zinc-500">Playlist Creation</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-600">
          Made with <span className="text-[#1DB954]">♥</span> using the Spotify API
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  step,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  step: string;
}) {
  return (
    <div className="group relative flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center transition-all hover:border-zinc-700 hover:bg-zinc-900">
      {/* Step indicator */}
      <div className="absolute -top-3 left-6 rounded-full bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-800">
        Step {step}
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1DB954]/20 to-emerald-900/20 text-[#1DB954] ring-1 ring-[#1DB954]/20">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
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

function SearchIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}

function PlaylistIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5l-10.5 3v10.553m0-6.553v6.553m0 0v.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 14.553z" />
    </svg>
  );
}

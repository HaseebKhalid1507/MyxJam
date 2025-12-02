import { AuthButton } from "@/components/auth-button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-12">
        <div className="flex items-center gap-2">
          <MusicIcon className="h-8 w-8 text-[#1DB954]" />
          <span className="text-xl font-bold">MyxJam</span>
        </div>
        <AuthButton />
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex flex-col items-center max-w-2xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Create playlists from your{" "}
            <span className="text-[#1DB954]">favorite artists</span>
          </h1>
          <p className="text-lg text-zinc-400 sm:text-xl">
            Select your favorite artists, pick how many songs you want from each,
            and we&apos;ll create a personalized Spotify playlist just for you.
          </p>
          <div className="pt-4 flex justify-center">
            <AuthButton />
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid max-w-4xl gap-8 sm:grid-cols-3 mx-auto">
          <FeatureCard
            icon={<SearchIcon />}
            title="Search Artists"
            description="Find any artist on Spotify and add them to your mix"
          />
          <FeatureCard
            icon={<SlidersIcon />}
            title="Customize"
            description="Choose how many artists and songs per artist"
          />
          <FeatureCard
            icon={<PlaylistIcon />}
            title="Save Playlist"
            description="One click to save directly to your Spotify account"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-zinc-500">
        <p>Built with Next.js and the Spotify API</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-zinc-800/50 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954]/20 text-[#1DB954]">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
      />
    </svg>
  );
}

function PlaylistIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5l-10.5 3v10.553m0-6.553v6.553m0 0v.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 14.553z"
      />
    </svg>
  );
}

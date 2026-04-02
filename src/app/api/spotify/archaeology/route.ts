import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSpotifyClient } from "@/lib/spotify";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const spotify = createSpotifyClient(session.accessToken);

  try {
    // Get all-time favorites and recent tracks in parallel
    const [allTimeTracks, recentTracks, shortTermTracks, mediumTracks] = await Promise.all([
      spotify.getTopTracks("long_term", 50),
      spotify.getRecentlyPlayed(50),
      spotify.getTopTracks("short_term", 50),
      spotify.getTopTracks("medium_term", 50),
    ]);

    // Build set of recently active track IDs
    const recentIds = new Set([
      ...recentTracks.map((r) => r.track.id),
      ...shortTermTracks.map((t) => t.id),
      ...mediumTracks.map((t) => t.id),
    ]);

    // Forgotten gems = all-time favorites NOT in recent listening
    const forgottenGems = allTimeTracks
      .filter((track) => !recentIds.has(track.id))
      .map((track, index) => ({
        ...track,
        depth: index + 1, // How deep we had to dig
        era: guessEra(track, allTimeTracks.length, index),
      }));

    // Still loved = in both all-time AND recent
    const stillLoved = allTimeTracks
      .filter((track) => recentIds.has(track.id))
      .slice(0, 10);

    // Get all-time artists for context
    const allTimeArtists = await spotify.getTopArtists("long_term", 20);
    const recentArtists = await spotify.getTopArtists("short_term", 20);
    
    const recentArtistIds = new Set(recentArtists.map((a) => a.id));
    const forgottenArtists = allTimeArtists
      .filter((a) => !recentArtistIds.has(a.id))
      .slice(0, 5);

    return NextResponse.json({
      forgottenGems,
      stillLoved,
      forgottenArtists,
      stats: {
        totalDugUp: forgottenGems.length,
        stillLovedCount: stillLoved.length,
        deepestFind: forgottenGems.length > 0 ? forgottenGems[forgottenGems.length - 1] : null,
        forgottenArtistCount: forgottenArtists.length,
      },
    });
  } catch (err) {
    console.error("Archaeology error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to dig" },
      { status: 500 }
    );
  }
}

function guessEra(track: any, totalTracks: number, position: number): string {
  // Rough era estimation based on position in all-time list
  // Higher position = more played overall but not recently = older love
  const ratio = position / totalTracks;
  if (ratio < 0.2) return "Ancient History";
  if (ratio < 0.4) return "The Golden Era";
  if (ratio < 0.6) return "The Middle Ages";
  if (ratio < 0.8) return "Recent Past";
  return "Just Fading";
}

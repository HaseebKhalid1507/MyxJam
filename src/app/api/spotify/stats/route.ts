import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSpotifyClient } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const timeRange = (request.nextUrl.searchParams.get("time_range") || "medium_term") as
    "short_term" | "medium_term" | "long_term";

  const spotify = createSpotifyClient(session.accessToken);

  try {
    const [topArtists, topTracks, recentlyPlayed] = await Promise.all([
      spotify.getTopArtists(timeRange, 20),
      spotify.getTopTracks(timeRange, 50),
      spotify.getRecentlyPlayed(50),
    ]);

    // Audio features endpoint is deprecated (Nov 2024). Skip it.
    const audioFeatures: any[] = [];

    // Calculate genre breakdown
    const genreCounts: Record<string, number> = {};
    topArtists.forEach((artist) => {
      artist.genres.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([genre, count]) => ({ genre, count }));

    // Music personality derived from genres + artist popularity
    const allGenres = topArtists.flatMap((a) => a.genres || []);
    const genreStr = allGenres.join(" ").toLowerCase();
    const avgPopularity = topArtists.length > 0
      ? topArtists.reduce((sum: number, a: any) => sum + (a.popularity || 50), 0) / topArtists.length
      : 50;

    const musicPersonality = {
      mainstream: Math.min(1, avgPopularity / 100),
      underground: Math.max(0, 1 - avgPopularity / 100),
      hip_hop: score(genreStr, ["rap", "hip hop", "trap", "drill", "r&b"]),
      rock: score(genreStr, ["rock", "metal", "punk", "grunge", "alternative"]),
      electronic: score(genreStr, ["edm", "electronic", "house", "techno", "dubstep", "dnb"]),
      pop: score(genreStr, ["pop", "dance pop", "synth", "k-pop"]),
      indie: score(genreStr, ["indie", "lo-fi", "bedroom", "shoegaze", "dream pop"]),
      soul: score(genreStr, ["soul", "jazz", "blues", "funk", "neo soul", "gospel"]),
      country_folk: score(genreStr, ["country", "folk", "bluegrass", "americana"]),
      latin: score(genreStr, ["latin", "reggaeton", "salsa", "bachata", "corrido"]),
    };

    // Listening hours from recently played
    const totalDurationMs = recentlyPlayed.reduce(
      (acc, item) => acc + item.track.duration_ms,
      0
    );

    return NextResponse.json({
      topArtists,
      topTracks: topTracks.slice(0, 20),
      topGenres,
      audioFeatures: null, // deprecated endpoint
      musicPersonality,
      recentlyPlayed: recentlyPlayed.slice(0, 20),
      stats: {
        totalRecentMinutes: Math.round(totalDurationMs / 60000),
        uniqueArtists: new Set(recentlyPlayed.map((i) => i.track.artists[0]?.name)).size,
        uniqueTracks: new Set(recentlyPlayed.map((i) => i.track.id)).size,
      },
    });
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch stats", detail: String(err) },
      { status: 500 }
    );
  }
}

function avg(nums: number[]): number {
  return nums.length > 0
    ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
    : 0;
}

function score(genreStr: string, keywords: string[]): number {
  const matches = keywords.filter((kw) => genreStr.includes(kw)).length;
  return Math.min(1, Math.round((matches / Math.max(keywords.length * 0.4, 1)) * 100) / 100);
}

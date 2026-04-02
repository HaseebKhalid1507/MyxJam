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

    // Get audio features for top tracks (non-fatal — 403 if app not approved)
    let audioFeatures: Awaited<ReturnType<typeof spotify.getAudioFeatures>> = [];
    try {
      const trackIds = topTracks.map((t) => t.id);
      audioFeatures = await spotify.getAudioFeatures(trackIds);
    } catch (e) {
      console.warn("Audio features unavailable:", e instanceof Error ? e.message : e);
    }

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

    // Calculate average audio features
    const avgFeatures = audioFeatures.length > 0
      ? {
          danceability: avg(audioFeatures.map((f) => f.danceability)),
          energy: avg(audioFeatures.map((f) => f.energy)),
          valence: avg(audioFeatures.map((f) => f.valence)),
          acousticness: avg(audioFeatures.map((f) => f.acousticness)),
          instrumentalness: avg(audioFeatures.map((f) => f.instrumentalness)),
          tempo: avg(audioFeatures.map((f) => f.tempo)),
          speechiness: avg(audioFeatures.map((f) => f.speechiness)),
          liveness: avg(audioFeatures.map((f) => f.liveness)),
        }
      : null;

    // Listening hours from recently played
    const totalDurationMs = recentlyPlayed.reduce(
      (acc, item) => acc + item.track.duration_ms,
      0
    );

    return NextResponse.json({
      topArtists,
      topTracks: topTracks.slice(0, 20),
      topGenres,
      audioFeatures: avgFeatures,
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

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
    const [data, queueData] = await Promise.all([
      spotify.getNowPlaying(),
      spotify.getQueue(),
    ]);

    if (!data || !data.item) {
      return NextResponse.json({ playing: false });
    }

    const nextUp = queueData?.queue?.slice(0, 10).map((t: any) => ({
      name: t.name,
      artists: t.artists?.map((a: any) => a.name) || [],
      album: t.album?.name,
      image: t.album?.images?.[0]?.url,
      duration_ms: t.duration_ms,
    })) || [];

    return NextResponse.json({
      playing: data.is_playing,
      track: {
        name: data.item.name,
        artists: data.item.artists?.map((a: any) => a.name) || [],
        album: data.item.album?.name,
        image: data.item.album?.images?.[0]?.url,
        duration_ms: data.item.duration_ms,
        progress_ms: data.progress_ms,
        url: data.item.external_urls?.spotify,
      },
      nextUp,
    });
  } catch {
    return NextResponse.json({ playing: false });
  }
}

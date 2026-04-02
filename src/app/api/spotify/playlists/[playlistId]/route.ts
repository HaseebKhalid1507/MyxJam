import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSpotifyClient } from "@/lib/spotify";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { playlistId } = await params;
  const spotify = createSpotifyClient(session.accessToken);

  try {
    const playlist = await spotify.getPlaylist(playlistId);
    return NextResponse.json({ playlist });
  } catch (err) {
    console.error("Playlist fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch playlist" },
      { status: 500 }
    );
  }
}

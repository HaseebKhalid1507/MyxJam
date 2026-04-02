import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSpotifyClient } from "@/lib/spotify";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { albumId } = await params;
  const spotify = createSpotifyClient(session.accessToken);

  try {
    const tracks = await spotify.getAlbumTracks(albumId);
    return NextResponse.json({ tracks });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch album tracks" },
      { status: 500 }
    );
  }
}

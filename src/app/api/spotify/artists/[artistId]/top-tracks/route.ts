import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSpotifyClient } from "@/lib/spotify";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const session = await auth();
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { artistId } = await params;

  try {
    const spotify = createSpotifyClient(session.accessToken);
    const tracks = await spotify.getArtistTopTracks(artistId);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Get top tracks error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get top tracks" },
      { status: 500 }
    );
  }
}

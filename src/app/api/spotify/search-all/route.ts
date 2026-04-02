import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSpotifyClient } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type") || "artist";

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const spotify = createSpotifyClient(session.accessToken);

  try {
    if (type === "album") {
      const albums = await spotify.searchAlbums(query);
      return NextResponse.json({ albums });
    } else if (type === "playlist") {
      const playlists = await spotify.searchPlaylists(query);
      return NextResponse.json({ playlists });
    } else {
      const artists = await spotify.searchArtists(query);
      return NextResponse.json({ artists });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}

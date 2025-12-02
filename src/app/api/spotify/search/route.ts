import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSpotifyClient } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // Sanitize search query
  const sanitizedQuery = query.slice(0, 100).trim();
  
  if (!sanitizedQuery) {
    return NextResponse.json({ error: "Query cannot be empty" }, { status: 400 });
  }

  try {
    const spotify = createSpotifyClient(session.accessToken);
    const artists = await spotify.searchArtists(sanitizedQuery);
    return NextResponse.json({ artists });
  } catch (error) {
    console.error("Search artists error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search artists" },
      { status: 500 }
    );
  }
}

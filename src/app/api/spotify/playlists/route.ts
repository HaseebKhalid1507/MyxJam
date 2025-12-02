import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSpotifyClient } from "@/lib/spotify";

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, trackUris } = body;

    if (!name || !trackUris || !Array.isArray(trackUris) || trackUris.length === 0) {
      return NextResponse.json(
        { error: "Name and trackUris are required" },
        { status: 400 }
      );
    }

    // Input validation & sanitization
    const sanitizedName = String(name).slice(0, 100).trim();
    const sanitizedDescription = description ? String(description).slice(0, 300).trim() : "";
    
    // Validate track URIs format (spotify:track:xxxxx)
    const validTrackUris = trackUris.filter(
      (uri): uri is string => 
        typeof uri === "string" && 
        /^spotify:track:[a-zA-Z0-9]{22}$/.test(uri)
    );

    if (validTrackUris.length === 0) {
      return NextResponse.json(
        { error: "No valid track URIs provided" },
        { status: 400 }
      );
    }

    // Limit tracks to prevent abuse (max 100)
    const limitedTrackUris = validTrackUris.slice(0, 100);

    const spotify = createSpotifyClient(session.accessToken);
    
    // Get current user
    const user = await spotify.getCurrentUser();
    
    // Create playlist
    const playlist = await spotify.createPlaylist(
      user.id,
      sanitizedName,
      sanitizedDescription || `Created with MyxJam`,
      false // private by default
    );

    // Add tracks
    await spotify.addTracksToPlaylist(playlist.id, limitedTrackUris);

    return NextResponse.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        url: playlist.external_urls.spotify,
      },
    });
  } catch (error) {
    console.error("Create playlist error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create playlist" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSpotifyClient } from "@/lib/spotify";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { action } = await request.json();
  const spotify = createSpotifyClient(session.accessToken);

  try {
    switch (action) {
      case "play": await spotify.play(); break;
      case "pause": await spotify.pause(); break;
      case "next": await spotify.nextTrack(); break;
      case "previous": await spotify.previousTrack(); break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Player control failed" },
      { status: 500 }
    );
  }
}

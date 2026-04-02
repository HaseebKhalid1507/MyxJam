import { NextRequest, NextResponse } from "next/server";

export interface SyncedLine {
  time: number; // milliseconds
  text: string;
}

function parseLRC(lrc: string): SyncedLine[] {
  const lines: SyncedLine[] = [];
  for (const line of lrc.split("\n")) {
    const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = match[3].length === 2 ? parseInt(match[3]) * 10 : parseInt(match[3]);
      const time = min * 60000 + sec * 1000 + ms;
      const text = match[4].trim();
      if (text) lines.push({ time, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist") || "";
  const title = request.nextUrl.searchParams.get("title") || "";
  const durationStr = request.nextUrl.searchParams.get("duration") || "0";
  const duration = parseInt(durationStr);

  if (!artist || !title) {
    return NextResponse.json({ error: "artist and title required" }, { status: 400 });
  }

  const cleanTitle = title
    .replace(/\(feat\..*?\)/gi, "")
    .replace(/\(with.*?\)/gi, "")
    .replace(/\(.*?remix.*?\)/gi, "")
    .replace(/\[.*?\]/g, "")
    .trim();
  const cleanArtist = artist.split(",")[0].trim();

  // Try LRCLIB for synced lyrics first
  try {
    const params = new URLSearchParams({
      track_name: cleanTitle,
      artist_name: cleanArtist,
      ...(duration > 0 ? { duration: Math.round(duration / 1000).toString() } : {}),
    });
    const res = await fetch(`https://lrclib.net/api/get?${params}`, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "MyxJam/1.0 (https://myx-jam.vercel.app)" },
    });
    if (res.ok) {
      const data = await res.json();
      // Prefer synced lyrics
      if (data.syncedLyrics) {
        const syncedLines = parseLRC(data.syncedLyrics);
        if (syncedLines.length > 0) {
          return NextResponse.json({
            synced: true,
            lines: syncedLines,
            plainLyrics: data.plainLyrics || null,
            source: "lrclib",
          });
        }
      }
      // Fall back to plain lyrics from LRCLIB
      if (data.plainLyrics) {
        return NextResponse.json({
          synced: false,
          lines: [],
          plainLyrics: data.plainLyrics,
          source: "lrclib",
        });
      }
    }
  } catch {}

  // Fallback: lyrics.ovh for plain lyrics
  try {
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.lyrics?.trim()) {
        return NextResponse.json({
          synced: false,
          lines: [],
          plainLyrics: data.lyrics.trim(),
          source: "lyrics.ovh",
        });
      }
    }
  } catch {}

  return NextResponse.json({ synced: false, lines: [], plainLyrics: null });
}

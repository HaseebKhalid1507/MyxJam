// Spotify API helper with typed responses

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
  followers: { total: number };
  popularity: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  artists: { id: string; name: string }[];
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  external_urls: { spotify: string };
  snapshot_id: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
}

export interface AudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  liveness: number;
}

export interface RecentlyPlayed {
  track: SpotifyTrack;
  played_at: string;
}

class SpotifyClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Spotify API error: ${response.status}`);
    }

    return response.json();
  }

  async searchArtists(query: string, limit = 10): Promise<SpotifyArtist[]> {
    const params = new URLSearchParams({
      q: query,
      type: "artist",
      limit: limit.toString(),
    });
    const data = await this.fetch<{ artists: { items: SpotifyArtist[] } }>(
      `/search?${params}`
    );
    return data.artists.items;
  }

  async getArtistTopTracks(artistId: string, market = "US"): Promise<SpotifyTrack[]> {
    const data = await this.fetch<{ tracks: SpotifyTrack[] }>(
      `/artists/${artistId}/top-tracks?market=${market}`
    );
    return data.tracks;
  }

  async getCurrentUser(): Promise<SpotifyUser> {
    return this.fetch<SpotifyUser>("/me");
  }

  async createPlaylist(
    userId: string,
    name: string,
    description?: string,
    isPublic = false
  ): Promise<SpotifyPlaylist> {
    return this.fetch<SpotifyPlaylist>(`/users/${userId}/playlists`, {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
      }),
    });
  }

  async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20): Promise<SpotifyArtist[]> {
    const data = await this.fetch<{ items: SpotifyArtist[] }>(
      `/me/top/artists?time_range=${timeRange}&limit=${limit}`
    );
    return data.items;
  }

  async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20): Promise<SpotifyTrack[]> {
    const data = await this.fetch<{ items: SpotifyTrack[] }>(
      `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
    );
    return data.items;
  }

  async getRecentlyPlayed(limit = 50): Promise<RecentlyPlayed[]> {
    const data = await this.fetch<{ items: RecentlyPlayed[] }>(
      `/me/player/recently-played?limit=${limit}`
    );
    return data.items;
  }

  async getAudioFeatures(trackIds: string[]): Promise<AudioFeatures[]> {
    if (trackIds.length === 0) return [];
    // Spotify allows max 100 IDs per request
    const chunks: string[][] = [];
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }
    const allFeatures: AudioFeatures[] = [];
    for (const chunk of chunks) {
      const data = await this.fetch<{ audio_features: (AudioFeatures | null)[] }>(
        `/audio-features?ids=${chunk.join(',')}`
      );
      allFeatures.push(...data.audio_features.filter((f): f is AudioFeatures => f !== null));
    }
    return allFeatures;
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<{ snapshot_id: string }> {
    // Spotify allows max 100 tracks per request
    const chunks = [];
    for (let i = 0; i < trackUris.length; i += 100) {
      chunks.push(trackUris.slice(i, i + 100));
    }

    let snapshotId = "";
    for (const chunk of chunks) {
      const result = await this.fetch<{ snapshot_id: string }>(
        `/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          body: JSON.stringify({ uris: chunk }),
        }
      );
      snapshotId = result.snapshot_id;
    }

    return { snapshot_id: snapshotId };
  }
}

export function createSpotifyClient(accessToken: string) {
  return new SpotifyClient(accessToken);
}

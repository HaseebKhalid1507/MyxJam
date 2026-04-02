import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

// Spotify scopes needed for our app:
// - user-read-email: Get user's email
// - user-read-private: Get user's profile info
// - playlist-modify-public: Create/modify public playlists
// - playlist-modify-private: Create/modify private playlists
const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-top-read",
  "user-read-recently-played",
].join(" ");

// Use AUTH_URL env var, fallback for dev
const baseUrl = process.env.AUTH_URL || "http://127.0.0.1:3000";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  redirectProxyUrl: baseUrl + "/api/auth",
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(SPOTIFY_SCOPES)}&redirect_uri=${encodeURIComponent(baseUrl + "/api/auth/callback/spotify")}`,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl: _baseUrl }) {
      // Always redirect to 127.0.0.1, never localhost
      const fixedUrl = url.replace("localhost", "127.0.0.1");
      const fixedBaseUrl = baseUrl;
      
      // If relative URL, prepend base
      if (fixedUrl.startsWith("/")) {
        return `${fixedBaseUrl}${fixedUrl}`;
      }
      // If same origin, allow
      if (new URL(fixedUrl).origin === fixedBaseUrl) {
        return fixedUrl;
      }
      // Default to base
      return fixedBaseUrl;
    },
    async jwt({ token, account }) {
      // Initial sign in - persist the access token and refresh token
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }

      // Return previous token if it hasn't expired
      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      // Access token has expired, try to refresh it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Redirect to home page for sign in
  },
});

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
      // Fall back to old refresh token if a new one isn't provided
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

import type { NextConfig } from "next";

// The backend at BACKEND_ORIGIN doesn't send CORS headers, so browser
// fetch() calls to it directly get blocked. Routing REST calls through this
// same-origin rewrite sidesteps that: the browser only ever talks to this
// Next.js server, which proxies server-to-server (not subject to CORS).
// WebSocket connections aren't affected by CORS, so they still connect
// directly to the backend (see NEXT_PUBLIC_WS_URL).
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || "http://130.185.120.78:8000";

const nextConfig: NextConfig = {
  devIndicators: false,
  // The backend's own URL scheme is inconsistent about trailing slashes
  // (e.g. POST /messages/ requires one, GET /messages/direct/{id} rejects
  // one) — Django's APPEND_SLASH 500s on a mismatch. Without this flag,
  // Next.js's own default trailing-slash redirect fires *before* the rewrite
  // below, silently stripping/adding slashes and breaking exactly that.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      // Endpoints the backend requires a trailing slash on (Django
      // ViewSet-router endpoints) get literal, explicit rules ordered before
      // the catch-all below — a `:path*` catch-all's destination templating
      // doesn't reliably preserve a literal trailing slash on rebuild, which
      // is exactly what breaks these against Django's APPEND_SLASH.
      {
        source: "/api/v1/messages/",
        destination: `${BACKEND_ORIGIN}/api/v1/messages/`,
      },
      {
        source: "/api/v1/messages/scheduled/",
        destination: `${BACKEND_ORIGIN}/api/v1/messages/scheduled/`,
      },
      {
        source: "/api/v1/messages/scheduled/:scheduledId/",
        destination: `${BACKEND_ORIGIN}/api/v1/messages/scheduled/:scheduledId/`,
      },
      {
        source: "/api/v1/messages/search/global/",
        destination: `${BACKEND_ORIGIN}/api/v1/messages/search/global/`,
      },
      {
        source: "/api/v1/messages/direct/:userId/search/",
        destination: `${BACKEND_ORIGIN}/api/v1/messages/direct/:userId/search/`,
      },
      {
        source: "/api/v1/messages/groups/:groupId/search/",
        destination: `${BACKEND_ORIGIN}/api/v1/messages/groups/:groupId/search/`,
      },
      {
        source: "/api/v1/messages/channels/:channelId/search/",
        destination: `${BACKEND_ORIGIN}/api/v1/messages/channels/:channelId/search/`,
      },
      {
        source: "/api/v1/groups/",
        destination: `${BACKEND_ORIGIN}/api/v1/groups/`,
      },
      {
        source: "/api/v1/channels/",
        destination: `${BACKEND_ORIGIN}/api/v1/channels/`,
      },
      {
        source: "/api/v1/storage/upload/",
        destination: `${BACKEND_ORIGIN}/api/v1/storage/upload/`,
      },
      {
        source: "/api/v1/storage/files/:fileKey/",
        destination: `${BACKEND_ORIGIN}/api/v1/storage/files/:fileKey/`,
      },
      {
        source: "/api/v1/stickers/packs/",
        destination: `${BACKEND_ORIGIN}/api/v1/stickers/packs/`,
      },
      {
        source: "/api/v1/stickers/packs/:packId/",
        destination: `${BACKEND_ORIGIN}/api/v1/stickers/packs/:packId/`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

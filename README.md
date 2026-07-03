# Signal — Broadcast Desk

Write once, broadcast everywhere: one dashboard that posts to Facebook, Instagram,
Google Business Profile, and TikTok.

Built from the `SignalBroadcastDesk` backend scaffold, now completed with a full
React frontend and working end-to-end flows.

## Quick start

```bash
# 1. Backend (port 3000)
cd backend
npm install
npm run dev

# 2. Frontend (port 5173) — in a second terminal
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

**Works immediately with zero configuration**: any platform without API credentials in
`backend/.env` runs in **demo mode** — Connect succeeds instantly and broadcasts are
simulated, so you can exercise the full compose → broadcast → history flow before any
platform app review is approved.

## Project layout

```
backend/            Express API — OAuth, posting, history
  server.js         App entry: sessions, CORS, routes, serves frontend/dist if built
  routes/
    auth-meta.js    Facebook + Instagram OAuth (real flow + demo fallback)
    auth-google.js  Google Business Profile OAuth
    auth-tiktok.js  TikTok OAuth (v2, with CSRF state check)
    posting.js      /api/posts/broadcast fan-out, /history, per-platform routes
  lib/
    publish.js      Real posting implementations per platform
    platforms.js    Connection/demo/configured status per session
    history.js      Broadcast history persisted to data/history.json
frontend/           React + Vite dashboard
  src/components/   Compose, Connections, History, Sidebar
```

## API

| Endpoint | Description |
|---|---|
| `GET /health` | Liveness check |
| `GET /api/connections` | Per-platform `{ connected, demo, configured }` for this session |
| `GET /auth/{meta,google,tiktok}` | Start OAuth (or instant demo-connect if unconfigured) |
| `POST /auth/{meta,google,tiktok}/disconnect` | Drop the session's tokens |
| `POST /api/posts/broadcast` | `{ message, platforms: [], imageUrl? }` → per-platform results |
| `GET /api/posts/history` | Past broadcasts, newest first |

## Going live (real posting)

Register a developer app with each platform, copy credentials into `backend/.env`
(see `.env.example`), restart the backend — the same Connect buttons then launch the
real OAuth consent screens.

- **Meta (Facebook + Instagram)** — [developers.facebook.com](https://developers.facebook.com):
  Business app with Facebook Login + Instagram Graph API. Redirect URI
  `http://localhost:3000/auth/meta/callback`. Test with accounts added as app Testers;
  production posting needs App Review (`pages_manage_posts`, `instagram_content_publish`)
  and Business Verification (~1-2 weeks). Facebook text posting and Instagram image
  publishing are fully wired.
- **Google Business Profile** — [console.cloud.google.com](https://console.cloud.google.com):
  OAuth Client ID with redirect `http://localhost:3000/auth/google/callback`. The Business
  Profile API itself requires a [separate access request](https://developers.google.com/my-business/content/prereqs).
  Local Post publishing is wired (v4 localPosts).
- **TikTok** — [developers.tiktok.com](https://developers.tiktok.com): Content Posting API
  requires app review. OAuth is wired; posting is video-only on TikTok's side, so text
  broadcasts remain simulated.

## Production notes

- `npm run build` in `frontend/` produces `frontend/dist`, which the backend serves
  automatically — you can then deploy the backend alone.
- Tokens live in in-memory sessions: fine locally, but move them to an encrypted store
  and add refresh logic (Meta/Google tokens expire) before real deployment.
- Run behind HTTPS in production; the session cookie switches to `secure` automatically
  when `NODE_ENV=production`.
- `.env` holds real secrets — it is gitignored; keep it that way.

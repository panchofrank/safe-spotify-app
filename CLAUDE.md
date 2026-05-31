# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server on localhost:3000
npm run build      # Production build
npm test           # Run tests (watch mode); press 'a' to run all
npm run deploy     # Build and deploy to GitHub Pages (requires gh-pages)
```

Run a single test file:
```bash
npm test -- --testPathPattern=App.test
```

## Environment Setup

Copy `.env` values (not committed) — requires:
- `REACT_APP_SPOTIFY_CLIENT_ID` — Spotify app client ID
- `REACT_APP_REDIRECT_URL` — OAuth redirect URI (GitHub Pages URL or local ngrok for dev)
- `REACT_APP_LASTFM_API_KEY` — Last.fm API key, used for similar-track suggestions (read-only, no OAuth)

For local dev, use an ngrok tunnel as the redirect URI since `localhost` isn't accepted by Spotify as a valid redirect target in some configurations.

## Architecture

**Stack:** React 19 + TypeScript, Create React App, Axios, deployed to GitHub Pages.

**Authentication:** PKCE OAuth 2.0 flow — entirely client-side, no backend. `Login.tsx` generates the code verifier/challenge, redirects to Spotify. `App.tsx` intercepts the `?code=` param on return, exchanges it for a token via `POST /api/token`, then clears the URL.

**Playback:** Uses the [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk) (loaded dynamically at runtime). Once the SDK fires `ready`, the app stores the `device_id` and routes all `PUT /v1/me/player/play` calls to it. Player state (paused/track) comes from `player_state_changed` events, not polling.

**State management:** All state lives in `App.tsx` via `useState` — no Context or Redux. Key state: `token`, `deviceId`, `player` (SDK instance), `currentTrack`, `isPaused`, `likedSongs`, `offset` (pagination), `tracks` (search results).

**Spotify calls:** All raw Spotify REST calls (search, liked songs, save, play, seek) live in `src/api/spotify.ts`; `App.tsx` imports these helpers rather than calling Axios directly.

**Suggestions (Last.fm):** `src/api/suggestions.ts` builds recommendations: it samples a few liked songs as seeds, asks Last.fm `track.getsimilar` for similar tracks, then resolves each "artist + title" back to a playable track via Spotify search (dropping misses, already-liked songs, and duplicates). Last.fm is used purely as a read-only REST API with an API key — there is no Last.fm OAuth/login flow. Suggested tracks carry a `__suggested` flag (see `src/types.ts`).

**Liked songs:** Loaded on login with offset-based pagination (50 per page). "Play My Songs" shuffles the current page (`src/utils/shuffle.ts`, Fisher–Yates) and interleaves Last.fm suggestions into it (`src/utils/mixSongs.ts`, one suggestion every few tracks) before queueing via the SDK.

**Key files:**
- `src/App.tsx` — main logic (auth exchange, SDK init, search, playback, liked songs, mixing in suggestions)
- `src/Login.tsx` — PKCE login UI
- `src/CurrentTrack.tsx` — now-playing display and playback controls
- `src/types.ts` — shared `Track`/`Artist`/`Album` types
- `src/api/spotify.ts` — Spotify REST helpers
- `src/api/suggestions.ts` — Last.fm similar-track suggestions resolved to Spotify tracks
- `src/utils/shuffle.ts` — Fisher–Yates shuffle
- `src/utils/mixSongs.ts` — interleave suggestions into liked songs
- `src/spotifyConfig.ts` — client ID, redirect URI, OAuth scopes
- `src/lastfmConfig.ts` — Last.fm API key and base URL
- `src/utils/spotifyAuth.ts` — PKCE utilities (code verifier, challenge, auth URL)
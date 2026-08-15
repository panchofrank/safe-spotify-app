# Spotify kid safe app
Allows use of spotify on a web page without access to video functionality.

## Environment variables (`.env`)

The app reads its config from a `.env` file in the project root (not committed). It must define:

| Variable | Purpose |
| --- | --- |
| `REACT_APP_SPOTIFY_CLIENT_ID` | Spotify app client ID (from the Spotify dashboard). |
| `REACT_APP_REDIRECT_URL` | The OAuth redirect URI Spotify sends you back to after login. **This changes between local dev and production — see below.** |
| `REACT_APP_LASTFM_API_KEY` | Last.fm API key, used to fetch "similar track" suggestions. |

> **Important:** Create React App only reads `.env` at startup. After editing it you **must stop and restart `npm start`** — a running dev server keeps the old values.

### `REACT_APP_REDIRECT_URL`: local vs production

Spotify only redirects to an **exact**, **https** URL that is registered in your
[Spotify app dashboard](https://developer.spotify.com/dashboard) (App → Settings → Redirect URIs).
So this value differs depending on where you're running:

- **Production** (deployed to GitHub Pages):
  `https://panchofrank.github.io/safe-spotify-app/`
- **Local development**: an https tunnel pointing at `localhost:3000` (Spotify won't accept a plain
  `http://localhost` redirect). See "Local development" below.

When you switch contexts, change `REACT_APP_REDIRECT_URL` in `.env`, make sure that **same** URL is
listed in the Spotify dashboard, and restart `npm start`. If the value in `.env` doesn't exactly match
a URI registered in the dashboard, login fails with `INVALID_CLIENT: Invalid redirect URI`.

## Local development

Spotify requires the OAuth redirect to be an https URL, but `npm start` serves plain http on
`localhost:3000`. To bridge that, run a tunnel that exposes `localhost:3000` over https and use the
tunnel's URL as `REACT_APP_REDIRECT_URL`.

We use **cloudflared** (Cloudflare Tunnel). It serves the app directly with no warning/interstitial
page. (We previously used ngrok, but ngrok's free tier injects a browser-warning interstitial —
`ERR_NGROK_6024` — that broke the OAuth redirect, so it's no longer used.)

1. Install cloudflared (one-time). On Linux:
   ```bash
   curl -fsSL -o ~/.local/bin/cloudflared \
     https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
   chmod +x ~/.local/bin/cloudflared
   ```
2. Start the tunnel (leave it running):
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
   It prints a random URL like `https://<random-words>.trycloudflare.com`.
3. Put that URL in `.env` as `REACT_APP_REDIRECT_URL`, and add the **same** URL to the Spotify
   dashboard's Redirect URIs.
4. Start (or restart) the app: `npm start`, then open
   [http://localhost:3000](http://localhost:3000) and press Launch.

> **Heads up:** free `trycloudflare.com` URLs are random and change every time you restart
> `cloudflared`. When that happens you must update both `.env` **and** the Spotify dashboard with the
> new URL, then restart `npm start`.

## How suggestions work

"Play my treasure songs" mixes the user's liked songs with suggested (non-favorite) tracks fetched
from Last.fm. To keep things fresh, the suggestions are randomized each day:

- A few liked songs are sampled as seeds and sent to Last.fm's `track.getsimilar`.
- A larger pool of similar tracks is requested, then a random subset is resolved back to playable
  Spotify tracks (dropping misses, already-liked songs, and duplicates).
- All the shuffling is driven by a PRNG seeded from the current date, so the suggestions stay stable
  within a day but change every day instead of always returning Last.fm's top matches.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
Requires a running https tunnel and matching `REACT_APP_REDIRECT_URL` — see "Local development" above.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run deploy`

Deploys the app to github pages: 
https://panchofrank.github.io/safe-spotify-app/

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

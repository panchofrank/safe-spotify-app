export const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID!;
export const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URL!;
export const SCOPES = [
    "streaming",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-library-modify"
];

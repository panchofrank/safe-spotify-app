import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    getAuthURL,
    generateRandomString,
    generateCodeChallenge,
} from "./utils/spotifyAuth";
import { REDIRECT_URI, SPOTIFY_CLIENT_ID } from "./spotifyConfig";

declare global {
    interface Window {
        Spotify: any;
        onSpotifyWebPlaybackSDKReady: () => void;
    }
}

const App: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [tracks, setTracks] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [player, setPlayer] = useState<any>(null);

    /**
     * 🔐 Handle redirect from Spotify and exchange code for token
     */
    useEffect(() => {
        console.log('client id: ' + SPOTIFY_CLIENT_ID);
        const code = new URLSearchParams(window.location.search).get("code");
        const codeVerifier = sessionStorage.getItem("code_verifier");

        if (!code || !codeVerifier) return;

        const body = new URLSearchParams();
        body.append("grant_type", "authorization_code");
        body.append("code", code);
        body.append("redirect_uri", REDIRECT_URI);
        body.append("client_id", SPOTIFY_CLIENT_ID);
        body.append("code_verifier", codeVerifier);

        axios
            .post("https://accounts.spotify.com/api/token", body, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            })
            .then((res) => {
                setToken(res.data.access_token);
                sessionStorage.removeItem("code_verifier");
                window.history.replaceState({}, document.title, "/"); // clean URL
            })
            .catch((err) => {
                console.error("Token error:", err.response?.data || err);
            });
    }, []);

    /**
     * Initialize Spotify Web Playback SDK once we have a token
     */
    useEffect(() => {
        if (!token) return;

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: "React Web Player",
                getOAuthToken: (cb: (token: string) => void) => cb(token),
                volume: 0.5,
            });

            player.addListener("ready", ({ device_id }: any) => {
                console.log("Web Playback SDK ready, device_id:", device_id);
                setDeviceId(device_id);
            });

            player.addListener("not_ready", ({ device_id }: any) => {
                console.warn("Device went offline:", device_id);
            });

            player.addListener("initialization_error", ({ message }: any) =>
                console.error(message)
            );
            player.addListener("authentication_error", ({ message }: any) =>
                console.error(message)
            );
            player.addListener("account_error", ({ message }: any) =>
                console.error(message)
            );

            player.connect();
            setPlayer(player);
        };
    }, [token]);

    /**
     * Login with Spotify (PKCE)
     */
    const login = async () => {
        const codeVerifier = generateRandomString(128);
        sessionStorage.setItem("code_verifier", codeVerifier);

        const codeChallenge = await generateCodeChallenge(codeVerifier);
        window.location.href = getAuthURL(codeChallenge);
    };

    /**
     * 🔍 Search tracks
     */
    const searchTracks = async () => {
        if (!token) return;

        const res = await axios.get("https://api.spotify.com/v1/search", {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                q: searchTerm,
                type: "track",
                limit: 10,
            },
        });

        setTracks(res.data.tracks.items);
    };

    /**
     * ▶️ Play track in browser
     */
    const playTrack = async (uri: string) => {
        if (!token || !deviceId) {
            console.error("No active Web Playback SDK device");
            return;
        }

        await axios.put(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            { uris: [uri] },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
    };

    if (!token) {
        return <button onClick={login}>Login with Spotify</button>;
    }

    return (
        <div>
            <h1>Spotify Web Audio Player</h1>

            <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tracks..."
            />
            <button onClick={searchTracks}>Search</button>

            <ul>
                {tracks.map((track) => (
                    <li key={track.id}>
                        {track.name} –{" "}
                        {track.artists.map((a: any) => a.name).join(", ")}
                        <button onClick={() => playTrack(track.uri)}>Play</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default App;

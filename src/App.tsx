import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import { REDIRECT_URI, SPOTIFY_CLIENT_ID } from "./spotifyConfig";
import {
    getLikedSongs,
    playUris,
    saveTrack,
    searchTracks,
    seekToStart,
} from "./api/spotify";
import { fetchSuggestions } from "./api/suggestions";
import { mixSongs } from "./utils/mixSongs";
import { shuffle } from "./utils/shuffle";
import { Track } from "./types";
import Login from "./Login";
import CurrentTrack from "./CurrentTrack";

declare global {
    interface Window {
        Spotify: any;
        onSpotifyWebPlaybackSDKReady: () => void;
    }
}

const PAGE_SIZE = 50;

const App: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [isPaused, setIsPaused] = useState(true);
    const [currentTrack, setCurrentTrack] = useState<any>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [tracks, setTracks] = useState<Track[]>([]);

    const [likedSongs, setLikedSongs] = useState<Track[]>([]);
    const [suggestedSongs, setSuggestedSongs] = useState<Track[]>([]);
    const [offset, setOffset] = useState(0);

    // Exchange the authorization code for an access token on return from Spotify.
    useEffect(() => {
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
                window.history.replaceState({}, document.title, "/");
            })
            .catch((err) => {
                console.error("Token error:", err.response?.data || err);
            });
    }, []);

    // Initialize the Web Playback SDK once we have a token.
    useEffect(() => {
        if (!token) return;

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const sdkPlayer = new window.Spotify.Player({
                name: "React Web Player",
                getOAuthToken: (cb: (t: string) => void) => cb(token),
                volume: 0.5,
            });

            sdkPlayer.addListener("ready", ({ device_id }: any) => setDeviceId(device_id));
            sdkPlayer.addListener("player_state_changed", (sdkState: any) => {
                if (!sdkState) return;
                setIsPaused(sdkState.paused);
                setCurrentTrack(sdkState.track_window.current_track);
            });

            sdkPlayer.connect();
            setPlayer(sdkPlayer);
        };

        return () => {
            script.remove();
        };
    }, [token]);

    // Load liked songs (and their suggestions) on login and whenever the page changes.
    const refreshLibrary = useCallback(async () => {
        if (!token) return;
        try {
            const liked = await getLikedSongs(token, offset, PAGE_SIZE);
            setLikedSongs(liked);
            setSuggestedSongs([]);
            setSuggestedSongs(await fetchSuggestions(token, liked));
        } catch (err) {
            console.error("Failed to load library:", err);
        }
    }, [token, offset]);

    useEffect(() => {
        refreshLibrary();
    }, [refreshLibrary]);

    const handleSearch = async () => {
        if (!token || !searchTerm) return;
        setTracks(await searchTracks(token, searchTerm));
    };

    const likeCurrentTrack = async () => {
        if (token && currentTrack) await saveTrack(token, currentTrack.id);
    };

    const play = async (uri: string) => {
        if (token && deviceId) await playUris(token, deviceId, [uri]);
    };

    const playFavourites = async () => {
        if (!token || !deviceId) return;
        const uris = shuffle([...likedSongs, ...suggestedSongs]).map((t) => t.uri);
        await playUris(token, deviceId, uris);
    };

    const restartTrack = async () => {
        if (token && deviceId) await seekToStart(token, deviceId);
    };

    const togglePlay = () => player?.togglePlay();
    const previousTrack = () => player?.previousTrack();
    const nextTrack = () => player?.nextTrack();

    const pageDown = () => setOffset((prev) => prev + PAGE_SIZE);
    const pageUp = () => setOffset((prev) => Math.max(prev - PAGE_SIZE, 0));

    const mixedSongs = useMemo(
        () => mixSongs(likedSongs, suggestedSongs),
        [likedSongs, suggestedSongs]
    );

    if (!token) {
        return <Login />;
    }

    return (
        <div>
            <div className="stars stars-small" />
            <div className="stars stars-medium" />
            <div className="stars stars-big" />

            <div style={{ padding: 20 }} className="space-app">
                <h1>DJ Raphy's Music Player</h1>
                <button onClick={playFavourites}>Play my favourite songs!</button>

                <CurrentTrack
                    currentTrack={currentTrack}
                    isPaused={isPaused}
                    restartTrack={restartTrack}
                    previousTrack={previousTrack}
                    nextTrack={nextTrack}
                    togglePlay={togglePlay}
                    likeTrack={likeCurrentTrack}
                />

                {/* Track search */}
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tracks..."
                />
                <button onClick={handleSearch}>Search</button>

                <ul>
                    {tracks.map((track) => (
                        <li
                            key={track.id}
                            style={{ margin: 10 }}
                            onClick={() => play(track.uri)}
                            className="clickable"
                        >
                            {track.name} – {track.artists.map((a) => a.name).join(", ")}
                        </li>
                    ))}
                </ul>

                {/* Liked songs, with Last.fm suggestions mixed in */}
                <h2>My Songs</h2>
                <ul>
                    {mixedSongs.map((track) => (
                        <li
                            key={track.id}
                            style={{ display: "flex", alignItems: "center", margin: 10 }}
                            onClick={() => play(track.uri)}
                            className="clickable"
                        >
                            {track.album.images?.[0] && (
                                <img
                                    src={track.album.images[0].url}
                                    alt="album"
                                    width={60}
                                    height={60}
                                    style={{ marginRight: 10 }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <strong>{track.name}</strong>
                                {track.__suggested && (
                                    <span style={{ marginLeft: 8, fontSize: 12, color: "#1db954" }}>
                                        ✨ Suggested
                                    </span>
                                )}
                                <div>{track.artists.map((a) => a.name).join(", ")}</div>
                            </div>
                        </li>
                    ))}
                </ul>
                <button onClick={pageDown}>Page Down</button>
                <button onClick={pageUp}>Page Up</button>
            </div>
        </div>
    );
};

export default App;

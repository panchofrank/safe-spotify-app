import React, { useEffect, useState } from "react";
import axios from "axios";

import { REDIRECT_URI, SPOTIFY_CLIENT_ID } from "./spotifyConfig";
import Login from "./Login";
import CurrentTrack from "./CurrentTrack";

declare global {
    interface Window {
        Spotify: any;
        onSpotifyWebPlaybackSDKReady: () => void;
    }
}

type MusicPlayerState = {
    token: string | null;
    tracks: any[];
    searchTerm: string;
    deviceId: string | null;
    player: any;
    isPaused: boolean;
    currentTrack: any;
    likedSongs: any[];
    offset: number;
}

const App: React.FC = () => {


    const [state, setState] = useState<MusicPlayerState>({
        token: null,
        tracks: [],
        searchTerm: "",
        deviceId: null,
        player: null,
        isPaused: true,
        currentTrack: null,
        likedSongs: [],
        offset: 0
    });

    // Exchange authorization code for token
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
                setState(prev => ({ ...prev, token: res.data.access_token }));
                sessionStorage.removeItem("code_verifier");
                window.history.replaceState({}, document.title, "/");
            })
            .catch((err) => {
                console.error("Token error:", err.response?.data || err);
            });
    }, []);
    // Initialize Web Playback SDK
    useEffect(() => {
        if (!state.token) return;

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            if (!state.token) return;
            const player = new window.Spotify.Player({
                name: "React Web Player",
                getOAuthToken: (cb: (token: string) => void) => cb(state.token || ''),
                volume: 0.5,
            });


            player.addListener("ready", ({device_id}: any) => {
                setState(prev => ({...prev, deviceId: device_id}));
            });

            player.addListener("player_state_changed", (state: any) => {
                if (!state) return;
                setState(prev => ({
                    ...prev,
                    isPaused: state.paused,
                    currentTrack: state.track_window.current_track
                }));

            });

            player.connect();
            setState(prev => ({...prev, player: player}));
        }

    }, [state.token]);

    useEffect(() => {
        loadLikedSongs();
    }, [state.offset]);

    useEffect(() => {
        if (state.token) loadLikedSongs();
    }, [state.token]);


    const searchTracks = async () => {
        if (!state.token) return;

        const res = await axios.get("https://api.spotify.com/v1/search", {
            headers: { Authorization: `Bearer ${state.token}` },
            params: {
                q: state.searchTerm,
                type: "track",
                limit: 10,
            },
        });
        setState(prev => ({...prev, tracks: res.data.tracks.items}));

    };

    const likeTrack = async ()=> {
        await axios.put(
            `https://api.spotify.com/v1/me/tracks?device_id=${state.deviceId}`,
            { ids: [state.currentTrack.id] },
            { headers: { Authorization: `Bearer ${state.token}` } }
        );
    } ;

    const playTrack = async (uri: string) => {
        if (!state.token || !state.deviceId) return;

        await axios.put(
            `https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`,
            { uris: [uri] },
            { headers: { Authorization: `Bearer ${state.token}` } }
        );
    };

    const playRecommended = async () => {
        if (!state.token || !state.deviceId) return;

        await axios.put(
            `https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`,
            { uris: state.likedSongs.map(item => item.uri) },
            { headers: { Authorization: `Bearer ${state.token}` } });

    };


    const togglePlay = () => state.player?.togglePlay();
    const previousTrack = () => state.player?.previousTrack();
    const nextTrack = () => state.player?.nextTrack();

    const restartTrack = async () => {
        if (!state.token || !state.deviceId) return;

        await axios.put(
            `https://api.spotify.com/v1/me/player/seek?position_ms=0&device_id=${state.deviceId}`,
            {},
            { headers: { Authorization: `Bearer ${state.token}` } }
        );
    };

    function pageDown() {
        setState(prev => ({ ...prev, offset: state.offset + 50 }));
    }

    function pageUp() {
        setState(prev => ({ ...prev, offset: Math.max(state.offset - 50, 0) }));
    }

    const loadLikedSongs = async () => {
        if (!state.token) return;

        const res = await axios.get("https://api.spotify.com/v1/me/tracks", {
            headers: { Authorization: `Bearer ${state.token}` },
            params: { limit: 50, offset:state.offset }, // adjust as needed
        });

        // res.data.items is an array of { added_at, track }
        const likedTracks = res.data.items.map((item: any) => item.track);

        setState(prev => ({ ...prev, likedSongs: likedTracks }));
       // loadRecommendations(likedTracks);
    };


    if (!state.token) {
        return <Login></Login>;
    }

    return (
        <div>

            <div className="stars stars-small" />
            <div className="stars stars-medium" />
            <div className="stars stars-big" />


        <div style={{ padding: 20 }} className="space-app">
            <h1>DJ Raphy's Music Player</h1>
            <button onClick={playRecommended}>Play my favourite songs!</button>


            <CurrentTrack currentTrack={state.currentTrack} isPaused={state.isPaused}
                          restartTrack={restartTrack}
                          previousTrack={previousTrack}
                          nextTrack={nextTrack}
                          togglePlay={togglePlay}
                          likeTrack={likeTrack}  ></CurrentTrack>


            {/* Track search */}
            <input
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="Search tracks..."
            />
            <button onClick={searchTracks}>Search</button>

            <ul>
                {state.tracks.map((track) => (
                    <li key={track.id} style={{ margin: 10 }} onClick={() => playTrack(track.uri)} className="clickable">
                        {track.name} – {track.artists.map((a: any) => a.name).join(", ")}
                    </li>
                ))}
            </ul>

            {/* User playlists */}
            <h2>My Songs</h2>
            <ul>
                {state.likedSongs.map((track) => (
                    <li key={track.id} style={{ display: "flex", alignItems: "center", margin: 10 }}
                        onClick={() => playTrack(track.uri)}
                        className="clickable">
                        {track.album.images && track.album.images[0] && (
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
                            <div>{track.artists.map((a: any) => a.name).join(", ")}</div>
                        </div>
                    </li>
                ))}
            </ul>
            <button onClick={() => pageDown() }>Page Down</button>
            <button onClick={() => pageUp() }>Page Up</button>

        </div>
        </div>
    );
};

export default App;

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

const App: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [tracks, setTracks] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [isPaused, setIsPaused] = useState(true);
    const [currentTrack, setCurrentTrack] = useState<any>(null);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [likedSongs, setLikedSongs] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);


  /*  useEffect(() => {
        if (token) {
            sessionStorage.setItem("spotify_token", token);
        }
    }, [token]);

// On mount, try to restore token
    useEffect(() => {
        const savedToken = sessionStorage.getItem("spotify_token");
        if (savedToken) setToken(savedToken);
    }, []);

   */
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
                setToken(res.data.access_token);
                sessionStorage.removeItem("code_verifier");
                window.history.replaceState({}, document.title, "/");
            })
            .catch((err) => {
                console.error("Token error:", err.response?.data || err);
            });
    }, []);
    // Initialize Web Playback SDK
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
                setDeviceId(device_id);
            });

            player.addListener("player_state_changed", (state: any) => {
                if (!state) return;
                setIsPaused(state.paused);
                setCurrentTrack(state.track_window.current_track);
            });

            player.connect();
            setPlayer(player);
        };
    }, [token]);


    useEffect(() => {
        if (token) loadPlaylists();
    }, [token]);


    useEffect(() => {
        if (token) loadLikedSongs();
    }, [token]);


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

    const playTrack = async (uri: string) => {
        if (!token || !deviceId) return;

        await axios.put(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            { uris: [uri] },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    };

    const playRecommended = async () => {
        if (!token || !deviceId) return;

        await axios.put(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            { uris: likedSongs.map(item => item.uri) },
            { headers: { Authorization: `Bearer ${token}` } });

    };


    const togglePlay = () => player?.togglePlay();
    const previousTrack = () => player?.previousTrack();
    const nextTrack = () => player?.nextTrack();

    const restartTrack = async () => {
        if (!token || !deviceId) return;

        await axios.put(
            `https://api.spotify.com/v1/me/player/seek?position_ms=0&device_id=${deviceId}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
    };

    const loadLikedSongs = async () => {
        if (!token) return;

        const res = await axios.get("https://api.spotify.com/v1/me/tracks", {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 50 }, // adjust as needed
        });

        // res.data.items is an array of { added_at, track }
        const likedTracks = res.data.items.map((item: any) => item.track);
        setLikedSongs(likedTracks);
       // loadRecommendations(likedTracks);
    };

    const loadRecommendations = async(seedTracks: Array<any>)=> {
        const seedIds = seedTracks
            .slice(1, 2)
            .map(track => track.uri.split(":")[2]);

        const recs = await axios.get(
            `https://api.spotify.com/v1/recommendations?seed_tracks=${seedIds.join(",")}&limit=20`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const recommendedUris = recs.data.items.map((t: any )=> t.uri);

        const allTracks = [...seedTracks, ...recommendedUris];

        function shuffle(array: string[]) {
            return array.sort(() => Math.random() - 0.5);
        }

        const shuffledUris = shuffle(allTracks);



        setRecommendations(shuffledUris);
    };

    const loadPlaylists = async () => {
        if (!token) return;

        const res = await axios.get("https://api.spotify.com/v1/me/playlists", {
            headers: { Authorization: `Bearer ${token}` },
        });

        setPlaylists(res.data.items);
    };

    if (!token) {
        return <Login></Login>;
    }

    return (
        <div>

            <div className="stars stars-small" />
            <div className="stars stars-medium" />
            <div className="stars stars-big" />


        <div style={{ padding: 20 }} className="space-app">
            <h1>DJ Raphael's Music Player</h1>
            <button onClick={playRecommended}>Play!</button>


            <CurrentTrack currentTrack={currentTrack} isPaused={isPaused}
                          restartTrack={restartTrack}
                          previousTrack={previousTrack}
                          nextTrack={nextTrack}
                          togglePlay={togglePlay} ></CurrentTrack>


            {/* Track search */}
            <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tracks..."
            />
            <button onClick={searchTracks}>Search</button>

            <ul>
                {tracks.map((track) => (
                    <li key={track.id} style={{ margin: 10 }}>
                        {track.name} – {track.artists.map((a: any) => a.name).join(", ")}
                        <button style={{ marginLeft: 10 }} onClick={() => playTrack(track.uri)}>Play</button>
                    </li>
                ))}
            </ul>

            {/* User playlists */}
            <h2>My Songs</h2>
            <ul>
                {likedSongs.map((track) => (
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

        </div>
        </div>
    );
};

export default App;

import axios from "axios";

import { Track } from "../types";

const API_BASE = "https://api.spotify.com/v1";

function auth(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
}

/** Search the Spotify catalogue for tracks matching `query`. */
export async function searchTracks(token: string, query: string, limit = 10): Promise<Track[]> {
    const res = await axios.get(`${API_BASE}/search`, {
        ...auth(token),
        params: { q: query, type: "track", limit },
    });
    return res.data.tracks.items;
}

/** Fetch a page of the user's liked songs (50 per page). */
export async function getLikedSongs(token: string, offset: number, limit = 50): Promise<Track[]> {
    const res = await axios.get(`${API_BASE}/me/tracks`, {
        ...auth(token),
        params: { limit, offset },
    });
    // Each item is { added_at, track }.
    return res.data.items.map((item: { track: Track }) => item.track);
}

/** Save a track to the user's library ("like"). */
export async function saveTrack(token: string, trackId: string): Promise<void> {
    await axios.put(`${API_BASE}/me/tracks`, { ids: [trackId] }, auth(token));
}

/** Start playback of the given track URIs on the target device. */
export async function playUris(token: string, deviceId: string, uris: string[]): Promise<void> {
    await axios.put(
        `${API_BASE}/me/player/play`,
        { uris },
        { ...auth(token), params: { device_id: deviceId } }
    );
}

/** Seek the current track back to the start. */
export async function seekToStart(token: string, deviceId: string): Promise<void> {
    await axios.put(
        `${API_BASE}/me/player/seek`,
        {},
        { ...auth(token), params: { position_ms: 0, device_id: deviceId } }
    );
}

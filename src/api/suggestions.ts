import axios from "axios";

import { LASTFM_API_BASE, LASTFM_API_KEY } from "../lastfmConfig";
import { Track } from "../types";
import { shuffle } from "../utils/shuffle";
import { searchTracks } from "./spotify";

const SEED_COUNT = 5; // how many liked songs to seed from
const SIMILAR_PER_SEED = 5; // similar tracks requested per seed
const MAX_SUGGESTIONS = 12; // cap on resolved Spotify tracks

interface LastfmTrack {
    name?: string;
    artist?: { name?: string };
}

/** Ask Last.fm for tracks similar to a single seed. */
async function getSimilarTracks(artist: string, track: string): Promise<LastfmTrack[]> {
    try {
        const res = await axios.get(LASTFM_API_BASE, {
            params: {
                method: "track.getsimilar",
                artist,
                track,
                api_key: LASTFM_API_KEY,
                format: "json",
                limit: SIMILAR_PER_SEED,
                autocorrect: 1,
            },
        });
        return res.data?.similartracks?.track ?? [];
    } catch {
        return [];
    }
}

/** Resolve a "artist + title" pair back to a playable Spotify track. */
async function resolveOnSpotify(token: string, artist: string, name: string): Promise<Track | null> {
    try {
        const [match] = await searchTracks(token, `track:${name} artist:${artist}`, 1);
        return match ?? null;
    } catch {
        return null;
    }
}

/**
 * Build a list of suggested tracks: seed Last.fm with a sample of the user's
 * liked songs, then resolve the similar tracks back to playable Spotify tracks,
 * dropping anything already liked or duplicated.
 */
export async function fetchSuggestions(token: string, likedTracks: Track[]): Promise<Track[]> {
    if (!token || !LASTFM_API_KEY || likedTracks.length === 0) return [];

    const likedIds = new Set(likedTracks.map((t) => t.id));
    const seeds = shuffle(likedTracks).slice(0, SEED_COUNT);

    // 1. Gather similar tracks for each seed from Last.fm.
    const similarLists = await Promise.all(
        seeds.map((seed) => {
            const artist = seed.artists?.[0]?.name;
            if (!artist || !seed.name) return Promise.resolve<LastfmTrack[]>([]);
            return getSimilarTracks(artist, seed.name);
        })
    );

    // 2. Flatten and dedupe candidates by "artist - title".
    const seen = new Set<string>();
    const candidates: { artist: string; name: string }[] = [];
    for (const candidate of similarLists.flat()) {
        const name = candidate.name;
        const artist = candidate.artist?.name;
        if (!name || !artist) continue;
        const key = `${artist} - ${name}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push({ artist, name });
    }

    // 3. Resolve each candidate to a Spotify track (a few extra, since some miss).
    const resolved = await Promise.all(
        candidates
            .slice(0, MAX_SUGGESTIONS * 2)
            .map((c) => resolveOnSpotify(token, c.artist, c.name))
    );

    // 4. Drop misses, already-liked songs, and duplicates.
    const byId = new Map<string, Track>();
    for (const track of resolved) {
        if (!track || likedIds.has(track.id) || byId.has(track.id)) continue;
        byId.set(track.id, { ...track, __suggested: true });
    }

    return Array.from(byId.values()).slice(0, MAX_SUGGESTIONS);
}

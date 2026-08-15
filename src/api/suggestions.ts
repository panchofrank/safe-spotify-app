import axios from "axios";

import { LASTFM_API_BASE, LASTFM_API_KEY } from "../lastfmConfig";
import { Track } from "../types";
import { searchTracks } from "./spotify";

const SEED_COUNT = 5; // how many liked songs to seed from
const SIMILAR_PER_SEED = 30; // similar tracks requested per seed
const MAX_SUGGESTIONS = 12; // cap on resolved Spotify tracks
const RESOLVE_POOL = MAX_SUGGESTIONS * 2; // how many candidates to resolve (some miss)

interface LastfmTrack {
    name?: string;
    artist?: { name?: string };
}

/** Deterministic PRNG (mulberry32) driven by a seed, so output is stable for a given seed. */
function mulberry32(seed: number): () => number {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** 32-bit FNV-1a hash of today's date (YYYY-MM-DD), so suggestions change daily. */
function dailySeed(): number {
    let hash = 2166136261;
    for (const ch of new Date().toISOString().slice(0, 10)) {
        hash ^= ch.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

/** Fisher–Yates shuffle driven by a seeded PRNG instead of Math.random. */
function seededShuffle<T>(array: T[], rand: () => number): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
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
 * Build a list of suggested tracks: seed Last.fm with a daily-randomized sample
 * of the user's liked songs, then resolve a random subset of the similar tracks
 * back to playable Spotify tracks, dropping anything already liked or duplicated.
 * All randomness is seeded from the date, so the suggestions stay stable within
 * a day but change every day instead of always returning the same top matches.
 */
export async function fetchSuggestions(token: string, likedTracks: Track[]): Promise<Track[]> {
    if (!token || !LASTFM_API_KEY || likedTracks.length === 0) return [];

    const likedIds = new Set(likedTracks.map((t) => t.id));
    const rand = mulberry32(dailySeed());

    // 1. Seed with a daily-randomized sample of liked songs.
    const seeds = seededShuffle(likedTracks, rand).slice(0, SEED_COUNT);

    // 2. Gather a larger pool of similar tracks for each seed from Last.fm.
    const similarLists = await Promise.all(
        seeds.map((seed) => {
            const artist = seed.artists?.[0]?.name;
            if (!artist || !seed.name) return Promise.resolve<LastfmTrack[]>([]);
            return getSimilarTracks(artist, seed.name);
        })
    );

    // 3. Flatten and dedupe candidates by "artist - title".
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

    // 4. Shuffle the candidates so we don't always resolve Last.fm's top
    //    matches, then resolve a random subset back to Spotify tracks.
    const resolved = await Promise.all(
        seededShuffle(candidates, rand)
            .slice(0, RESOLVE_POOL)
            .map((c) => resolveOnSpotify(token, c.artist, c.name))
    );

    // 5. Drop misses, already-liked songs, and duplicates.
    const byId = new Map<string, Track>();
    for (const track of resolved) {
        if (!track || likedIds.has(track.id) || byId.has(track.id)) continue;
        byId.set(track.id, { ...track, __suggested: true });
    }

    return Array.from(byId.values()).slice(0, MAX_SUGGESTIONS);
}
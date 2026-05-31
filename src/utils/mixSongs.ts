import { Track } from "../types";

/** Interleave suggestions into the liked songs (one suggestion every `every` tracks). */
export function mixSongs(liked: Track[], suggested: Track[], every = 3): Track[] {
    const mixed: Track[] = [];
    let s = 0;
    liked.forEach((track, i) => {
        mixed.push(track);
        if ((i + 1) % every === 0 && s < suggested.length) {
            mixed.push(suggested[s++]);
        }
    });
    while (s < suggested.length) mixed.push(suggested[s++]);
    return mixed;
}

import { Track } from "../types";

/** Interleave suggestions into the liked songs (default: 2 suggestions per 3 liked, ~2 in 5). */
export function mixSongs(liked: Track[], suggested: Track[], every = 3, count = 2): Track[] {
    const mixed: Track[] = [];
    let s = 0;
    liked.forEach((track, i) => {
        mixed.push(track);
        if ((i + 1) % every === 0) {
            for (let k = 0; k < count && s < suggested.length; k++) {
                mixed.push(suggested[s++]);
            }
        }
    });
    while (s < suggested.length) mixed.push(suggested[s++]);
    return mixed;
}

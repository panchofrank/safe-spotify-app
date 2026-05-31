import { mixSongs } from './mixSongs';
import { Track } from '../types';

const track = (id: string, suggested = false): Track => ({
    id,
    uri: `spotify:track:${id}`,
    name: id,
    artists: [],
    album: { images: [] },
    ...(suggested ? { __suggested: true } : {}),
});

test('interleaves one suggestion after every 3 liked songs', () => {
    const liked = ['l0', 'l1', 'l2', 'l3', 'l4', 'l5'].map((id) => track(id));
    const suggested = ['s0', 's1'].map((id) => track(id, true));

    const ids = mixSongs(liked, suggested).map((t) => t.id);

    expect(ids).toEqual(['l0', 'l1', 'l2', 's0', 'l3', 'l4', 'l5', 's1']);
});

test('returns liked songs unchanged when there are no suggestions', () => {
    const liked = ['a', 'b'].map((id) => track(id));
    expect(mixSongs(liked, [])).toEqual(liked);
});

test('appends leftover suggestions after the liked songs', () => {
    const liked = [track('a'), track('b')];
    const suggested = [track('s0', true), track('s1', true)];

    const ids = mixSongs(liked, suggested).map((t) => t.id);

    expect(ids).toEqual(['a', 'b', 's0', 's1']);
});

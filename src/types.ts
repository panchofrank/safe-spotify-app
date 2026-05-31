export interface Artist {
    name: string;
}

export interface AlbumImage {
    url: string;
}

export interface Album {
    images: AlbumImage[];
}

export interface Track {
    id: string;
    uri: string;
    name: string;
    artists: Artist[];
    album: Album;
    /** Set on tracks surfaced as Last.fm suggestions rather than liked songs. */
    __suggested?: boolean;
}

import React, { useEffect, useState } from 'react';

type CurrentTrackProps = {
    currentTrack: any;
    isPaused: boolean;
    isLiked: boolean;
    restartTrack: () => void;
    previousTrack: () => void;
    nextTrack: () => void;
    togglePlay: () => void;
    likeTrack: () => void;
    unlikeTrack: () => void;
};

// 0 = not removing, 1 = first check, 2 = "are you sure?" check.
type UnlikeStage = 0 | 1 | 2;


const CurrentTrack: React.FC<CurrentTrackProps> = ({ currentTrack, isPaused, isLiked, restartTrack,
                                                       previousTrack, nextTrack, togglePlay, likeTrack, unlikeTrack }) => {

    const [unlikeStage, setUnlikeStage] = useState<UnlikeStage>(0);

    // Always default back to keeping the song: reset when the track changes.
    useEffect(() => setUnlikeStage(0), [currentTrack?.id]);

    const keepSong = () => setUnlikeStage(0);

    return (
        currentTrack && (<div style={{marginBottom: 20}}>
        <img
            src={currentTrack.album.images[0]?.url}
            alt="album"
            width={200}
        />
        <div>
            <strong>{currentTrack.name}</strong>
            <div>
                {currentTrack.artists.map((a: any) => a.name).join(", ")}
            </div>
            <div className="like-status">
                {isLiked ? "💚 Liked" : "🤍 Not liked yet"}
            </div>
        </div>
        <div style={{marginTop: 10}}>
            <button className="fun-btn fun-btn--restart" onClick={restartTrack}>⏮ Restart</button>
            <button className="fun-btn fun-btn--play fun-btn--big" onClick={togglePlay}>
                {isPaused ? "▶️ Play" : "⏸️ Pause"}
            </button>
            <button className="fun-btn fun-btn--nav" onClick={previousTrack}>⏪ Previous</button>
            <button className="fun-btn fun-btn--nav" onClick={nextTrack}>Next ⏩</button>
            {!isLiked && (
                <button className="fun-btn fun-btn--like" onClick={likeTrack}>💚 Like</button>
            )}
            {isLiked && unlikeStage === 0 && (
                <button className="fun-btn fun-btn--unlike" onClick={() => setUnlikeStage(1)}>
                    💔 Unlike
                </button>
            )}
        </div>

        {unlikeStage === 1 && (
            <div className="confirm-box">
                <p className="confirm-text">💔 Take this song out of your favourites?</p>
                <div>
                    <button className="fun-btn fun-btn--keep fun-btn--big" onClick={keepSong}>
                        💚 No, keep it!
                    </button>
                    <button className="fun-btn fun-btn--danger" onClick={() => setUnlikeStage(2)}>
                        Remove it
                    </button>
                </div>
            </div>
        )}

        {unlikeStage === 2 && (
            <div className="confirm-box">
                <p className="confirm-text">🤔 Are you really, really sure?</p>
                <div>
                    <button className="fun-btn fun-btn--keep fun-btn--big" onClick={keepSong}>
                        💚 No, keep it!
                    </button>
                    <button
                        className="fun-btn fun-btn--danger"
                        onClick={() => {
                            unlikeTrack();
                            setUnlikeStage(0);
                        }}
                    >
                        Yes, remove it
                    </button>
                </div>
            </div>
        )}
    </div>)
    );
};

export default CurrentTrack;

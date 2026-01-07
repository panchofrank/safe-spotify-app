import React from 'react';

type CurrentTrackProps = {
    currentTrack: any;
    isPaused: boolean;
    restartTrack: () => void;
    previousTrack: () => void;
    nextTrack: () => void;
    togglePlay: () => void;
    likeTrack: () => void;
};


const CurrentTrack: React.FC<CurrentTrackProps> = ({ currentTrack, isPaused, restartTrack,
                                                       previousTrack, nextTrack, togglePlay, likeTrack }) => {


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
        </div>
        <div style={{marginTop: 10}}>
            <button onClick={restartTrack}>⏮ Restart</button>
            <button onClick={togglePlay}>{isPaused ? "▶ Play" : "⏸ Pause"}</button>
            <button onClick={previousTrack}>⏪ Previous</button>
            <button onClick={nextTrack}>⏩ Next</button>
            <button onClick={likeTrack}>Like</button>
        </div>
    </div>)
    );
};

export default CurrentTrack;
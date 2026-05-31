import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CurrentTrack from './CurrentTrack';

const noop = () => {};

const sampleTrack = {
    name: 'Yellow Submarine',
    artists: [{ name: 'The Beatles' }],
    album: { images: [{ url: 'http://example.com/cover.jpg' }] },
};

const baseProps = {
    isPaused: true,
    isLiked: true,
    restartTrack: noop,
    previousTrack: noop,
    nextTrack: noop,
    togglePlay: noop,
    likeTrack: noop,
    unlikeTrack: noop,
};

test('renders nothing when there is no current track', () => {
    const { container } = render(<CurrentTrack {...baseProps} currentTrack={null} />);
    expect(container).toBeEmptyDOMElement();
});

test('shows the current track name and artist', () => {
    render(<CurrentTrack {...baseProps} currentTrack={sampleTrack} />);
    expect(screen.getByText('Yellow Submarine')).toBeInTheDocument();
    expect(screen.getByText('The Beatles')).toBeInTheDocument();
});

test('shows Play when paused and fires togglePlay on click', async () => {
    const togglePlay = jest.fn();
    render(<CurrentTrack {...baseProps} togglePlay={togglePlay} currentTrack={sampleTrack} />);

    const playButton = screen.getByRole('button', { name: /Play/i });
    await userEvent.click(playButton);

    expect(togglePlay).toHaveBeenCalledTimes(1);
});

test('shows the Like button and "not liked" status when the song is not liked', () => {
    render(<CurrentTrack {...baseProps} isLiked={false} currentTrack={sampleTrack} />);
    expect(screen.getByRole('button', { name: /Like/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Unlike/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Not liked yet/i)).toBeInTheDocument();
});

test('hides the Like button and shows "liked" status when the song is liked', () => {
    render(<CurrentTrack {...baseProps} isLiked={true} currentTrack={sampleTrack} />);
    expect(screen.queryByRole('button', { name: /^💚 Like$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unlike/i })).toBeInTheDocument();
    expect(screen.getByText(/💚 Liked/i)).toBeInTheDocument();
});

test('unlike needs two confirmations before firing', async () => {
    const unlikeTrack = jest.fn();
    render(<CurrentTrack {...baseProps} unlikeTrack={unlikeTrack} currentTrack={sampleTrack} />);

    // Stage 1
    await userEvent.click(screen.getByRole('button', { name: /Unlike/i }));
    expect(unlikeTrack).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /Remove it/i }));
    expect(unlikeTrack).not.toHaveBeenCalled();

    // Stage 2 ("are you really sure?")
    expect(screen.getByText(/really, really sure/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Yes, remove it/i }));
    expect(unlikeTrack).toHaveBeenCalledTimes(1);
});

test('keeping the song at either stage does not fire unlike', async () => {
    const unlikeTrack = jest.fn();
    render(<CurrentTrack {...baseProps} unlikeTrack={unlikeTrack} currentTrack={sampleTrack} />);

    // Back out at the first stage.
    await userEvent.click(screen.getByRole('button', { name: /Unlike/i }));
    await userEvent.click(screen.getByRole('button', { name: /No, keep it/i }));
    expect(screen.getByRole('button', { name: /Unlike/i })).toBeInTheDocument();

    // Back out at the second stage.
    await userEvent.click(screen.getByRole('button', { name: /Unlike/i }));
    await userEvent.click(screen.getByRole('button', { name: /Remove it/i }));
    await userEvent.click(screen.getByRole('button', { name: /No, keep it/i }));

    expect(unlikeTrack).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Unlike/i })).toBeInTheDocument();
});

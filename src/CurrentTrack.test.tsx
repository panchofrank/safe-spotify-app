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
    restartTrack: noop,
    previousTrack: noop,
    nextTrack: noop,
    togglePlay: noop,
    likeTrack: noop,
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

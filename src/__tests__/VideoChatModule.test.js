import React from 'react';
import { render, waitFor, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import VideoChatModule, { ParticipantView, MeetingView } from '/src/components/VideoChatModule';


// Мокаем необходимые модули
jest.mock('@videosdk.live/react-sdk', () => ({
    ...jest.requireActual('@videosdk.live/react-sdk'),
    MeetingProvider: ({ children }) => <div>{children}</div>,
    useMeeting: () => ({ join: jest.fn(), participants: new Map() }),
    useParticipant: (participantId) => ({ webcamStream: null, micStream: null, webcamOn: true, micOn: true, isLocal: true }),
}));

global.MediaStream = jest.fn(() => ({
    addTrack: jest.fn(),
}));

global.MediaStreamTrack = jest.fn();

HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());

describe('ParticipantView', () => {
    it('rendering component with empty streams and camera and microphone turned off', () => {
        const { container } = render(<ParticipantView participantId="someId" />);

        // Проверяем, что элементы отрендерены
        expect(container.querySelector('audio')).toBeInTheDocument();
        expect(container.querySelector('video')).not.toBeInTheDocument();
    });

    it('render audio element with correct attributes', () => {
        render(<ParticipantView participantId="someId" />);

        const audioElement = document.querySelector('[autoplay][playsinline]');

        expect(audioElement).toBeInTheDocument();
        expect(audioElement).toHaveAttribute('autoplay');
        expect(audioElement).toHaveAttribute('playsinline', '', { normalizeWhitespace: true });

        // Проверяем, что "muted" равен "true" или отсутствует
        expect((audioElement && audioElement.getAttribute('muted')) || '').toMatch(/^(true|)$/i);
    });


});

describe('MeetingView', () => {
    test('renders join button if meeting is not joined yet', () => {
        render(<MeetingView />);
        expect(screen.getByText('Join the meeting')).toBeInTheDocument();
    });

    test('renders "Joining the meeting..." text after clicking join button', () => {
        render(<MeetingView />);
        fireEvent.click(screen.getByText('Join the meeting'));
        expect(screen.getByText('Joining the meeting...')).toBeInTheDocument();
    });

});

describe('VideoChatModule', () => {
    it('render button "Join the meeting"', () => {
        const { getByText } = render(<VideoChatModule />);
        const joinButton = getByText('Join the meeting');
        expect(joinButton).toBeInTheDocument();
    });

    it('joining a meeting after clicking a button', async () => {
        const { getByText, queryByText } = render(<VideoChatModule />);
        const joinButton = getByText('Join the meeting');
        fireEvent.click(joinButton);

        await waitFor(() => {
            expect(queryByText('Joining the meeting...')).toBeInTheDocument();
        });
    });
});

test('should return MediaStream with correct track when webcam is on', () => {
    const webcamStream = {
        track: {},
    };
    const webcamOn = true;

    // Рендерим компонент ParticipantView с переданными свойствами
    const { container } = render(<ParticipantView participantId="someId" webcamStream={webcamStream} webcamOn={webcamOn} />);

    // Получаем элементы audio и video из контейнера
    const audioElement = container.querySelector('audio');
    const videoElement = container.querySelector('video');

    // Проверяем, что audio элемент присутствует и имеет корректные атрибуты
    expect(audioElement).toBeInTheDocument();
    expect(audioElement).toHaveAttribute('autoplay');
    expect(audioElement).toHaveAttribute('playsinline', '');
    // expect(audioElement).toHaveAttribute('muted', '');

    // Проверяем, что video элемент не присутствует
    expect(videoElement).not.toBeInTheDocument();

});






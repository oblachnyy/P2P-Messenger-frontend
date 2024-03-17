import React, {useEffect, useMemo, useRef, useState} from "react";
import {MeetingProvider, useMeeting, useParticipant} from "@videosdk.live/react-sdk";
import ReactPlayer from "react-player";

export const ParticipantView = ({participantId}) => {
    const micRef = useRef(null);
    const {webcamStream, micStream, webcamOn, micOn, isLocal} = useParticipant(participantId);

    const videoStream = useMemo(() => {
        if (webcamOn && webcamStream) {
            const mediaStream = new MediaStream();
            mediaStream.addTrack(webcamStream.track);
            return mediaStream;
        }
    }, [webcamStream, webcamOn]);

    useEffect(() => {
        if (micRef.current && micOn && micStream) {
            const mediaStream = new MediaStream();
            mediaStream.addTrack(micStream.track);

            micRef.current.srcObject = mediaStream;

            // Check if micRef.current.play is defined before calling it
            if (micRef.current.play) {
                micRef.current.play().then(() => {
                    // Playback successful
                }).catch((error) => {
                    console.error("micRef.current.play() failed", error);
                });
            }
        } else {
            micRef.current.srcObject = null;
        }
    }, [micStream, micOn]);

    return (
        <div className="participant-view">
            <audio ref={micRef} autoPlay playsInline muted={isLocal}/>
            {webcamOn && (
                <ReactPlayer
                    playsinline // very very imp prop
                    pip={false}
                    light={false}
                    controls={false}
                    muted={true}
                    playing={true}
                    url={videoStream}
                    height={"300px"}
                    width={"300px"}
                    onError={(err) => {
                        console.log(err, "participant video error");
                    }}
                />
            )}
        </div>
    );
};

export const MeetingView = () => {
    const [joined, setJoined] = useState(null);
    const {join, participants} = useMeeting({
        onMeetingJoined: () => {
            setJoined("JOINED");
        },
    });

    const joinMeeting = () => {
        setJoined("JOINING");
        join();
    };

    return (
        <div className="container">
            {joined && joined === "JOINED" ? (
                <div>
                    {[...participants.keys()].map((participantId) => (
                        <ParticipantView participantId={participantId} key={participantId}/>
                    ))}
                </div>
            ) : joined && joined === "JOINING" ? (
                <p>Joining the meeting...</p>
            ) : (
                <button onClick={joinMeeting}>Join the meeting</button>
            )}
        </div>
    );
};

const VideoChatModule = () => {
    return (
        <MeetingProvider
            config={{
                meetingId: "1qbt-htil-srye",
                micEnabled: true,
                webcamEnabled: true,
                name: "Глеб's Org",
            }}
            token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI1ZDZlOTUxMS0yNWY0LTRjOTYtYWZjZi0wZmQ2MjA0YjlhMWYiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTY5NjExNjY1MiwiZXhwIjoxNzI3NjUyNjUyfQ.MMIBc0HE1h6Man0xptSQB-3i10twkK3TGs6h6cQPCik"
        >
            <MeetingView/>
        </MeetingProvider>
    );
};

export default VideoChatModule;

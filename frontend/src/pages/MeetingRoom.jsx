import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles'; // Imports the default LiveKit styles
import { fetchLiveKitToken } from '../api/roomService';
import toast from 'react-hot-toast';

export default function MeetingRoom() {
    // Extract the room ID from the URL (e.g., /room/project-sync)
    const { id: roomName } = useParams();
    const navigate = useNavigate();

    const [connectionDetails, setConnectionDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Prevent fetching if no room name exists
        if (!roomName) return;

        let mounted = true;

        const getToken = async () => {
            try {
                const details = await fetchLiveKitToken(roomName);
                if (mounted) {
                    setConnectionDetails(details);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.message);
                    toast.error(`Connection failed: ${err.message}`);
                }
            }
        };

        getToken();

        return () => {
            mounted = false; // Cleanup to prevent state updates if component unmounts
        };
    }, [roomName]);

    const handleDisconnected = () => {
        toast.success('Left the meeting');
        navigate('/'); // Send user back to dashboard when they hang up
    };

    // 1. Loading State
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] text-red-500">
                Error: {error}
            </div>
        );
    }

    if (!connectionDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
                Connecting to secure room...
            </div>
        );
    }

    // 2. The Active Room
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300 flex flex-col font-sans pt-16">

            {/* LiveKit Context Provider */}
            <LiveKitRoom
                video={true} // Automatically request camera permissions
                audio={true} // Automatically request mic permissions
                token={connectionDetails.token}
                serverUrl={connectionDetails.livekitUrl}
                onDisconnected={handleDisconnected}
                // Use LiveKit's default beautifully styled conference layout for V1
                className="flex-1 flex flex-col"
            >
                {/* Top Header Customization */}
                <header className="px-6 py-4 flex justify-between items-center absolute top-0 w-full z-10 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                    <h1 className="text-xl font-semibold text-white drop-shadow-md">
                        Room: {roomName}
                    </h1>
                </header>

                {/* VideoConference automatically handles the adaptive grid, 
          active speaker highlighting, and bottom control bar!
        */}
                <VideoConference />

                {/* Invisible component that plays remote audio */}
                <RoomAudioRenderer />

            </LiveKitRoom>
        </div>
    );
}
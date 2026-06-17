import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useTracks,
    useLocalParticipant,
    useChat,
    useRoomContext,
    VideoTrack
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import {
    Mic, MicOff, Video, VideoOff, MonitorUp,
    Phone, Settings, MessageSquare, Share2, User, X, Send
} from 'lucide-react';
import { fetchLiveKitToken } from '../api/roomService';
import toast from 'react-hot-toast';

export default function MeetingRoom() {
    const { id: roomName } = useParams();
    const navigate = useNavigate();
    const [connectionDetails, setConnectionDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!roomName) return;
        let mounted = true;

        const getToken = async () => {
            try {
                const details = await fetchLiveKitToken(roomName);
                if (mounted) setConnectionDetails(details);
            } catch (err) {
                if (mounted) {
                    setError(err.message);
                    toast.error(`Connection failed: ${err.message}`);
                }
            }
        };

        getToken();
        return () => { mounted = false; };
    }, [roomName]);

    if (error) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] text-red-500 transition-colors duration-300">Error: {error}</div>;
    }

    if (!connectionDetails) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] text-gray-500 dark:text-gray-400 transition-colors duration-300">Establishing secure organizational RTC layer...</div>;
    }

    return (
        <div className="h-screen w-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-200 flex flex-col pt-16 font-sans select-none overflow-hidden transition-colors duration-300">
            <LiveKitRoom
                token={connectionDetails.token}
                serverUrl={connectionDetails.livekitUrl}
                connect={true}
                video={true}
                audio={true}
                onDisconnected={() => {
                    toast.success('Disconnected from room');
                    navigate('/');
                }}
                className="flex-1 flex flex-col relative min-h-0 overflow-hidden"
            >
                <ActiveRoomContent roomName={roomName} />
                <RoomAudioRenderer />
            </LiveKitRoom>
        </div>
    );
}

function ActiveRoomContent({ roomName }) {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [newName, setNewName] = useState('');

    const trackReferences = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false }
        ],
        { onlySubscribed: false }
    );

    const isMicOn = localParticipant?.isMicrophoneEnabled;
    const isCameraOn = localParticipant?.isCameraEnabled;
    const isScreenSharing = localParticipant?.isScreenShareEnabled;

    const handleShareLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Meeting link copied to clipboard!');
    };

    const handleUpdateName = (e) => {
        e.preventDefault();
        if (!newName.trim() || !localParticipant) return;

        localParticipant.setName(newName.trim())
            .then(() => {
                setIsSettingsOpen(false);
                toast.success(`Identity updated to: ${newName}`);
            })
            .catch((err) => toast.error(`Failed to update name: ${err.message}`));
    };

    return (
        /* Enforce an explicit container height calculation subtracting top layout boundaries */
        <div className="h-[calc(100vh-4rem)] flex flex-col relative w-full p-2 md:p-3 pb-24 md:pb-26 overflow-hidden min-h-0">

            {/* Top Header Controls */}
            <header className="w-full flex justify-between items-center mb-3 z-10 shrink-0 px-1">
                <h1 className="text-base md:text-lg font-semibold tracking-tight text-gray-900 dark:text-white/90">
                    {roomName}
                </h1>

                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={handleShareLink}
                        className="p-2 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 border border-transparent dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Share2 size={16} />
                    </button>

                    <button
                        onClick={() => {
                            setIsSettingsOpen(!isSettingsOpen);
                            if (localParticipant) setNewName(localParticipant.name || '');
                        }}
                        className={`p-2 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 border border-transparent dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all cursor-pointer ${isSettingsOpen ? 'ring-2 ring-cyan-500' : ''}`}
                    >
                        <Settings size={16} />
                    </button>

                    {isSettingsOpen && (
                        <div className="absolute right-0 top-11 w-64 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-xl dark:shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Room Settings</h3>
                            <form onSubmit={handleUpdateName} className="space-y-3">
                                <div>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        placeholder="Enter new name"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium py-2 rounded-lg transition-colors cursor-pointer">
                                    Save Changes
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Layout Ecosystem */}
            <div className="flex-1 flex gap-2 md:gap-3 overflow-hidden relative min-h-0 h-full">

                {/* The Video Grid */}
                <main className="flex-1 flex items-center justify-center w-full h-full overflow-y-auto min-h-0">
                    <div className="w-full max-w-7xl grid gap-2 md:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr items-center justify-center">
                        {trackReferences.map((trackRef) => {
                            const { participant, source } = trackRef;
                            const isSpeaking = participant.isSpeaking;

                            const isCamera = source === Track.Source.Camera;
                            const isScreenShare = source === Track.Source.ScreenShare;
                            const hasActiveVideo = (isCamera && participant.isCameraEnabled) || isScreenShare;

                            return (
                                <div
                                    key={`${participant.identity}-${source}`}
                                    className={`relative aspect-video w-full rounded-xl overflow-hidden bg-gray-200 dark:bg-[#111] transition-all duration-300 group flex items-center justify-center border ${isSpeaking ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.2)] scale-[1.005] z-10' : 'border-gray-300 dark:border-white/5'
                                        }`}
                                >
                                    {hasActiveVideo ? (
                                        <VideoTrack
                                            trackRef={trackRef}
                                            className={`w-full h-full ${isScreenShare ? 'object-contain bg-white dark:bg-black' : 'object-cover'}`}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-gray-300 dark:bg-white/5 rounded-full border border-gray-400 dark:border-white/10 text-gray-500 transition-transform duration-500 group-hover:scale-105">
                                                <User size={28} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute bottom-2.5 left-2.5 bg-white/80 dark:bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-gray-200 dark:border-white/5 flex items-center gap-2 max-w-[85%] shadow-sm">
                                        <span className="text-[11px] font-medium text-gray-900 dark:text-white/90 truncate">
                                            {participant.name || participant.identity}
                                            {participant.isLocal && " (You)"}
                                        </span>
                                    </div>

                                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                        {!participant.isMicrophoneEnabled && (
                                            <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 backdrop-blur-md p-1.5 rounded-lg text-red-500 dark:text-red-400 shadow-sm">
                                                <MicOff size={11} />
                                            </div>
                                        )}
                                        {isScreenShare && (
                                            <div className="bg-cyan-50 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 backdrop-blur-md p-1 rounded-lg text-cyan-600 dark:text-cyan-400 text-[9px] font-semibold uppercase tracking-wider px-2 shadow-sm">
                                                Screen Share
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>

                {/* Chat Drawer Layout Fixes */}
                {isChatOpen && (
                    <aside className="absolute inset-0 z-30 sm:relative sm:inset-auto w-full sm:w-76 h-full min-h-0 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 sm:rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200 shadow-2xl sm:shadow-none">
                        <div className="p-3.5 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-[#1a1a1a] sm:rounded-t-2xl shrink-0">
                            <h2 className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <MessageSquare size={14} className="text-cyan-500 dark:text-cyan-400" /> Meeting Chat
                            </h2>
                            <button onClick={() => setIsChatOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"><X size={16} /></button>
                        </div>

                        {/* Keeps scrollbar contained entirely inside the panel */}
                        <div className="flex-1 min-h-0 h-full overflow-hidden">
                            <ChatMessages />
                        </div>
                    </aside>
                )}
            </div>

            {/* Control Bar Architecture */}
            <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-[#121212]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 px-4 sm:px-5 py-2 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-between gap-4 sm:gap-6 z-40 w-[92vw] sm:w-fit max-w-sm sm:max-w-none transition-colors duration-300">

                {/* Left Elements (Sized Up to 22) */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                    <ControlActionButton
                        icon={isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
                        label={isMicOn ? "Mute" : "Unmute"}
                        isActive={isMicOn}
                        type="av"
                        onClick={() => localParticipant?.setMicrophoneEnabled(!isMicOn)}
                    />
                    <ControlActionButton
                        icon={isCameraOn ? <Video size={22} /> : <VideoOff size={22} />}
                        label={isCameraOn ? "Stop Cam" : "Start Cam"}
                        isActive={isCameraOn}
                        type="av"
                        onClick={() => localParticipant?.setCameraEnabled(!isCameraOn)}
                    />
                </div>

                {/* Center Element: Simple End Call Handset */}
                <div className="px-1 sm:px-2">
                    <button
                        onClick={() => room.disconnect()}
                        className="flex items-center justify-center p-2.5 sm:p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all group cursor-pointer shadow-md shadow-red-500/10"
                        title="End Call"
                    >
                        <div className="transition-transform group-hover:scale-105">
                            <Phone size={20} className="rotate-[135deg]" />
                        </div>
                    </button>
                </div>

                {/* Right Elements (Sized Up to 22) */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                    <ControlActionButton
                        icon={<MonitorUp size={22} />}
                        label="Share"
                        isActive={isScreenSharing}
                        type="feature"
                        onClick={() => localParticipant?.setScreenShareEnabled(!isScreenSharing)}
                    />
                    <ControlActionButton
                        icon={<MessageSquare size={22} />}
                        label="Chat"
                        isActive={isChatOpen}
                        type="feature"
                        onClick={() => setIsChatOpen(!isChatOpen)}
                    />
                </div>

            </footer>
        </div>
    );
}

function ChatMessages() {
    const { chatMessages, send } = useChat();
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (message.trim()) {
            send(message);
            setMessage('');
        }
    };

    return (
        <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
            {/* Scrollable Feed container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-gray-400 dark:text-gray-500 text-center px-4">
                        No messages yet.
                    </div>
                ) : (
                    chatMessages.map((msg) => (
                        <div key={msg.id} className="flex flex-col">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-0.5 px-0.5">
                                {msg.from?.name || msg.from?.identity} <span className="opacity-40 ml-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                            <div className="bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 rounded-xl rounded-tl-none px-2.5 py-1.5 text-sm text-gray-800 dark:text-gray-200 inline-block w-fit max-w-full break-words shadow-sm">
                                {msg.message}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Fixed input container */}
            <form onSubmit={handleSend} className="p-2 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1a1a1a] shrink-0">
                <div className="flex items-center gap-2 bg-white dark:bg-[#222] border border-gray-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-cyan-500 transition-colors shadow-sm">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <button type="submit" disabled={!message.trim()} className="text-cyan-600 dark:text-cyan-500 disabled:text-gray-300 dark:disabled:text-gray-700 transition-colors cursor-pointer shrink-0">
                        <Send size={14} />
                    </button>
                </div>
            </form>
        </div>
    );
}

function ControlActionButton({ icon, label, onClick, isActive, type }) {
    let stateClass = '';
    let iconClass = '';

    if (type === 'av') {
        stateClass = isActive
            ? 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            : 'bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400';
        iconClass = isActive ? '' : 'text-red-600 dark:text-red-400';
    } else {
        stateClass = isActive
            ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400'
            : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white';
        iconClass = isActive ? 'text-cyan-700 dark:text-cyan-400' : '';
    }

    return (
        <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer group ${stateClass} shrink-0`}>
            <div className={`p-1 rounded-lg transition-transform group-hover:scale-105 ${iconClass}`}>
                {icon}
            </div>
            <span className="text-[9px] font-medium tracking-wide opacity-80">{label}</span>
        </button>
    );
}
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LiveKitRoom, RoomAudioRenderer, useTracks,
    useLocalParticipant, useChat, useRoomContext, VideoTrack, useParticipants
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import {
    Mic, MicOff, Video, VideoOff, MonitorUp, Phone, Settings,
    MessageSquare, Share2, User, X, Send, ChevronLeft, ChevronRight, Sun, Moon, Users
} from 'lucide-react';
import { fetchLiveKitToken } from '../api/roomService';
import useThemeStore from '../store/useThemeStore';
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

    if (error) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] text-red-500 transition-colors duration-300">Error: {error}</div>;
    if (!connectionDetails) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] text-gray-500 dark:text-gray-400 transition-colors duration-300">Establishing secure organizational RTC layer...</div>;

    return (
        <div className="h-screen w-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-200 flex flex-col font-sans select-none overflow-hidden transition-colors duration-300">

            <style>
                {`
          @keyframes speaker-vibrate {
            0% { transform: scale(1); box-shadow: 0 0 5px rgba(34,211,238,0.4); border-width: 1px; }
            25% { transform: scale(1.005); box-shadow: 0 0 20px rgba(34,211,238,0.8); border-width: 3px; }
            50% { transform: scale(1); box-shadow: 0 0 10px rgba(34,211,238,0.6); border-width: 2px; }
            75% { transform: scale(1.01); box-shadow: 0 0 25px rgba(34,211,238,1); border-width: 4px; }
            100% { transform: scale(1); box-shadow: 0 0 5px rgba(34,211,238,0.4); border-width: 1px; }
          }
          .speaker-ring {
            animation: speaker-vibrate 0.4s infinite ease-in-out;
            border-color: #22d3ee;
            z-index: 20;
          }
        `}
            </style>

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
    const { theme, toggleTheme } = useThemeStore();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Manage which sidebar is active: 'chat', 'participants', or null
    const [activeSidebar, setActiveSidebar] = useState(null);

    const [newName, setNewName] = useState('');
    const [speakerQueue, setSpeakerQueue] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const trackReferences = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false }
        ],
        { onlySubscribed: false }
    );

    const screenShares = trackReferences.filter(t => t.source === Track.Source.ScreenShare);
    const cameras = trackReferences.filter(t => t.source === Track.Source.Camera);

    const currentlySpeakingIds = cameras
        .filter(t => t.participant.isSpeaking)
        .map(t => t.participant.identity);

    useEffect(() => {
        if (currentlySpeakingIds.length > 0) {
            setSpeakerQueue(prevQueue => {
                let newQueue = [...prevQueue];
                currentlySpeakingIds.forEach(id => {
                    newQueue = newQueue.filter(existingId => existingId !== id);
                    newQueue.unshift(id);
                });
                return newQueue;
            });
        }
    }, [JSON.stringify(currentlySpeakingIds)]);

    const orderedCameras = [...cameras].sort((a, b) => {
        const indexA = speakerQueue.indexOf(a.participant.identity);
        const indexB = speakerQueue.indexOf(b.participant.identity);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
    });

    const itemsPerPage = isMobile ? 3 : 6;
    const totalPages = Math.ceil(orderedCameras.length / itemsPerPage) || 1;

    useEffect(() => {
        if (currentPage >= totalPages) setCurrentPage(Math.max(0, totalPages - 1));
    }, [totalPages, currentPage]);

    const currentCameras = orderedCameras.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
    const hasScreenShare = screenShares.length > 0;

    const getGridClasses = (count) => {
        if (isMobile) {
            if (count === 1) return 'grid-cols-1 grid-rows-1';
            if (count === 2) return 'grid-cols-1 grid-rows-2';
            return 'grid-cols-1 grid-rows-3';
        } else {
            if (count === 1) return 'grid-cols-1 grid-rows-1';
            if (count === 2) return 'grid-cols-2 grid-rows-1';
            if (count === 3) return 'grid-cols-3 grid-rows-1';
            if (count === 4) return 'grid-cols-2 grid-rows-2';
            return 'grid-cols-3 grid-rows-2';
        }
    };

    const isMicOn = localParticipant?.isMicrophoneEnabled;
    const isCameraOn = localParticipant?.isCameraEnabled;
    const isLocalScreenSharing = localParticipant?.isScreenShareEnabled;

    const handleUpdateName = (e) => {
        e.preventDefault();
        if (!newName.trim() || !localParticipant) return;
        localParticipant.setName(newName.trim()).then(() => {
            setIsSettingsOpen(false);
            toast.success(`Identity updated to: ${newName}`);
        });
    };

    const toggleSidebar = (sidebarName) => {
        setActiveSidebar(prev => prev === sidebarName ? null : sidebarName);
    };
    const participants = useParticipants();
    return (
        <div className="flex-1 flex flex-col relative w-full p-2 md:p-3 pb-24 md:pb-26 overflow-hidden min-h-0">

            {/* Top Header - Z-INDEX FIXED (Elevated to z-50 to overlap sidebars) */}
            <header className="w-full flex justify-between items-center mb-3 z-50 shrink-0 px-2">
                <h1 className="text-base md:text-lg font-semibold tracking-tight text-gray-900 dark:text-white/90">
                    {roomName}
                </h1>

                <div className="flex items-center gap-2 relative">

                    <button
                        onClick={() => toggleSidebar('participants')}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${activeSidebar === 'participants' ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500' : 'bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'}`}
                        title="Participants"
                    >
                        <Users size={16} />
                    </button>

                    <button
                        onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                        className="p-2 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 rounded-xl text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
                        title="Copy Invite Link"
                    >
                        <Share2 size={16} />
                    </button>

                    <button
                        onClick={() => {
                            setIsSettingsOpen(!isSettingsOpen);
                            if (localParticipant) setNewName(localParticipant.name || '');
                        }}
                        className={`p-2 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 rounded-xl text-gray-600 dark:text-gray-300 transition-all cursor-pointer ${isSettingsOpen ? 'ring-2 ring-cyan-500' : ''}`}
                        title="Room Settings"
                    >
                        <Settings size={16} />
                    </button>

                    {isSettingsOpen && (
                        <div className="absolute right-0 top-11 w-64 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-xl dark:shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Room Settings</h3>
                            <form onSubmit={handleUpdateName} className="space-y-3">
                                <input
                                    type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                    placeholder="Enter new name"
                                />
                                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium py-2 rounded-lg transition-colors cursor-pointer">
                                    Save Name
                                </button>
                            </form>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Appearance</span>
                                <button
                                    onClick={toggleTheme}
                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                                >
                                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Layout Engine */}
            <div className="flex-1 flex gap-2 md:gap-3 overflow-hidden relative min-h-0 h-full w-full">

                {hasScreenShare ? (
                    <main className="flex-1 flex flex-col lg:flex-row gap-2 md:gap-3 overflow-hidden w-full h-full">
                        <div className="flex-1 lg:w-3/4 rounded-xl overflow-hidden bg-gray-200 dark:bg-[#111] border border-gray-300 dark:border-white/5 relative shadow-inner">
                            <VideoTrack trackRef={screenShares[0]} className="w-full h-full object-contain bg-white dark:bg-black" />
                            <div className="absolute bottom-3 left-3 bg-cyan-600/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium text-white shadow-md">
                                {screenShares[0].participant.name || screenShares[0].participant.identity}'s Screen
                            </div>
                        </div>

                        <div className="flex lg:flex-col gap-2 overflow-auto lg:w-1/4 lg:min-w-[250px] shrink-0 custom-scrollbar p-1">
                            {orderedCameras.map(trackRef => (
                                <VideoTile key={trackRef.participant.identity} trackRef={trackRef} className="h-32 sm:h-40 lg:h-48 w-48 lg:w-full shrink-0" />
                            ))}
                        </div>
                    </main>
                ) : (
                    <main className="flex-1 flex items-center justify-center w-full h-full overflow-hidden min-h-0 relative">
                        {totalPages > 1 && (
                            <button
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="absolute left-2 sm:left-4 z-30 p-2 rounded-full bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white disabled:opacity-30 hover:bg-white dark:hover:bg-black transition-all cursor-pointer shadow-lg backdrop-blur-md"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        <div className={`w-full max-w-7xl h-full grid gap-2 md:gap-3 ${getGridClasses(currentCameras.length)} items-center justify-center p-1 sm:p-4`}>
                            {currentCameras.map((trackRef, index) => (
                                <VideoTile key={trackRef.participant.identity} trackRef={trackRef} queuePosition={currentPage * itemsPerPage + index} />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage === totalPages - 1}
                                className="absolute right-2 sm:right-4 z-30 p-2 rounded-full bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white disabled:opacity-30 hover:bg-white dark:hover:bg-black transition-all cursor-pointer shadow-lg backdrop-blur-md"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}

                        {totalPages > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${currentPage === i ? 'bg-cyan-500 scale-125' : 'bg-gray-400 dark:bg-gray-600'}`} />
                                ))}
                            </div>
                        )}
                    </main>
                )}

                {/* Dynamic Sidebar Container */}
                {activeSidebar && (
                    <aside className="absolute inset-0 z-40 sm:relative sm:inset-auto w-full sm:w-80 h-full min-h-0 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 sm:rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200 shadow-2xl sm:shadow-none">
                        <div className="p-3.5 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-[#1a1a1a] sm:rounded-t-2xl shrink-0">
                            <h2 className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                {activeSidebar === 'chat' ? (
                                    <><MessageSquare size={14} className="text-cyan-500 dark:text-cyan-400" /> Meeting Chat</>
                                ) : (
                                    <><Users size={14} className="text-cyan-500 dark:text-cyan-400" /> Participants ({participants.length})</>
                                )}
                            </h2>
                            <button onClick={() => setActiveSidebar(null)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"><X size={16} /></button>
                        </div>

                        <div className="flex-1 min-h-0 h-full overflow-hidden">
                            {activeSidebar === 'chat' ? <ChatMessages /> : <ParticipantsList />}
                        </div>
                    </aside>
                )}
            </div>

            <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-[#121212]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 px-4 sm:px-5 py-2 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-between gap-4 sm:gap-6 z-50 w-[92vw] sm:w-fit max-w-sm sm:max-w-none transition-colors duration-300">
                <div className="flex items-center gap-1 sm:gap-1.5">
                    <ControlActionButton icon={isMicOn ? <Mic size={22} /> : <MicOff size={22} />} label={isMicOn ? "Mute" : "Unmute"} isActive={isMicOn} type="av" onClick={() => localParticipant?.setMicrophoneEnabled(!isMicOn)} />
                    <ControlActionButton icon={isCameraOn ? <Video size={22} /> : <VideoOff size={22} />} label={isCameraOn ? "Stop Cam" : "Start Cam"} isActive={isCameraOn} type="av" onClick={() => localParticipant?.setCameraEnabled(!isCameraOn)} />
                </div>
                <div className="px-1 sm:px-2">
                    <button onClick={() => room.disconnect()} className="flex items-center justify-center p-2.5 sm:p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all group cursor-pointer shadow-md shadow-red-500/20" title="End Call">
                        <div className="transition-transform group-hover:scale-105">
                            <Phone size={22} className="rotate-[135deg]" />
                        </div>
                    </button>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                    <ControlActionButton icon={<MonitorUp size={22} />} label="Share" isActive={isLocalScreenSharing} type="feature" onClick={() => localParticipant?.setScreenShareEnabled(!isLocalScreenSharing)} />
                    <ControlActionButton icon={<MessageSquare size={22} />} label="Chat" isActive={activeSidebar === 'chat'} type="feature" onClick={() => toggleSidebar('chat')} />
                </div>
            </footer>
        </div>
    );
}

// Reusable Video Tile Component
function VideoTile({ trackRef, className = "" }) {
    const { participant } = trackRef;
    const isSpeaking = participant.isSpeaking;
    const hasActiveVideo = participant.isCameraEnabled;

    return (
        <div className={`relative w-full h-full rounded-xl overflow-hidden bg-gray-200 dark:bg-[#111] transition-all duration-300 group flex items-center justify-center border ${isSpeaking ? 'border-transparent' : 'border-gray-300 dark:border-white/5'} ${className}`}>
            {isSpeaking && <div className="absolute inset-0 rounded-xl pointer-events-none speaker-ring"></div>}
            {hasActiveVideo ? (
                <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <div className="p-4 bg-gray-300 dark:bg-white/5 rounded-full border border-gray-400 dark:border-white/10 text-gray-500 transition-transform duration-500 group-hover:scale-105">
                        <User size={36} />
                    </div>
                </div>
            )}
            <div className="absolute bottom-2.5 left-2.5 bg-white/80 dark:bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/5 flex items-center gap-2 max-w-[85%] shadow-sm z-10">
                <span className="text-[11px] font-medium text-gray-900 dark:text-white/90 truncate">
                    {participant.name || participant.identity} {participant.isLocal && " (You)"}
                </span>
            </div>
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                {!participant.isMicrophoneEnabled && (
                    <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 backdrop-blur-md p-1.5 rounded-lg text-red-500 dark:text-red-400 shadow-sm">
                        <MicOff size={12} />
                    </div>
                )}
            </div>
        </div>
    );
}

// New Participants Sidebar Component
function ParticipantsList() {
    const participants = useParticipants(); // Fetches all active participants

    return (
        <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                {participants.map((p) => (
                    <div key={p.identity} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 truncate">
                            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-500/30">
                                <span className="text-xs font-bold uppercase">
                                    {(p.name || p.identity).charAt(0)}
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                {p.name || p.identity}
                                {p.isLocal && <span className="ml-2 text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold bg-cyan-50 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded-md">You</span>}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {p.isMicrophoneEnabled ? (
                                <Mic size={14} className="text-gray-400 dark:text-gray-500" />
                            ) : (
                                <MicOff size={14} className="text-red-500 dark:text-red-400" />
                            )}
                            {p.isCameraEnabled ? (
                                <Video size={14} className="text-gray-400 dark:text-gray-500" />
                            ) : (
                                <VideoOff size={14} className="text-red-500 dark:text-red-400" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Chat Component
function ChatMessages() {
    const { chatMessages, send } = useChat();
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [chatMessages]);

    const handleSend = (e) => { e.preventDefault(); if (message.trim()) { send(message); setMessage(''); } };

    return (
        <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 custom-scrollbar">
                {chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-gray-400 dark:text-gray-500 text-center px-4">No messages yet.</div>
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
            <form onSubmit={handleSend} className="p-2 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1a1a1a] shrink-0">
                <div className="flex items-center gap-2 bg-white dark:bg-[#222] border border-gray-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-cyan-500 transition-colors shadow-sm">
                    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-gray-500" />
                    <button type="submit" disabled={!message.trim()} className="text-cyan-600 dark:text-cyan-500 disabled:text-gray-300 dark:disabled:text-gray-700 transition-colors cursor-pointer shrink-0"><Send size={14} /></button>
                </div>
            </form>
        </div>
    );
}

// Control Bar Button
function ControlActionButton({ icon, label, onClick, isActive, type }) {
    const stateClass = type === 'av'
        ? (isActive ? 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white' : 'bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400')
        : (isActive ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white');
    const iconClass = type === 'av' ? (isActive ? '' : 'text-red-600 dark:text-red-400') : (isActive ? 'text-cyan-700 dark:text-cyan-400' : '');

    return (
        <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer group ${stateClass} shrink-0`}>
            <div className={`p-1 rounded-lg transition-transform group-hover:scale-105 ${iconClass}`}>{icon}</div>
            <span className="text-[9px] font-medium tracking-wide opacity-80">{label}</span>
        </button>
    );
}
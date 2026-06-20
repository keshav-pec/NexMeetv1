import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LiveKitRoom, RoomAudioRenderer, useTracks,
    useLocalParticipant, useChat, useRoomContext, VideoTrack, useParticipants
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import {
    Mic, MicOff, Video, VideoOff, MonitorUp, Phone, Settings,
    MessageSquare, Share2, User, X, Send, ChevronLeft, ChevronRight, Sun, Moon, Users, Lock
} from 'lucide-react';
import { fetchLiveKitToken, endMeetingOnServer } from '../api/roomService';
import useThemeStore from '../store/useThemeStore';
import toast from 'react-hot-toast';

export default function MeetingRoom() {
    const { id: roomName } = useParams();
    const navigate = useNavigate();
    const [connectionDetails, setConnectionDetails] = useState(null);
    const [error, setError] = useState(null);

    const [isLocked, setIsLocked] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [isCheckingPasscode, setIsCheckingPasscode] = useState(false);

    const attemptConnection = async (codeToTry = null) => {
        try {
            setIsCheckingPasscode(true);
            setError(null);
            const details = await fetchLiveKitToken(roomName, codeToTry);
            setConnectionDetails(details);
            setIsLocked(false);
        } catch (err) {
            if (err.isPasscodeRequired) {
                setIsLocked(true);
                if (codeToTry) toast.error(err.message);
            } else {
                setError(err.message);
                toast.error(`Connection failed: ${err.message}`);
            }
        } finally {
            setIsCheckingPasscode(false);
        }
    };

    useEffect(() => {
        if (roomName) attemptConnection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomName]);

    const handlePasscodeSubmit = (e) => {
        e.preventDefault();
        if (passcode.trim()) {
            attemptConnection(passcode.trim());
        }
    };

    if (error) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300 px-4 text-center">
            <div className="p-4 bg-red-100 dark:bg-red-500/10 rounded-full mb-4 text-red-500"><X size={32} /></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cannot Join Meeting</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-medium transition-colors">Return to Dashboard</button>
        </div>
    );

    if (isLocked) return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300 px-4">
            <div className="w-full max-w-md bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Protected Meeting</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">This room requires a 6-digit passcode to enter.</p>

                <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                    <input
                        type="text"
                        maxLength={6}
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="Enter Passcode"
                        className="w-full px-4 py-3 text-center tracking-widest text-lg bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 text-gray-900 dark:text-white transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!passcode.trim() || isCheckingPasscode}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isCheckingPasscode ? 'Verifying...' : 'Unlock & Join'}
                    </button>
                </form>
                <button onClick={() => navigate('/')} className="mt-6 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
            </div>
        </div>
    );

    if (!connectionDetails) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] text-gray-500 dark:text-gray-400 transition-colors duration-300">Verifying secure connection...</div>;

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
                <ActiveRoomContent roomName={roomName} connectionDetails={connectionDetails} />
                <RoomAudioRenderer />
            </LiveKitRoom>
        </div>
    );
}

function ActiveRoomContent({ roomName, connectionDetails }) {
    const { localParticipant } = useLocalParticipant();
    const { theme, toggleTheme } = useThemeStore();
    const participants = useParticipants();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
    
    return (
        <div className="flex-1 flex flex-col relative w-full p-2 md:p-3 pb-24 md:pb-26 overflow-hidden min-h-0">

            <header className="w-full flex justify-between items-center mb-3 z-50 shrink-0 px-2">
                <h1 className="text-base md:text-lg font-semibold tracking-tight text-gray-900 dark:text-white/90">
                    {connectionDetails?.meetingName || roomName}
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
                
                {/* Replaced standard end button with the smart dropdown component */}
                <EndCallButton roomName={roomName} />

                <div className="flex items-center gap-1 sm:gap-1.5">
                    <ControlActionButton icon={<MonitorUp size={22} />} label="Share" isActive={isLocalScreenSharing} type="feature" onClick={() => localParticipant?.setScreenShareEnabled(!isLocalScreenSharing)} />
                    <ControlActionButton icon={<MessageSquare size={22} />} label="Chat" isActive={activeSidebar === 'chat'} type="feature" onClick={() => toggleSidebar('chat')} />
                </div>
            </footer>
        </div>
    );
}

// Smart End Call Button (Checks if Host)
function EndCallButton({ roomName }) {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    const [showOptions, setShowOptions] = useState(false);

    let isHost = false;
    try {
        const meta = JSON.parse(localParticipant?.metadata || '{}');
        isHost = meta.isHost;
    } catch (e) { }

    const handleLeave = () => room.disconnect();

    const handleEndForAll = async () => {
        try {
            await endMeetingOnServer(roomName);
            room.disconnect(); 
            toast.success('Meeting ended for everyone.');
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (!isHost) {
        return (
            <div className="px-1 sm:px-2">
                <button onClick={handleLeave} className="flex items-center justify-center p-2.5 sm:p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all group cursor-pointer shadow-md shadow-red-500/20" title="Leave Meeting">
                    <div className="transition-transform group-hover:scale-105"><Phone size={22} className="rotate-[135deg]" /></div>
                </button>
            </div>
        );
    }

    return (
        <div className="px-1 sm:px-2 relative">
            {showOptions && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-in slide-in-from-bottom-2">
                    <button onClick={handleEndForAll} className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        End meeting for all
                    </button>
                    <button onClick={handleLeave} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors mt-1">
                        Leave meeting
                    </button>
                </div>
            )}
            <button onClick={() => setShowOptions(!showOptions)} className="flex items-center justify-center p-2.5 sm:p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all group cursor-pointer shadow-md shadow-red-500/20" title="Meeting Options">
                <div className="transition-transform group-hover:scale-105"><Phone size={22} className="rotate-[135deg]" /></div>
            </button>
        </div>
    );
}

// Updated Video Tile (Shows Host / You Badges)
function VideoTile({ trackRef, className = "", queuePosition }) {
    const { participant } = trackRef;
    const isSpeaking = participant.isSpeaking;
    const hasActiveVideo = participant.isCameraEnabled;

    let isHost = false;
    try {
        const meta = JSON.parse(participant.metadata || '{}');
        isHost = meta.isHost;
    } catch (e) { }

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
                <span className="text-[11px] font-medium text-gray-900 dark:text-white/90 truncate flex items-center gap-1.5">
                    {participant.name || participant.identity}
                    <div className="flex gap-1">
                        {isHost && <span className="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 px-1 rounded text-[9px] font-bold tracking-wider uppercase">Host</span>}
                        {participant.isLocal && <span className="bg-gray-200 dark:bg-white/20 text-gray-700 dark:text-gray-300 px-1 rounded text-[9px] font-bold tracking-wider uppercase">You</span>}
                    </div>
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

// Updated Participants Sidebar (Hierarchy Split)
function ParticipantsList() {
    const participants = useParticipants(); 

    const hosts = [];
    const regularParticipants = [];

    participants.forEach(p => {
        let isHost = false;
        try {
            const meta = JSON.parse(p.metadata || '{}');
            isHost = meta.isHost;
        } catch(e) {}
        
        if (isHost) hosts.push(p);
        else regularParticipants.push(p);
    });

    const ParticipantRow = ({ p, isHost }) => (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3 truncate">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isHost ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-white/20'}`}>
                    <span className="text-xs font-bold uppercase">
                        {(p.name || p.identity).charAt(0)}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate flex items-center gap-1.5">
                        {p.name || p.identity}
                        {p.isLocal && <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-500/10 px-1 rounded uppercase tracking-wider">You</span>}
                    </span>
                    {isHost && <span className="text-[10px] text-gray-500 dark:text-gray-400">Meeting Host</span>}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {p.isMicrophoneEnabled ? <Mic size={14} className="text-gray-400 dark:text-gray-500" /> : <MicOff size={14} className="text-red-500 dark:text-red-400" />}
                {p.isCameraEnabled ? <Video size={14} className="text-gray-400 dark:text-gray-500" /> : <VideoOff size={14} className="text-red-500 dark:text-red-400" />}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-4">
                {hosts.length > 0 && (
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">Host</h3>
                        <div className="space-y-1">
                            {hosts.map(p => <ParticipantRow key={p.identity} p={p} isHost={true} />)}
                        </div>
                    </div>
                )}
                {regularParticipants.length > 0 && (
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1 pt-2 border-t border-gray-200 dark:border-white/5">Participants</h3>
                        <div className="space-y-1">
                            {regularParticipants.map(p => <ParticipantRow key={p.identity} p={p} isHost={false} />)}
                        </div>
                    </div>
                )}
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
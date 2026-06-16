import { useState } from 'react';
import {
    Mic, MicOff, Video, VideoOff, MonitorUp,
    PhoneOff, Settings, MessageSquare, Users
} from 'lucide-react';

// Mock data to simulate participants before WebRTC is connected
const mockParticipants = [
    { id: 1, name: 'Alex R. (Product Lead)', isActiveSpeaker: true, isMuted: false, img: 'https://i.pravatar.cc/400?img=11' },
    { id: 2, name: 'Sarah L.', isActiveSpeaker: false, isMuted: true, img: 'https://i.pravatar.cc/400?img=5' },
    { id: 3, name: 'Mike D.', isActiveSpeaker: false, isMuted: true, img: 'https://i.pravatar.cc/400?img=12' },
    { id: 4, name: 'Emily S.', isActiveSpeaker: false, isMuted: true, img: 'https://i.pravatar.cc/400?img=9' },
    { id: 5, name: 'Liam J.', isActiveSpeaker: false, isMuted: true, img: 'https://i.pravatar.cc/400?img=13' },
    { id: 6, name: 'Fatima K.', isActiveSpeaker: false, isMuted: true, img: 'https://i.pravatar.cc/400?img=20' },
];

export default function MeetingRoom() {
    // Local state for user controls
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-200 transition-colors duration-300 flex flex-col pt-16 font-sans">

            {/* Top Header */}
            <header className="px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">
                        Project Sync - V1
                    </h1>
                </div>
                <div className="flex gap-4 items-center bg-white dark:bg-white/5 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm transition-colors">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Users size={16} />
                        <span>6</span>
                    </div>
                    <div className="w-px h-4 bg-gray-300 dark:bg-white/20"></div>
                    <div className="text-sm font-mono tracking-wider">
                        00:24:15
                    </div>
                </div>
            </header>

            {/* Video Grid Area */}
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {mockParticipants.map((participant) => (
                        <div
                            key={participant.id}
                            className={`relative aspect-video rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 transition-all duration-300 ${participant.isActiveSpeaker
                                    ? 'ring-2 ring-cyan-500 dark:ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]'
                                    : 'ring-1 ring-gray-300 dark:ring-white/10'
                                }`}
                        >
                            {/* Participant Video/Image */}
                            <img
                                src={participant.img}
                                alt={participant.name}
                                className="w-full h-full object-cover"
                            />

                            {/* Mute Icon Overlay */}
                            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md p-1.5 rounded-full text-white">
                                {participant.isMuted ? <MicOff size={16} className="text-red-400" /> : <Mic size={16} className="text-cyan-400" />}
                            </div>

                            {/* Name Tag Overlay */}
                            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium">
                                {participant.name}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Bottom Control Bar */}
            <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 px-6 py-3 rounded-2xl shadow-2xl flex gap-2 sm:gap-4 items-center transition-colors duration-300">

                <ControlButton
                    icon={isMicOn ? <Mic size={20} /> : <MicOff size={20} className="text-red-500" />}
                    label={isMicOn ? "Mute" : "Unmute"}
                    onClick={() => setIsMicOn(!isMicOn)}
                />

                <ControlButton
                    icon={isVideoOn ? <Video size={20} /> : <VideoOff size={20} className="text-red-500" />}
                    label={isVideoOn ? "Stop Video" : "Start Video"}
                    onClick={() => setIsVideoOn(!isVideoOn)}
                />

                <ControlButton
                    icon={<MonitorUp size={20} className={isScreenSharing ? "text-cyan-500" : ""} />}
                    label="Share Screen"
                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                />

                {/* End Call Button (Distinctive Red) */}
                <button className="flex flex-col items-center gap-1 min-w-[72px] mx-2 group">
                    <div className="p-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/30 transition-all group-hover:-translate-y-1">
                        <PhoneOff size={22} />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">End Call</span>
                </button>

                <div className="w-px h-10 bg-gray-200 dark:bg-white/10 mx-1"></div>

                <ControlButton icon={<Settings size={20} />} label="Settings" />
                <ControlButton icon={<MessageSquare size={20} />} label="Chat" hasBadge />
                <ControlButton icon={<Users size={20} />} label="Participants" />

            </footer>
        </div>
    );
}

// Reusable Sub-component for Control Bar Buttons
function ControlButton({ icon, label, onClick, hasBadge }) {
    return (
        <button
            onClick={onClick}
            className="relative flex flex-col items-center gap-1 min-w-[72px] p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all group"
        >
            <div className="p-2 transition-transform group-hover:-translate-y-1">
                {icon}
            </div>
            <span className="text-[10px] font-medium opacity-80">{label}</span>

            {/* Notification Badge (e.g., for unread chats) */}
            {hasBadge && (
                <span className="absolute top-3 right-5 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-white dark:border-[#1a1a1a]"></span>
            )}
        </button>
    );
}
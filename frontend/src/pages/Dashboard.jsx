import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Keyboard, X, Lock } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { createNewMeeting } from '../api/roomService';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Dynamic default name based on the authenticated user
    const defaultMeetingName = user ? `${user.name.split(' ')[0]}'s Meeting` : "Meeting";

    const [meetingConfig, setMeetingConfig] = useState({
        name: defaultMeetingName,
        passcode: ''
    });
    const [joinCode, setJoinCode] = useState('');
    const handleJoinMeeting = (e) => {
        e.preventDefault();
        let code = joinCode.trim();
        // If the user pastes a full URL, extract the ID at the end
        if (code.includes('/room/')) {
            // Splits at '/room/' and grabs everything after, ignoring query parameters if any exist
            code = code.split('/room/')[1].split(/[\/?#]/)[0];
        }
        if (code) {
            // Navigate straight to the room. The Room component will handle verification!
            navigate(`/room/${code}`);
        }
    };

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await createNewMeeting(meetingConfig);
            toast.success('Meeting created successfully!');
            // Navigate directly to the newly generated 6-character room
            navigate(`/room/${response.meetingId}`);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
            setIsModalOpen(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 px-6 flex flex-col items-center selection:bg-black/10 dark:selection:bg-white/20 transition-colors duration-300 relative">
            <div className="w-full max-w-4xl mt-20 text-center z-10">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors duration-300">
                    NexMeet
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto font-light transition-colors duration-300">
                    Start or join a reliable & secure video meeting instantly
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {/* New Meeting Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto px-8 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                    >
                        <Video size={20} />
                        New Meeting
                    </button>

                    {/* Join with Code Input */}
                    <form onSubmit={handleJoinMeeting} className="flex relative w-full sm:w-auto group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                            <Keyboard size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Enter a code or link"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            className="w-full sm:w-80 pl-11 pr-24 py-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 dark:bg-white/5 dark:border-white/10 dark:focus:border-cyan-500 dark:text-white dark:placeholder-gray-500 rounded-xl focus:outline-none backdrop-blur-sm transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!joinCode.trim()}
                            className="absolute right-2 top-2 bottom-2 px-5 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Join
                        </button>
                    </form>
                </div>
            </div>

            {/* Create Meeting Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1a1a1a]">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Meeting</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMeeting} className="p-5 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Meeting Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={meetingConfig.name}
                                    onChange={(e) => setMeetingConfig({ ...meetingConfig, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 text-gray-900 dark:text-white transition-colors"
                                    placeholder="e.g. Project Discussion"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                    <Lock size={14} className="text-gray-400" />
                                    Meeting Passcode (Optional)
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={meetingConfig.passcode}
                                    onChange={(e) => setMeetingConfig({ ...meetingConfig, passcode: e.target.value.trim() })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 text-gray-900 dark:text-white transition-colors"
                                    placeholder="Up to 6 characters"
                                />
                                <p className="text-[11px] text-gray-500 mt-1.5">
                                    Leave blank to allow anyone with the link to join instantly.
                                </p>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? 'Generating Room...' : 'Start Meeting Now'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

        </div>
    );
}
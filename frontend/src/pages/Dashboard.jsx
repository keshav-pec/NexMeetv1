export default function Dashboard() {
    return (
        // Removed the hardcoded bg-[#0a0a0a] because App.jsx now handles the main background
        <div className="min-h-screen pt-24 px-6 flex flex-col items-center selection:bg-black/10 dark:selection:bg-white/20 transition-colors duration-300">
            <div className="w-full max-w-4xl mt-20 text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors duration-300">
                    NexMeet
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto font-light transition-colors duration-300">
                    Start or join a reliable & secure video meeting instantly.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {/* New Meeting Button */}
                    <button className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg shadow-black/5 dark:shadow-white/5">
                        New Meeting
                    </button>

                    {/* Join with Code Input */}
                    <div className="flex relative w-full sm:w-auto group">
                        <input
                            type="text"
                            placeholder="Enter join code"
                            className="w-full sm:w-72 px-4 py-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-500 dark:bg-white/5 dark:border-white/10 dark:focus:border-white/30 dark:text-white dark:placeholder-gray-500 rounded-xl focus:outline-none backdrop-blur-sm transition-all"
                        />
                        <button className="absolute right-2 top-2 bottom-2 px-5 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white rounded-lg font-medium transition-colors border border-transparent dark:hover:border-white/10">
                            Join
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
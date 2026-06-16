import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import toast from 'react-hot-toast';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-black/40 backdrop-blur-md border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="text-xl font-semibold tracking-wide text-black dark:text-white">
                    NexMeet
                </Link>

                <div className="flex gap-4 items-center">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {user ? (
                        <>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Hi, {user.name.split(' ')[0]}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-sm font-medium bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 px-4 py-2 rounded-lg backdrop-blur-sm transition-all border border-red-200 dark:border-red-500/10"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                Log in
                            </Link>
                            <Link to="/register" className="text-sm font-medium bg-black dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-all border border-transparent dark:border-white/10">
                                Sign up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const navigate = useNavigate();
    const { login, isLoading, error, clearError, user } = useAuthStore();

    useEffect(() => {
        if (user) navigate('/');
        return () => clearError();
    }, [user, navigate, clearError]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(formData);
        if (success) navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 selection:bg-black/10 dark:selection:bg-white/20 transition-colors duration-300">
            <div className="w-full max-w-md bg-white border border-gray-200 dark:bg-white/[0.02] dark:border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-xl dark:shadow-2xl transition-all duration-300">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Welcome back</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm transition-colors duration-300">Sign in to your NexMeet account</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-200 dark:bg-red-500/10 dark:border-red-500/50 rounded-lg text-red-600 dark:text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">Email Address</label>
                        <input
                            type="email" name="email" value={formData.email} onChange={handleChange} required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-gray-500 text-gray-900 placeholder-gray-400 dark:bg-white/5 dark:border-white/10 dark:focus:border-white/30 dark:text-white dark:placeholder-gray-500 rounded-xl focus:outline-none transition-colors"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">Password</label>
                        <input
                            type="password" name="password" value={formData.password} onChange={handleChange} required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-gray-500 text-gray-900 placeholder-gray-400 dark:bg-white/5 dark:border-white/10 dark:focus:border-white/30 dark:text-white dark:placeholder-gray-500 rounded-xl focus:outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit" disabled={isLoading}
                        className="w-full py-3.5 mt-4 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg shadow-black/5 dark:shadow-white/5 disabled:opacity-50 flex justify-center items-center"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-black dark:text-white hover:underline font-medium">Create one</Link>
                </p>
            </div>
        </div>
    );
}
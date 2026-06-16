import { create } from 'zustand';

const useThemeStore = create((set) => ({
    // Default to dark theme, or load from local storage
    theme: localStorage.getItem('theme') || 'dark',

    toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        return { theme: newTheme };
    }),
}));

export default useThemeStore;
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ToastProvider from './components/ToastProvider';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import MeetingRoom from './pages/MeetingRoom';
import useThemeStore from './store/useThemeStore';

// We abstract the app content so we can use the useLocation hook
function AppContent() {
  const location = useLocation();
  // Check if the current URL is the meeting room
  const isMeetingRoom = location.pathname.startsWith('/room/');

  return (
    <div className="min-h-screen font-sans bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-200 transition-colors duration-300">
      {/* Only render the Navbar if we are NOT in a meeting */}
      {!isMeetingRoom && <Navbar />}

      <ToastProvider />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/room/:id" element={<MeetingRoom />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}
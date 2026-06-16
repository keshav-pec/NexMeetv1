import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ToastProvider from './components/ToastProvider';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import useThemeStore from './store/useThemeStore'; // Import the store
import MeetingRoom from './pages/MeetingRoom';

function App() {
  const theme = useThemeStore((state) => state.theme);

  // Apply the dark class to the HTML document dynamically
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
      {/* Notice the transition-colors and dynamic background classes here */}
      <div className="min-h-screen font-sans bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-200 transition-colors duration-300">
        <Navbar />
        <ToastProvider />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/room/:id" element={<MeetingRoom />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
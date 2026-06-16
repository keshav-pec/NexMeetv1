import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            toastOptions={{
                style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                },
                success: {
                    iconTheme: { primary: '#10B981', secondary: '#1a1a1a' },
                },
                error: {
                    iconTheme: { primary: '#EF4444', secondary: '#1a1a1a' },
                },
            }}
        />
    );
}
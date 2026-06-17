import api from './axios';

export const fetchLiveKitToken = async (roomName) => {
    try {
        // Send the room name to our Node.js backend
        const response = await api.post('/rooms/token', { roomName });

        // Return the token and the LiveKit WebSocket URL
        return {
            token: response.data.token,
            livekitUrl: response.data.livekitUrl
        };
    } catch (error) {
        console.error("Error fetching LiveKit token:", error);
        throw new Error(error.response?.data?.message || 'Failed to connect to room');
    }
};
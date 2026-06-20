import api from './axios';

// Add the passcode parameter (defaults to null)
export const fetchLiveKitToken = async (roomName, passcode = null) => {
    try {
        const response = await api.post('/rooms/token', { roomName, passcode });
        return {
            token: response.data.token,
            livekitUrl: response.data.livekitUrl,
            meetingName: response.data.meetingName
        };
    } catch (error) {
        // If we get a 401 with requirePasscode flag, we throw a specific error
        if (error.response?.status === 401 && error.response?.data?.requirePasscode) {
            throw { isPasscodeRequired: true, message: error.response.data.message };
        }
        throw new Error(error.response?.data?.message || 'Failed to connect to room');
    }
};

export const endMeetingOnServer = async (roomName) => {
    try {
        await api.post('/rooms/end', { roomName });
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to end meeting');
    }
}

export const createNewMeeting = async (meetingData) => {
    try {
        const response = await api.post('/meetings/create', meetingData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create meeting');
    }
};
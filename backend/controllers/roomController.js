const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const Meeting = require('../models/Meeting');

const generateToken = async (req, res) => {
    try {
        const { roomName, passcode } = req.body;

        if (!roomName) return res.status(400).json({ message: 'Room name is required' });

        const meeting = await Meeting.findOne({ meetingId: roomName });
        if (!meeting) return res.status(404).json({ message: 'Meeting room does not exist.' });

        // Check if the requester is the host of this meeting
        const isHost = meeting.hostId.toString() === req.user._id.toString();

        // Passcode logic: If it has a passcode AND the user is NOT the host, verify it.
        if (meeting.passcode && !isHost) {
            if (!passcode) {
                return res.status(401).json({ requirePasscode: true, message: 'Passcode required' });
            }
            if (meeting.passcode !== passcode) {
                return res.status(401).json({ requirePasscode: true, message: 'Incorrect passcode' });
            }
        }

        const participantName = req.user.name;
        const participantIdentity = req.user._id.toString();

        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: participantIdentity,
                name: participantName,
                // Inject the Host status into LiveKit metadata so the frontend UI can read it
                metadata: JSON.stringify({ isHost }),
                ttl: '2h',
            }
        );

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            canUpdateOwnMetadata: true
        });

        const token = await at.toJwt();

        res.status(200).json({
            token,
            livekitUrl: process.env.LIVEKIT_URL,
            meetingName: meeting.name // Pass the real name to the UI
        });

    } catch (error) {
        console.error('LiveKit Token Error:', error);
        res.status(500).json({ message: 'Server error generating token' });
    }
};

// NEW: End the meeting for everyone
const endMeetingForAll = async (req, res) => {
    try {
        const { roomName } = req.body;
        const meeting = await Meeting.findOne({ meetingId: roomName });

        if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

        // Security: Only the host can shut down the room
        if (meeting.hostId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the host can end the meeting for everyone.' });
        }

        // Connect to LiveKit Server API to destroy the room
        const roomService = new RoomServiceClient(
            process.env.LIVEKIT_URL,
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET
        );

        await roomService.deleteRoom(roomName);

        // Mark as inactive in DB
        meeting.isActive = false;
        await meeting.save();

        res.status(200).json({ message: 'Meeting ended successfully.' });

    } catch (error) {
        console.error('End Meeting Error:', error);
        res.status(500).json({ message: 'Failed to end meeting.' });
    }
}

module.exports = { generateToken, endMeetingForAll };
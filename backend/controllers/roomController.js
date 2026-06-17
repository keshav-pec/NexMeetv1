const { AccessToken } = require('livekit-server-sdk');

// @desc    Generate a LiveKit access token for a specific room
// @route   POST /api/rooms/token
// @access  Private (Requires NexMeet JWT)
const generateToken = async (req, res) => {
    try {
        const { roomName } = req.body;

        // 1. Validate Input
        if (!roomName) {
            return res.status(400).json({ message: 'Room name is required' });
        }

        // 2. Identify the User (req.user comes from our protect middleware)
        const participantName = req.user.name;
        const participantIdentity = req.user._id.toString(); // Must be a unique string

        // 3. Create the LiveKit Access Token
        // We use the credentials stored in our .env file
        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: participantIdentity,
                name: participantName,
                // The token will expire in 2 hours (standard meeting limit)
                ttl: '2h',
            }
        );

        // 4. Set Permissions (Grants)
        // We grant this specific user permission to join ONLY the requested room
        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,      // Can turn on camera/mic
            canSubscribe: true,    // Can see others
            canPublishData: true,   // Required for in-meeting chat
            canUpdateOwnMetadata: true
        });

        // 5. Sign the token and send it to the frontend
        const token = await at.toJwt();

        res.status(200).json({
            token,
            livekitUrl: process.env.LIVEKIT_URL
        });

    } catch (error) {
        console.error('LiveKit Token Error:', error);
        res.status(500).json({ message: 'Failed to generate meeting token', error: error.message });
    }
};

module.exports = {
    generateToken
};
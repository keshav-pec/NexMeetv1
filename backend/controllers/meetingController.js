const Meeting = require('../models/Meeting');

// Helper function to generate a random 6-character alphanumeric string
const generateMeetingId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Format as xxx-xxx for better readability (like Google Meet)
    return `${result.slice(0, 3)}-${result.slice(3, 6)}`;
};

// @desc    Create a new meeting
// @route   POST /api/meetings/create
// @access  Private
const createMeeting = async (req, res) => {
    try {
        const { name, passcode } = req.body;

        // 1. Generate a unique ID and ensure it doesn't already exist
        let meetingId;
        let isUnique = false;

        while (!isUnique) {
            meetingId = generateMeetingId();
            const existing = await Meeting.findOne({ meetingId });
            if (!existing) isUnique = true;
        }

        // 2. Validate passcode (if provided, must be up to 6 chars)
        if (passcode && passcode.length > 6) {
            return res.status(400).json({ message: 'Passcode cannot exceed 6 characters.' });
        }

        // 3. Create the meeting in the database
        // req.user._id is provided by the authMiddleware
        const meeting = await Meeting.create({
            meetingId,
            name: name || `${req.user.name.split(' ')[0]}'s Meeting`,
            hostId: req.user._id,
            passcode: passcode || null
        });

        // 4. Return the new meeting ID to the frontend
        res.status(201).json({
            meetingId: meeting.meetingId,
            name: meeting.name,
            requiresPasscode: !!meeting.passcode
        });

    } catch (error) {
        console.error('Create Meeting Error:', error);
        res.status(500).json({ message: 'Failed to create meeting', error: error.message });
    }
};

module.exports = {
    createMeeting
};
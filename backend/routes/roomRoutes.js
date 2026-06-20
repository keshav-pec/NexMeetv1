const express = require('express');
const router = express.Router();
const { generateToken, endMeetingForAll } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

// Route: POST /api/rooms/token
// Protected: Only authenticated users can generate a token
router.post('/token', protect, generateToken);
router.post('/end', protect, endMeetingForAll);

module.exports = router;
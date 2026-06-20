const express = require('express');
const router = express.Router();
const { createMeeting } = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

// Route: POST /api/meetings/create
router.post('/create', protect, createMeeting);

module.exports = router;
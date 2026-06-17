const express = require('express');
const router = express.Router();
const { generateToken } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

// Route: POST /api/rooms/token
// Protected: Only authenticated users can generate a token
router.post('/token', protect, generateToken);

module.exports = router;
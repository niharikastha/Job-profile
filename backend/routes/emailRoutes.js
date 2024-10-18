const express = require('express');
const router = express.Router();
const {verifyOtp, sendOtp } = require('../controllers/emailController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/verify-otp', authMiddleware, verifyOtp); 
router.post('/send-otp', authMiddleware, sendOtp); 

module.exports = router;

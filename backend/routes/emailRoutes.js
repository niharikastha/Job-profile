const express = require('express');
const router = express.Router();
const { sendEmail , verifyOtp, sendOtp } = require('../controllers/emailController');
const authMiddleware = require('../midlleware/authMiddleware');

router.post('/send-email', authMiddleware, sendEmail);
router.post('/verify-otp', authMiddleware, verifyOtp); 
router.post('/send-otp', authMiddleware, sendOtp); 

module.exports = router;

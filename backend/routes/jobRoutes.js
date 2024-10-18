const express = require('express');
const router = express.Router();
const { postJob } = require('../controllers/jobController');
const authMiddleware = require('../midlleware/authMiddleware');

router.post('/post-job', authMiddleware, postJob);

module.exports = router;

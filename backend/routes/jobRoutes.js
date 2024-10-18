const express = require('express');
const router = express.Router();
const { create, find, findAll } = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, create);
router.get('/all', authMiddleware, findAll);
router.get('/:id', authMiddleware, find);

module.exports = router;

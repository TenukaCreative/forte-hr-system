const express = require('express');
const router = express.Router();
const { getMyPerformance } = require('../controllers/performanceController');
const auth = require('../middleware/auth');

router.get('/me', auth, getMyPerformance);

module.exports = router;

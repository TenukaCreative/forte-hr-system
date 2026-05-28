const express = require('express');
const router = express.Router();
const { getMyNotifications } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/me', auth, getMyNotifications);

module.exports = router;

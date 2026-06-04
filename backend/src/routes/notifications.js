const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead, clearAllNotifications } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/me', auth, getMyNotifications);
// Specific routes before the dynamic /:id route
router.patch('/read-all', auth, markAllAsRead);
router.delete('/clear-all', auth, clearAllNotifications);
router.patch('/:id/read', auth, markAsRead);

module.exports = router;

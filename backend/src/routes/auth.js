const express = require('express');
const router = express.Router();
const { devLogin, microsoftCallback, me } = require('../controllers/authController');
const auth = require('../middleware/auth');

// DEV ONLY — remove before production
router.post('/login', devLogin);

router.post('/microsoft/callback', microsoftCallback);
router.get('/me', auth, me);

module.exports = router;

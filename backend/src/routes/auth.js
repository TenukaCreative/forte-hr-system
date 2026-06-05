const express = require('express');
const router = express.Router();
const { microsoftCallback, me } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/microsoft/callback', microsoftCallback);
router.get('/me', auth, me);

module.exports = router;
    
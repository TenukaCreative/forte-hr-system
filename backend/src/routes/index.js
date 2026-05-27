const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');

router.use('/auth', authRoutes);

// Additional routes will be mounted here as features are built

module.exports = router;

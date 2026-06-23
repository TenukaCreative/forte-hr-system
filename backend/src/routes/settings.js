const express = require('express');
const router = express.Router();
const {
  getPerformanceSettings,
  savePerformanceSettings,
} = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const { authorizePermission } = require('../middleware/rbac');

const teamPerf = authorizePermission('team_performance');

router.get('/performance', auth, teamPerf, getPerformanceSettings);
router.post('/performance', auth, teamPerf, savePerformanceSettings);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getPerformanceSettings,
  savePerformanceSettings,
} = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const pmoOnly = authorize('HEAD_OF_PMO');

router.get('/performance', auth, pmoOnly, getPerformanceSettings);
router.post('/performance', auth, pmoOnly, savePerformanceSettings);

module.exports = router;

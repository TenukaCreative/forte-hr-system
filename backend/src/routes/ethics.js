const express = require('express');
const router = express.Router();
const {
  createOrUpdateEthicsReview,
  getEmployeeEthics,
  getMyEthics,
  getLatestEthics,
  getTeamEthics,
} = require('../controllers/ethicsController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const pmoOnly = authorize('HEAD_OF_PMO', 'SUPER_ADMIN');

// Specific routes before dynamic /:employeeId routes
router.get('/team', auth, pmoOnly, getTeamEthics);
router.get('/my', auth, getMyEthics);
router.get('/latest/:employeeId', auth, pmoOnly, getLatestEthics);
router.get('/employee/:employeeId', auth, pmoOnly, getEmployeeEthics);
router.post('/', auth, pmoOnly, createOrUpdateEthicsReview);

module.exports = router;

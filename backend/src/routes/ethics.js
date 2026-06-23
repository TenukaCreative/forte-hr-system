const express = require('express');
const router = express.Router();
const {
  createOrUpdateEthicsReview,
  getEmployeeEthics,
  getMyEthics,
  getLatestEthics,
  getTeamEthics,
  getTeamMembers,
} = require('../controllers/ethicsController');
const auth = require('../middleware/auth');
const { authorizePermission } = require('../middleware/rbac');

const teamPerf = authorizePermission('team_performance');

// Specific routes before dynamic /:employeeId routes
router.get('/team', auth, teamPerf, getTeamEthics);
router.get('/team-members', auth, teamPerf, getTeamMembers);
router.get('/my', auth, authorizePermission('performance_evaluation'), getMyEthics);
router.get('/latest/:employeeId', auth, teamPerf, getLatestEthics);
router.get('/employee/:employeeId', auth, teamPerf, getEmployeeEthics);
router.post('/', auth, teamPerf, createOrUpdateEthicsReview);

module.exports = router;

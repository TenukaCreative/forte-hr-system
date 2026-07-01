const express = require('express');
const router = express.Router();
const {
  getMyTeamKpis,
  getKPIsByTeam,
  createKpi,
  updateKpi,
  deleteKpi,
  getEmployeeKpis,
} = require('../controllers/kpiController');
const auth = require('../middleware/auth');
const { authorizePermission } = require('../middleware/rbac');

const teamPerf = authorizePermission('team_performance');

// Specific routes before dynamic /:kpiId routes
router.get('/my-team', auth, teamPerf, getMyTeamKpis);
router.get('/team/:teamId', auth, teamPerf, getKPIsByTeam);
router.get('/employee/:employeeId', auth, teamPerf, getEmployeeKpis);
router.post('/', auth, teamPerf, createKpi);
router.put('/:kpiId', auth, teamPerf, updateKpi);
router.delete('/:kpiId', auth, teamPerf, deleteKpi);

module.exports = router;

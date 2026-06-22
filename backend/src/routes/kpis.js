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
const { authorize, authorizePermission } = require('../middleware/rbac');

const pmoOnly = authorize('SENIOR', 'SUPER_ADMIN');
const teamPerf = authorizePermission('team_performance');

// Specific routes before dynamic /:kpiId routes
router.get('/my-team', auth, pmoOnly, teamPerf, getMyTeamKpis);
router.get('/team/:teamId', auth, pmoOnly, teamPerf, getKPIsByTeam);
router.get('/employee/:employeeId', auth, pmoOnly, teamPerf, getEmployeeKpis);
router.post('/', auth, pmoOnly, teamPerf, createKpi);
router.put('/:kpiId', auth, pmoOnly, teamPerf, updateKpi);
router.delete('/:kpiId', auth, pmoOnly, teamPerf, deleteKpi);

module.exports = router;

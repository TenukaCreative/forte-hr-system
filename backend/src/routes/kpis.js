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
const { authorize } = require('../middleware/rbac');

const pmoOnly = authorize('SENIOR', 'SUPER_ADMIN');

// Specific routes before dynamic /:kpiId routes
router.get('/my-team', auth, pmoOnly, getMyTeamKpis);
router.get('/team/:teamId', auth, pmoOnly, getKPIsByTeam);
router.get('/employee/:employeeId', auth, pmoOnly, getEmployeeKpis);
router.post('/', auth, pmoOnly, createKpi);
router.put('/:kpiId', auth, pmoOnly, updateKpi);
router.delete('/:kpiId', auth, pmoOnly, deleteKpi);

module.exports = router;

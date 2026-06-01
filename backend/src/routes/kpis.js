const express = require('express');
const router = express.Router();
const {
  getMyTeamKpis,
  createKpi,
  updateKpi,
  deleteKpi,
  getEmployeeKpis,
} = require('../controllers/kpiController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const pmoOnly = authorize('HEAD_OF_PMO');

router.get('/my-team', auth, pmoOnly, getMyTeamKpis);
router.post('/', auth, pmoOnly, createKpi);
router.put('/:kpiId', auth, pmoOnly, updateKpi);
router.delete('/:kpiId', auth, pmoOnly, deleteKpi);
router.get('/employee/:employeeId', auth, pmoOnly, getEmployeeKpis);

module.exports = router;

const express = require('express');
const router = express.Router();
const { requestLeave, getMyLeaves, getAllLeaves, approveLeave, rejectLeave } = require('../controllers/leaveController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/request', auth, requestLeave);
router.get('/my', auth, getMyLeaves);
router.get('/all', auth, authorize('HR_MANAGER', 'HEAD_OF_PMO', 'SUPER_ADMIN'), getAllLeaves);
router.patch('/:id/approve', auth, authorize('HEAD_OF_PMO', 'HR_MANAGER', 'SUPER_ADMIN'), approveLeave);
router.patch('/:id/reject', auth, authorize('HEAD_OF_PMO', 'HR_MANAGER', 'SUPER_ADMIN'), rejectLeave);

module.exports = router;

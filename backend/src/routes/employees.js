const express = require('express');
const router = express.Router();
const { getEmployees, getAllUsers, getEmployee, createEmployee, updateEmployee } = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), getEmployees);
// Specific route must come before the dynamic /:userId route
router.get('/users', auth, authorize('HR_MANAGER', 'SENIOR', 'SUPER_ADMIN'), getAllUsers);
router.get('/:userId', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), getEmployee);
router.post('/:userId', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), createEmployee);
router.put('/:userId', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), updateEmployee);

module.exports = router;

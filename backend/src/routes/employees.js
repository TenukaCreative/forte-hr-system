const express = require('express');
const router = express.Router();
const { getEmployees, getAllUsers, getEmployee, createEmployee, updateEmployee, updateMyProfile, getProfileStatus } = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const { authorize, authorizePermission } = require('../middleware/rbac');

router.get('/', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), authorizePermission('employee_management'), getEmployees);
// Specific route must come before the dynamic /:userId route
// NOTE: this user-picker route also allows SENIOR, who currently have no
// permission set, so authorizePermission is intentionally NOT added here.
router.get('/users', auth, authorize('HR_MANAGER', 'SENIOR', 'SUPER_ADMIN'), getAllUsers);

// Self-service profile routes — any authenticated user, own record only.
// Declared before the dynamic /:userId routes so 'profile'/'profile-status'
// are never captured as a userId param.
router.patch('/profile', auth, updateMyProfile);
router.get('/profile-status', auth, getProfileStatus);
router.get('/:userId', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), authorizePermission('employee_management'), getEmployee);
router.post('/:userId', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), authorizePermission('employee_management'), createEmployee);
router.put('/:userId', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), authorizePermission('employee_management'), updateEmployee);

module.exports = router;

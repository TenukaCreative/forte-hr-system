const express = require('express');
const router = express.Router();
const { getEmployees, getAllUsers, getEmployee, createEmployee, updateEmployee, updateMyProfile, getProfileStatus, getMyDirectReports } = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const { authorizePermission } = require('../middleware/rbac');

router.get('/', auth, authorizePermission('employee_management'), getEmployees);
// Specific route must come before the dynamic /:userId route
router.get('/users', auth, authorizePermission('employee_management','team_performance'), getAllUsers);

// Self-service profile routes — any authenticated user, own record only.
// Declared before the dynamic /:userId routes so 'profile'/'profile-status'
// are never captured as a userId param.
router.patch('/profile', auth, updateMyProfile);
router.get('/profile-status', auth, getProfileStatus);
router.get('/my-reports', auth, getMyDirectReports);
router.get('/:userId', auth, authorizePermission('employee_management'), getEmployee);
router.post('/:userId', auth, authorizePermission('employee_management'), createEmployee);
router.put('/:userId', auth, authorizePermission('employee_management'), updateEmployee);

module.exports = router;

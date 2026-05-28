const express = require('express');
const router = express.Router();
const { getEmployees, getEmployee, createEmployee, updateEmployee } = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', auth, authorize('HR_MANAGER'), getEmployees);
router.get('/:userId', auth, authorize('HR_MANAGER'), getEmployee);
router.post('/:userId', auth, authorize('HR_MANAGER'), createEmployee);
router.put('/:userId', auth, authorize('HR_MANAGER'), updateEmployee);

module.exports = router;

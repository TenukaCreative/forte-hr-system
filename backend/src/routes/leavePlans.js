const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createLeavePlan,
  getMyPlans,
  getTeamPlans,
  deleteLeavePlan,
} = require('../controllers/leavePlanController');

// Employee submits a new leave plan
router.post('/', auth, createLeavePlan);

// Employee sees their own plans
router.get('/my', auth, getMyPlans);

// Manager sees all plans from their direct reports
router.get('/team', auth, getTeamPlans);

// Employee deletes one of their own plans
router.delete('/:id', auth, deleteLeavePlan);

module.exports = router;

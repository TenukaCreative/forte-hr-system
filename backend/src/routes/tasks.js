const express = require('express');
const router = express.Router();
const {
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getMyTasks,
  getOverdueTasks,
} = require('../controllers/taskController');
const auth = require('../middleware/auth');
const { authorizePermission } = require('../middleware/rbac');

const teamPerf = authorizePermission('team_performance');

// All authenticated roles
router.get('/my', auth, getMyTasks);
router.patch('/:taskId/complete', auth, completeTask);

// PMO only
router.get('/overdue', auth, teamPerf, getOverdueTasks);
router.post('/', auth, teamPerf, createTask);
router.put('/:taskId', auth, teamPerf, updateTask);
router.delete('/:taskId', auth, teamPerf, deleteTask);

module.exports = router;

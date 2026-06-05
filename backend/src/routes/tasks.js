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
const { authorize } = require('../middleware/rbac');

const pmoOnly = authorize('HEAD_OF_PMO', 'SUPER_ADMIN');

// All authenticated roles
router.get('/my', auth, getMyTasks);
router.patch('/:taskId/complete', auth, completeTask);

// PMO only
router.get('/overdue', auth, pmoOnly, getOverdueTasks);
router.post('/', auth, pmoOnly, createTask);
router.put('/:taskId', auth, pmoOnly, updateTask);
router.delete('/:taskId', auth, pmoOnly, deleteTask);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
} = require('../controllers/teamController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const pmoOnly = authorize('HEAD_OF_PMO');

router.get('/', auth, pmoOnly, getTeams);
router.post('/', auth, pmoOnly, createTeam);
router.get('/:teamId', auth, pmoOnly, getTeam);
router.put('/:teamId', auth, pmoOnly, updateTeam);
router.delete('/:teamId', auth, pmoOnly, deleteTeam);
router.post('/:teamId/members', auth, pmoOnly, addMember);
router.delete('/:teamId/members/:userId', auth, pmoOnly, removeMember);

module.exports = router;

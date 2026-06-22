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
const { authorize, authorizePermission } = require('../middleware/rbac');

const pmoOnly = authorize('SENIOR', 'SUPER_ADMIN');
const teamPerf = authorizePermission('team_performance');

router.get('/', auth, pmoOnly, teamPerf, getTeams);
router.post('/', auth, pmoOnly, teamPerf, createTeam);
router.get('/:teamId', auth, pmoOnly, teamPerf, getTeam);
router.put('/:teamId', auth, pmoOnly, teamPerf, updateTeam);
router.delete('/:teamId', auth, pmoOnly, teamPerf, deleteTeam);
router.post('/:teamId/members', auth, pmoOnly, teamPerf, addMember);
router.delete('/:teamId/members/:userId', auth, pmoOnly, teamPerf, removeMember);

module.exports = router;

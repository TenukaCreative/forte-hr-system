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

const teamPerf = authorizePermission('team_performance');

router.get('/', auth, teamPerf, getTeams);
router.post('/', auth, teamPerf, createTeam);
router.get('/:teamId', auth, teamPerf, getTeam);
router.put('/:teamId', auth, teamPerf, updateTeam);
router.delete('/:teamId', auth, teamPerf, deleteTeam);
router.post('/:teamId/members', auth, teamPerf, addMember);
router.delete('/:teamId/members/:userId', auth, teamPerf, removeMember);

module.exports = router;

const { where } = require('sequelize');
const { Team, TeamMember, User,KPI,Task } = require('../models');

// GET /api/teams — teams created by the current PMO, with member counts
const getTeams = async (req, res, next) => {
  try {
    const teams = await Team.findAll({
      where: { createdBy: req.user.id },
      include: [{ model: TeamMember, attributes: ['id'] }],
      order: [['createdAt', 'DESC']],
    });

    const result = teams.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      createdAt: t.createdAt,
      memberCount: t.TeamMembers?.length || 0,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/teams — create a team
const createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Team name is required' });

    const team = await Team.create({ name, description, createdBy: req.user.id });
    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
};

// GET /api/teams/:teamId — single team with its members
const getTeam = async (req, res, next) => {
  try {
    const team = await Team.findOne({
      where: { id: req.params.teamId, createdBy: req.user.id },
      include: [{
        model: TeamMember,
        include: [{ model: User, attributes: ['id', 'name', 'email', 'jobTitle'] }],
      }],
    });
    if (!team) return res.status(404).json({ message: 'Team not found' });

    res.json({
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      members: (team.TeamMembers || []).map((tm) => ({
        teamMemberId: tm.id,
        id: tm.User?.id,
        name: tm.User?.name,
        email: tm.User?.email,
        designation: tm.User?.jobTitle,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/teams/:teamId — update name/description
const updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findOne({ where: { id: req.params.teamId, createdBy: req.user.id } });
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const { name, description } = req.body;
    await team.update({ name: name ?? team.name, description });
    res.json(team);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/teams/:teamId — delete team (TeamMembers cascade via association)
const deleteTeam = async (req, res, next) => {
  try{
    const team = await Team.findOne({
     where: { id: req.params.teamId, createdBy: req.user.id }
    });
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const teamKpis = await KPI.findAll({
      where : {teamId: team.id},
      attributes:['id'],
    });
    const kpiIds = teamKpis.map((k)=> k.id);

    //delete tasks first then kpi, then members, then team 
    if(kpiIds.length >0){
      await Task.destroy({ where: { kpiId: kpiIds } });
      await KPI.destroy({ where: { teamId: team.id } });
    }
    await TeamMember.destroy({where: {teamId: team.id}});
    await team.destroy();
    // You're missing this at the end
    res.json({ message: 'Team deleted' });
  }
  catch(err){
    next(err);
  }
};

// POST /api/teams/:teamId/members — add a user to the team
const addMember = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const team = await Team.findOne({ where: { id: teamId, createdBy: req.user.id } });
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const existing = await TeamMember.findOne({ where: { teamId, userId } });
    if (existing) return res.status(400).json({ message: 'User is already a member of this team' });

    await TeamMember.create({ teamId, userId });

    const members = await TeamMember.findAll({
      where: { teamId },
      include: [{ model: User, attributes: ['id', 'name', 'email', 'jobTitle'] }],
    });

    res.status(201).json(members.map((tm) => ({
      teamMemberId: tm.id,
      id: tm.User?.id,
      name: tm.User?.name,
      email: tm.User?.email,
      designation: tm.User?.jobTitle,
    })));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/teams/:teamId/members/:userId — remove a member
const removeMember = async (req, res, next) => {
  try {
    const { teamId, userId } = req.params;

    const team = await Team.findOne({ where: { id: teamId, createdBy: req.user.id } });
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const removed = await TeamMember.destroy({ where: { teamId, userId } });
    if (!removed) return res.status(404).json({ message: 'Member not found in team' });

    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
};

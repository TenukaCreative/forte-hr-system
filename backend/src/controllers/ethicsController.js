const { EthicsReview, Employee, User, KPI, Notification } = require('../models');
const { sendEthicsReviewEmail } = require('../services/emailService');

// Weighted ethics score out of 100 (Performance 80 + Behavioral 20).
const calcEthicsScore = (data) => parseFloat((
  (data.timeliness / 100 * 20) +
  (data.workQuality / 100 * 20) +
  (data.workDiscipline / 100 * 15) +
  (data.ownership / 100 * 15) +
  (data.collaboration / 100 * 10) +
  (data.productOwnership / 100 * 10) +
  (data.businessDevelopment / 100 * 5) +
  (data.learningImprovement / 100 * 5) +
  (data.behavioralMetrics / 100 * 5) +
  (data.attitude / 100 * 5) +
  (data.effort / 100 * 5) +
  (data.trust / 100 * 5)
).toFixed(2));

const CRITERIA = [
  'timeliness', 'workQuality', 'workDiscipline', 'ownership',
  'collaboration', 'productOwnership', 'businessDevelopment', 'learningImprovement',
  'behavioralMetrics', 'attitude', 'effort', 'trust',
];

// POST /api/ethics — create or update (upsert by employeeId + period)
const createOrUpdateEthicsReview = async (req, res, next) => {
  try {
    const { employeeId, period, notes } = req.body;
    if (!employeeId || !period) {
      return res.status(400).json({ message: 'employeeId and period are required' });
    }

    const employee = await Employee.findByPk(employeeId, {
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Collect the 12 criteria (default any missing to 0)
    const scores = {};
    CRITERIA.forEach((f) => { scores[f] = Number(req.body[f]) || 0; });

    const ethicsScore = calcEthicsScore(scores);

    let review = await EthicsReview.findOne({ where: { employeeId, period } });
    if (review) {
      await review.update({ ...scores, ethicsScore, notes, reviewedBy: req.user.id });
    } else {
      review = await EthicsReview.create({
        employeeId,
        period,
        reviewedBy: req.user.id,
        ...scores,
        ethicsScore,
        notes,
      });
    }

    if (employee.User?.id) {
      await Notification.create({
        userId: employee.User.id,
        message: `Your ethics review for ${period} has been submitted. Score: ${ethicsScore}/100`,
      });
    }

    // Email the reviewed employee (best-effort).
    try {
      await sendEthicsReviewEmail(employee.User, { period, ethicsScore });
    } catch (err) {
      console.error('[email] notification failed:', err.message);
    }

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

// GET /api/ethics/employee/:employeeId — all reviews for an employee
const getEmployeeEthics = async (req, res, next) => {
  try {
    const reviews = await EthicsReview.findAll({
      where: { employeeId: req.params.employeeId },
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

// GET /api/ethics/my — all reviews for the logged-in employee
const getMyEthics = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) return res.json([]);

    const reviews = await EthicsReview.findAll({
      where: { employeeId: employee.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

// GET /api/ethics/latest/:employeeId — most recent review for an employee
const getLatestEthics = async (req, res, next) => {
  try {
    const review = await EthicsReview.findOne({
      where: { employeeId: req.params.employeeId },
      order: [['createdAt', 'DESC']],
    });
    res.json(review || null);
  } catch (err) {
    next(err);
  }
};

// GET /api/ethics/team — latest review per member of teams created by this user
const getTeamEthics = async (req, res, next) => {
  try {
    const { Team, TeamMember, Employee } = require('../models');

    // Get all teams created by this user
    const teams = await Team.findAll({
      where: { createdBy: req.user.id },
      include: [{
        model: TeamMember,
        attributes: ['userId'],
      }],
    });

    // Collect all unique userIds from team members
    const userIds = [
      ...new Set(
        teams.flatMap(t =>
          (t.TeamMembers || []).map(m => m.userId)
        )
      )
    ];

    if (userIds.length === 0) {
      return res.json([]);
    }

    // Find Employee records for those users
    // Bridge the User.id → Employee.id gap
    const employees = await Employee.findAll({
      where: { userId: userIds },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email', 'jobTitle'],
      }],
    });

    // For each employee get their latest ethics review
    const results = await Promise.all(
      employees.map(async (employee) => {
        const review = await EthicsReview.findOne({
          where: { employeeId: employee.id },
          order: [['createdAt', 'DESC']],
        });

        return {
          employeeId: employee.id,
          userId: employee.userId,
          name: employee.User?.name,
          email: employee.User?.email,
          designation: employee.User?.jobTitle ||
                       employee.designation,
          isActive: true,
          latestReview: review ? {
            ethicsScore: review.ethicsScore,
            period: review.period,
          } : null,
        };
      })
    );

    // Return ALL team members, even those
    // without a review yet
    res.json(results);
  } catch (err) {
    next(err);
  }
};

// GET /api/ethics/team-members — employees in the logged-in user's teams
const getTeamMembers = async (req, res, next) => {
  try {
    const { Team, TeamMember, Employee } = require('../models');

    const teams = await Team.findAll({
      where: { createdBy: req.user.id },
      include: [{
        model: TeamMember,
        attributes: ['userId'],
      }],
    });

    const userIds = [
      ...new Set(
        teams.flatMap(t =>
          (t.TeamMembers || []).map(m => m.userId)
        )
      )
    ];

    if (userIds.length === 0) {
      return res.json([]);
    }

    const employees = await Employee.findAll({
      where: { userId: userIds },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email', 'jobTitle'],
      }],
    });

    const members = employees.map(emp => ({
      employeeId: emp.id,
      userId: emp.userId,
      name: emp.User?.name,
      email: emp.User?.email,
      designation: emp.User?.jobTitle ||
                   emp.designation,
    }));

    res.json(members);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrUpdateEthicsReview,
  getEmployeeEthics,
  getMyEthics,
  getLatestEthics,
  getTeamEthics,
  getTeamMembers,
};

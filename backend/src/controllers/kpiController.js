const { KPI, Task, Employee, User, Team, Notification, KPIEvaluation } = require('../models');
const { sendKpiAssignedEmail } = require('../services/emailService');

// GET /api/kpis/my-team — every KPI this PMO has assigned, with member + tasks
const getMyTeamKpis = async (req, res, next) => {
  try {
    const kpis = await KPI.findAll({
      where: { assignedBy: req.user.id },
      include: [
        {
          model: Employee,
          attributes: ['id', 'department', 'designation'],
          include: [{ model: User, attributes: ['id', 'name', 'jobTitle'] }],
        },
        { model: Team, as: 'team', attributes: ['id', 'name'] },
        { model: Task, as: 'tasks' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(kpis);
  } catch (err) {
    next(err);
  }
};

// GET /api/kpis/team/:teamId — all KPIs assigned within a specific team
const getKPIsByTeam = async (req, res, next) => {
  try {
    const kpis = await KPI.findAll({
      where: { assignedBy: req.user.id, teamId: req.params.teamId },
      include: [
        {
          model: Employee,
          attributes: ['id', 'department', 'designation'],
          include: [{ model: User, attributes: ['id', 'name', 'jobTitle'] }],
        },
        { model: Team, as: 'team', attributes: ['id', 'name'] },
        { model: Task, as: 'tasks' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(kpis);
  } catch (err) {
    next(err);
  }
};

// POST /api/kpis — assign a new KPI to an employee
const createKpi = async (req, res, next) => {
  try {
    const { employeeId, teamId, title, description, startDate, endDate, targetScore } = req.body;
    if (!employeeId || !title) {
      return res.status(400).json({ message: 'employeeId and title are required' });
    }
    if (!teamId) {
      return res.status(400).json({ message: 'teamId is required' });
    }

    const employee = await Employee.findByPk(employeeId, {
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const kpi = await KPI.create({
      employeeId,
      teamId: teamId || null,
      assignedBy: req.user.id,
      title,
      description,
      startDate: startDate || null,
      endDate: endDate || null,
      targetScore: targetScore ?? 5,
    });

    if (employee.User?.id) {
      await Notification.create({
        userId: employee.User.id,
        message: `New KPI assigned: ${title}.${endDate ? ` ETA: ${endDate}` : ''}`,
      });
    }

    // Email the assignee (best-effort).
    try {
      await sendKpiAssignedEmail(employee.User, {
        title,
        targetScore: targetScore ?? 5,
        endDate: endDate || '—',
      });
    } catch (err) {
      console.error('[email] notification failed:', err.message);
    }

    res.status(201).json(kpi);
  } catch (err) {
    next(err);
  }
};

// PUT /api/kpis/:kpiId — update a KPI
const updateKpi = async (req, res, next) => {
  try {
    const kpi = await KPI.findOne({ where: { id: req.params.kpiId, assignedBy: req.user.id } });
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });

    const { title, description, startDate, endDate, targetScore, status } = req.body;
    await kpi.update({
      title: title ?? kpi.title,
      description: description ?? kpi.description,
      startDate: startDate !== undefined ? startDate : kpi.startDate,
      endDate: endDate !== undefined ? endDate : kpi.endDate,
      targetScore: targetScore ?? kpi.targetScore,
      status: status ?? kpi.status,
    });

    res.json(kpi);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/kpis/:kpiId — delete a KPI and its tasks
const deleteKpi = async (req, res, next) => {
  try {
    const kpi = await KPI.findOne({ where: { id: req.params.kpiId, assignedBy: req.user.id } });
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });

    await Task.destroy({ where: { kpiId: kpi.id } });
    await kpi.destroy();
    res.json({ message: 'KPI deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/kpis/employee/:employeeId — all KPIs for one employee
const getEmployeeKpis = async (req, res, next) => {
  try {
    const kpis = await KPI.findAll({
      where: { employeeId: req.params.employeeId, assignedBy: req.user.id },
      include: [{ model: Task, as: 'tasks' }],
      order: [['createdAt', 'DESC']],
    });

    res.json(kpis);
  } catch (err) {
    next(err);
  }
};

// POST /api/kpis/:kpiId/self-evaluate
// Employee submits self evaluation after all tasks complete
const submitSelfEvaluation = async (req, res, next) => {
  try {
    const { selfRating, selfComment } = req.body;

    if (!selfRating || selfRating < 1 || selfRating > 5) {
      return res.status(400).json({ message: 'selfRating must be between 1 and 5' });
    }

    const kpi = await KPI.findOne({
      where: { id: req.params.kpiId },
      include: [
        { model: Task, as: 'tasks' },
        {
          model: Employee,
          attributes: ['id'],
          include: [{ model: User, attributes: ['id', 'name'] }],
        },
      ],
    });

    if (!kpi) return res.status(404).json({ message: 'KPI not found' });
    if (kpi.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'KPI is not active' });
    }

    // All tasks must be completed
    const incompleteTasks = (kpi.tasks || []).filter((t) => t.status !== 'COMPLETED');
    if (incompleteTasks.length > 0) {
      return res.status(400).json({
        message: `${incompleteTasks.length} task(s) still incomplete`
      });
    }

    // Create or update evaluation
    const [evaluation] = await KPIEvaluation.findOrCreate({
      where: { kpiId: kpi.id },
      defaults: {
        kpiId: kpi.id,
        selfRating,
        selfComment: selfComment || null,
        selfSubmittedAt: new Date(),
      },
    });

    if (!evaluation.isNewRecord) {
      await evaluation.update({
        selfRating,
        selfComment: selfComment || null,
        selfSubmittedAt: new Date(),
      });
    }

    // Update KPI status to PENDING_REVIEW
    await kpi.update({ status: 'PENDING_REVIEW' });

    // Notify the manager who assigned this KPI
    await Notification.create({
      userId: kpi.assignedBy,
      message: `${kpi.Employee?.User?.name || 'An employee'} has submitted a self evaluation for KPI: ${kpi.title}`,
    });

    res.json({ message: 'Self evaluation submitted', evaluation });
  } catch (err) {
    next(err);
  }
};

// POST /api/kpis/:kpiId/manager-evaluate
// Manager reviews and closes the KPI with their own rating
const submitManagerEvaluation = async (req, res, next) => {
  try {
    const { managerRating, managerComment } = req.body;

    if (!managerRating || managerRating < 1 || managerRating > 5) {
      return res.status(400).json({ message: 'managerRating must be between 1 and 5' });
    }

    const kpi = await KPI.findOne({
      where: { id: req.params.kpiId, assignedBy: req.user.id },
      include: [
        {
          model: Employee,
          attributes: ['id'],
          include: [{ model: User, attributes: ['id', 'name'] }],
        },
        { model: KPIEvaluation, as: 'evaluation' },
      ],
    });

    if (!kpi) return res.status(404).json({ message: 'KPI not found' });
    if (kpi.status !== 'PENDING_REVIEW') {
      return res.status(400).json({ message: 'KPI is not pending review' });
    }
    if (!kpi.evaluation) {
      return res.status(400).json({ message: 'No self evaluation found' });
    }

    // Update evaluation with manager rating
    await kpi.evaluation.update({
      managerRating,
      managerComment: managerComment || null,
      managerReviewedAt: new Date(),
      reviewedBy: req.user.id,
    });

    // Close the KPI
    await kpi.update({ status: 'CLOSED' });

    // Notify the employee
    await Notification.create({
      userId: kpi.Employee?.User?.id,
      message: `Your KPI "${kpi.title}" has been evaluated by your manager. Rating: ${managerRating}/5`,
    });

    res.json({ message: 'KPI evaluated and closed', evaluation: kpi.evaluation });
  } catch (err) {
    next(err);
  }
};

// GET /api/kpis/pending-evaluations
// Manager fetches all PENDING_REVIEW KPIs assigned by them
const getPendingEvaluations = async (req, res, next) => {
  try {
    const kpis = await KPI.findAll({
      where: { assignedBy: req.user.id, status: 'PENDING_REVIEW' },
      include: [
        {
          model: Employee,
          attributes: ['id', 'department', 'designation'],
          include: [{ model: User, attributes: ['id', 'name', 'email'] }],
        },
        { model: Team, as: 'team', attributes: ['id', 'name'] },
        { model: Task, as: 'tasks' },
        { model: KPIEvaluation, as: 'evaluation' },
      ],
      order: [['updatedAt', 'DESC']],
    });

    res.json(kpis);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyTeamKpis,
  getKPIsByTeam,
  createKpi,
  updateKpi,
  deleteKpi,
  getEmployeeKpis,
  submitSelfEvaluation,
  submitManagerEvaluation,
  getPendingEvaluations,
};

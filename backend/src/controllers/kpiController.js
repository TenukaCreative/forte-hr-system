const { KPI, Task, Employee, User, Team, Notification } = require('../models');
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
          include: [{ model: User, attributes: ['id', 'name', 'role'] }],
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
          include: [{ model: User, attributes: ['id', 'name', 'role'] }],
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
      targetScore: targetScore ?? 100,
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
        targetScore: targetScore ?? 100,
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

module.exports = {
  getMyTeamKpis,
  getKPIsByTeam,
  createKpi,
  updateKpi,
  deleteKpi,
  getEmployeeKpis,
};

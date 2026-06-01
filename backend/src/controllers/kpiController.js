const { KPI, Task, Employee, User, Notification } = require('../models');

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
    const { employeeId, title, description, quarter, year, targetScore } = req.body;
    if (!employeeId || !title || !quarter || !year) {
      return res.status(400).json({ message: 'employeeId, title, quarter and year are required' });
    }

    const employee = await Employee.findByPk(employeeId, {
      include: [{ model: User, attributes: ['id', 'name'] }],
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const kpi = await KPI.create({
      employeeId,
      assignedBy: req.user.id,
      title,
      description,
      quarter,
      year,
      targetScore: targetScore ?? 100,
    });

    if (employee.User?.id) {
      await Notification.create({
        userId: employee.User.id,
        message: `New KPI assigned: ${title} for ${quarter} ${year}`,
      });
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

    const { title, description, targetScore, status } = req.body;
    await kpi.update({
      title: title ?? kpi.title,
      description: description ?? kpi.description,
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
  createKpi,
  updateKpi,
  deleteKpi,
  getEmployeeKpis,
};

const { Task, KPI, Employee, User, Notification } = require('../models');

// POST /api/tasks — add a task under a KPI
const createTask = async (req, res, next) => {
  try {
    const { kpiId, title, description, deadline } = req.body;
    if (!kpiId || !title) return res.status(400).json({ message: 'kpiId and title are required' });

    const kpi = await KPI.findByPk(kpiId, {
      include: [{ model: Employee, include: [{ model: User, attributes: ['id', 'name'] }] }],
    });
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });

    const task = await Task.create({ kpiId, title, description, deadline });

    const memberUserId = kpi.Employee?.User?.id;
    if (memberUserId) {
      await Notification.create({
        userId: memberUserId,
        message: `New task: ${title} under ${kpi.title}.${deadline ? ` Due ${deadline}` : ''}`,
      });
    }

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:taskId — update task details
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { title, description, deadline } = req.body;
    await task.update({
      title: title ?? task.title,
      description: description ?? task.description,
      deadline: deadline ?? task.deadline,
    });

    res.json(task);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:taskId — delete a task
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:taskId/complete — assigned employee marks a task done
const completeTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.taskId, {
      include: [{ model: KPI, include: [{ model: Employee, include: [{ model: User, attributes: ['id', 'name'] }] }] }],
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.status === 'COMPLETED') return res.status(400).json({ message: 'Task already completed' });

    // Only the employee the KPI belongs to may complete the task
    const assignedUserId = task.KPI?.Employee?.User?.id;
    if (assignedUserId !== req.user.id) {
      return res.status(403).json({ message: 'You can only complete your own tasks' });
    }

    const now = new Date();
    const onTime = !task.deadline || now <= new Date(`${task.deadline}T23:59:59`);
    const earnedScore = onTime ? 1.0 : 0.7;

    await task.update({
      status: 'COMPLETED',
      completedAt: now,
      completedBy: req.user.id,
      earnedScore,
    });

    const pmoId = task.KPI?.assignedBy;
    if (pmoId) {
      await Notification.create({
        userId: pmoId,
        message: `${req.user.name} completed: ${task.title}`,
      });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/my — all tasks belonging to the current user's KPIs
const getMyTasks = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) return res.json([]);

    const tasks = await Task.findAll({
      include: [{
        model: KPI,
        where: { employeeId: employee.id },
        attributes: ['id', 'title', 'startDate', 'endDate', 'targetScore'],
      }],
      order: [['deadline', 'ASC']],
    });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/overdue — pending, past-deadline tasks for this PMO's KPIs
const getOverdueTasks = async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    const tasks = await Task.findAll({
      where: { status: 'PENDING', deadline: { [Op.lt]: new Date() } },
      include: [{
        model: KPI,
        where: { assignedBy: req.user.id },
        attributes: ['id', 'title'],
        include: [{
          model: Employee,
          attributes: ['id', 'department'],
          include: [{ model: User, attributes: ['id', 'name'] }],
        }],
      }],
      order: [['deadline', 'ASC']],
    });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getMyTasks,
  getOverdueTasks,
};

const { Task, KPI, Employee, User, Notification } = require('../models');

// Scan all pending tasks; for any whose deadline has passed, notify both the
// assigned employee and the PMO who assigned the KPI. findOrCreate keyed on
// (userId, message) keeps it idempotent so repeated runs don't spam.
const checkAndNotifyOverdue = async () => {
  const now = new Date();

  const tasks = await Task.findAll({
    where: { status: 'PENDING' },
    include: [{
      model: KPI,
      include: [{
        model: Employee,
        include: [{ model: User }],
      }],
    }],
  });

  for (const task of tasks) {
    if (!task.deadline || new Date(task.deadline) >= now) continue;

    const member = task.KPI?.Employee?.User;
    const pmoId = task.KPI?.assignedBy;
    if (!member) continue;

    await Notification.findOrCreate({
      where: { userId: member.id, message: `Overdue: "${task.title}"` },
      defaults: {
        userId: member.id,
        message: `Overdue: "${task.title}"`,
        isRead: false,
      },
    });

    if (pmoId) {
      await Notification.findOrCreate({
        where: { userId: pmoId, message: `Overdue (${member.name}): "${task.title}"` },
        defaults: {
          userId: pmoId,
          message: `Overdue (${member.name}): "${task.title}"`,
          isRead: false,
        },
      });
    }
  }
};

module.exports = { checkAndNotifyOverdue };

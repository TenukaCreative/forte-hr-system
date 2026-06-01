const { KPI, Task } = require('../models');

// Management score for a HEAD_OF_PMO user: how much of the work they have
// assigned (across all their KPIs) is actually getting completed.
const calcPMOScore = async (pmoUserId) => {
  const kpis = await KPI.findAll({
    where: { assignedBy: pmoUserId },
    include: [{ model: Task, as: 'tasks' }],
  });

  if (!kpis.length) {
    return { score: 0, totalTasks: 0, completedTasks: 0, overdueTasks: 0 };
  }

  let totalTasks = 0;
  let completedTasks = 0;
  let overdueTasks = 0;
  const now = new Date();

  kpis.forEach((kpi) => {
    const tasks = kpi.tasks || [];
    totalTasks += tasks.length;
    completedTasks += tasks.filter((t) => t.status === 'COMPLETED').length;
    overdueTasks += tasks.filter(
      (t) => t.status === 'PENDING' && t.deadline && new Date(t.deadline) < now
    ).length;
  });

  const score = totalTasks
    ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2))
    : 0;

  return { score, totalTasks, completedTasks, overdueTasks };
};

module.exports = { calcPMOScore };

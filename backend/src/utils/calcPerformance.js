const { KPI, Task } = require('../models');

const calcPerformance = async (employeeId) => {
  const kpis = await KPI.findAll({
    where: { employeeId, status: 'ACTIVE' },
    include: [{ model: Task, as: 'tasks' }],
  });

  const kpiResults = kpis.map((kpi) => {
    const tasks = kpi.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const targetScore = parseFloat(kpi.targetScore);
    const earnedScore = totalTasks > 0
      ? (completedTasks / totalTasks) * targetScore
      : 0;

    return {
      id: kpi.id,
      title: kpi.title,
      startDate: kpi.startDate,
      endDate: kpi.endDate,
      targetScore,
      earnedScore: parseFloat(earnedScore.toFixed(2)),
      totalTasks,
      completedTasks,
      status: kpi.status,
    };
  });

  const overallScore = kpiResults.length > 0
    ? kpiResults.reduce((sum, k) => sum + k.earnedScore, 0) / kpiResults.length
    : 0;

  return {
    overallScore: parseFloat(overallScore.toFixed(2)),
    kpis: kpiResults,
  };
};

module.exports = calcPerformance;

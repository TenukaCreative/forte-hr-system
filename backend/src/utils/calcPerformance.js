const { KPI, Task, EthicsReview, PerformanceSettings } = require('../models');

const calcPerformance = async (employeeId) => {
  // Get performance weights (latest saved, or 50/50 default)
  const settings = await PerformanceSettings.findOne({
    order: [['createdAt', 'DESC']],
  });

  const kpiWeight = settings ? parseFloat(settings.kpiWeight) / 100 : 0.50;
  const ethicsWeight = settings ? parseFloat(settings.ethicsWeight) / 100 : 0.50;

  // Get KPIs with tasks
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

  const kpiScore = kpiResults.length > 0
    ? kpiResults.reduce((sum, k) => sum + k.earnedScore, 0) / kpiResults.length
    : 0;

  // Get latest ethics review
  const ethicsReview = await EthicsReview.findOne({
    where: { employeeId },
    order: [['createdAt', 'DESC']],
  });

  const ethicsScore = ethicsReview ? parseFloat(ethicsReview.ethicsScore) : 0;

  // Combined final score
  const finalScore = parseFloat((
    (kpiScore * kpiWeight) + (ethicsScore * ethicsWeight)
  ).toFixed(2));

  return {
    finalScore,
    kpiScore: parseFloat(kpiScore.toFixed(2)),
    ethicsScore,
    kpiWeight: kpiWeight * 100,
    ethicsWeight: ethicsWeight * 100,
    totalKPIs: kpis.length,
    kpis: kpiResults,
    ethicsReview: ethicsReview ? {
      period: ethicsReview.period,
      ethicsScore: ethicsReview.ethicsScore,
      timeliness: ethicsReview.timeliness,
      workQuality: ethicsReview.workQuality,
      workDiscipline: ethicsReview.workDiscipline,
      ownership: ethicsReview.ownership,
      collaboration: ethicsReview.collaboration,
      productOwnership: ethicsReview.productOwnership,
      businessDevelopment: ethicsReview.businessDevelopment,
      learningImprovement: ethicsReview.learningImprovement,
      behavioralMetrics: ethicsReview.behavioralMetrics,
      attitude: ethicsReview.attitude,
      effort: ethicsReview.effort,
      trust: ethicsReview.trust,
      notes: ethicsReview.notes,
    } : null,
  };
};

module.exports = calcPerformance;

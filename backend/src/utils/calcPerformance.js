const { KPI, EthicsReview, PerformanceSettings, KPIEvaluation } = require('../models');

const calcPerformance = async (employeeId) => {
  // Get performance weights (latest saved, or 50/50 default)
  const settings = await PerformanceSettings.findOne({
    order: [['createdAt', 'DESC']],
  });

  const kpiWeight = settings ? parseFloat(settings.kpiWeight) / 100 : 0.50;
  const ethicsWeight = settings ? parseFloat(settings.ethicsWeight) / 100 : 0.50;

  // Get KPIs with tasks
  const kpis = await KPI.findAll({
    where: { employeeId, status: ['ACTIVE', 'PENDING_REVIEW', 'CLOSED'] },
    include: [
      { model: KPIEvaluation, as: 'evaluation' },
    ],
  });

  const kpiResults = kpis.map((kpi) => {
    const targetScore = parseFloat(kpi.targetScore);
    const earnedScore = kpi.evaluation?.managerRating
      ? (parseFloat(kpi.evaluation.managerRating) / 5) * targetScore
      : 0;

    return {
      id: kpi.id,
      title: kpi.title,
      startDate: kpi.startDate,
      endDate: kpi.endDate,
      targetScore,
      earnedScore: parseFloat(earnedScore.toFixed(2)),
      status: kpi.status,
      evaluation: kpi.evaluation ? {
        selfRating: kpi.evaluation.selfRating,
        selfComment: kpi.evaluation.selfComment,
        managerRating: kpi.evaluation.managerRating,
        managerComment: kpi.evaluation.managerComment,
      } : null,
    };
  });

  const totalWeight = kpiResults.reduce((sum, k) => sum + k.targetScore, 0);
  const kpiScorePercent = totalWeight > 0
    ? (kpiResults.reduce((sum, k) => sum + k.earnedScore, 0) / totalWeight) * 100
    : 0;

  // Get latest ethics review
  const ethicsReview = await EthicsReview.findOne({
    where: { employeeId },
    order: [['createdAt', 'DESC']],
  });

  const ethicsScore = ethicsReview ? parseFloat(ethicsReview.ethicsScore) : 0;

  // Combined final score
  const finalScore = parseFloat((
    (kpiScorePercent * kpiWeight) + (ethicsScore * ethicsWeight)
  ).toFixed(2));

  return {
    finalScore,
    kpiScore: parseFloat(kpiScorePercent.toFixed(2)),
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

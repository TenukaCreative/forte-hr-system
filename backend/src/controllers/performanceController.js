const { Employee } = require('../models');
const calcPerformance = require('../utils/calcPerformance');

// GET /api/performance/me
// Returns the logged-in user's full performance data (KPIs, evaluations, ethics)
const getMyPerformance = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) return res.json(null);

    const perf = await calcPerformance(employee.id);

    res.json({
      overallScore: perf.finalScore,
      kpiScore: perf.kpiScore,
      ethicsScore: perf.ethicsScore,
      kpiWeight: perf.kpiWeight,
      ethicsWeight: perf.ethicsWeight,
      totalKPIs: perf.kpis.length,
      completedTasks: perf.kpis.reduce((s, k) => s + k.completedTasks, 0),
      totalTasks: perf.kpis.reduce((s, k) => s + k.totalTasks, 0),
      kpis: perf.kpis,
      ethicsReview: perf.ethicsReview,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyPerformance };

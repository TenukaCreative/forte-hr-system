const { User, Employee, LeaveRequest, Document, Notification } = require('../models');
const calcPerformance = require('../utils/calcPerformance');
const { calcPMOScore } = require('../utils/calcPMOScore');
const resolveRole = require('../utils/resolveRole');

const getDashboard = async (req, res, next) => {
  try {
    const { id } = req.user;

    const user = await User.findByPk(id, { attributes: ['name', 'email', 'jobTitle'] });
    const employee = await Employee.findOne({ where: { userId: id } });

    let leave = null;
    let performance = null;
    let documents = null;

    if (employee) {
      const leaveRecords = await LeaveRequest.findAll({ where: { employeeId: req.user.id } });
      leave = {
        taken: leaveRecords
          .filter((l) => l.status === 'APPROVED')
          .reduce((s, l) => s + (parseFloat(l.daysCount) || 0), 0),
        pending: leaveRecords.filter((l) => l.status === 'PENDING').length,
      };

      const perf = await calcPerformance(employee.id);
      performance = {
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
      };

      const docCount = await Document.count({ where: { employeeId: employee.id } });
      const latestDoc = await Document.findOne({
        where: { employeeId: employee.id },
        order: [['uploadedAt', 'DESC']],
        attributes: ['uploadedAt'],
      });
      documents = { total: docCount, latestUpload: latestDoc?.uploadedAt || null };
    }

    // Management score for senior PMO roles — based on team task completion, not
    // their own KPIs. Computed even without an employee record so a PMO who only
    // manages (no personal KPIs) still sees their management score.
    const resolvedRole = resolveRole(req.user.designation);
    if (resolvedRole === 'SENIOR' || resolvedRole === 'SUPER_ADMIN') {
      const pmoScore = await calcPMOScore(req.user.id);
      performance = performance || {
        overallScore: 0, totalKPIs: 0, completedTasks: 0, totalTasks: 0, kpis: [],
      };
      performance.managementScore = pmoScore.score;
      performance.teamTotalTasks = pmoScore.totalTasks;
      performance.teamCompletedTasks = pmoScore.completedTasks;
      performance.teamOverdueTasks = pmoScore.overdueTasks;
    }

    const unread = await Notification.count({ where: { userId: id, isRead: false } });

    res.json({
      user: { name: user.name, email: user.email, designation: user.jobTitle },
      employee: employee ? {
        employeeCode: employee.employeeCode,
        department: employee.department,
        designation: employee.designation,
        joinDate: employee.joinDate,
      } : null,
      leave,
      performance,
      documents,
      notifications: { unread },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };

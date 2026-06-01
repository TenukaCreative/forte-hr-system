const { User, Employee, LeaveRequest, Document, Notification } = require('../models');
const calcPerformance = require('../utils/calcPerformance');

const getDashboard = async (req, res, next) => {
  try {
    const { id } = req.user;

    const user = await User.findByPk(id, { attributes: ['name', 'email', 'role'] });
    const employee = await Employee.findOne({ where: { userId: id } });

    let leave = null;
    let performance = null;
    let documents = null;

    if (employee) {
      const leaveRecords = await LeaveRequest.findAll({ where: { employeeId: employee.id } });
      leave = {
        taken: leaveRecords
          .filter((l) => l.status === 'APPROVED')
          .reduce((s, l) => s + (l.totalDays || 0), 0),
        pending: leaveRecords.filter((l) => l.status === 'PENDING').length,
      };

      const perf = await calcPerformance(employee.id);
      performance = {
        overallScore: perf.overallScore,
        totalKPIs: perf.kpis.length,
        completedTasks: perf.kpis.reduce((s, k) => s + k.completedTasks, 0),
        totalTasks: perf.kpis.reduce((s, k) => s + k.totalTasks, 0),
        kpis: perf.kpis,
      };

      const docCount = await Document.count({ where: { employeeId: employee.id } });
      const latestDoc = await Document.findOne({
        where: { employeeId: employee.id },
        order: [['uploadedAt', 'DESC']],
        attributes: ['uploadedAt'],
      });
      documents = { total: docCount, latestUpload: latestDoc?.uploadedAt || null };
    }

    const unread = await Notification.count({ where: { userId: id, isRead: false } });

    res.json({
      user: { name: user.name, email: user.email, role: user.role },
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

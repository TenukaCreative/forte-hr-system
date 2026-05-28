const { LeaveRequest, Employee, User, Notification } = require('../models');

const requestLeave = async (req, res, next) => {
  try {
    const { startDate, endDate, leaveType, reason } = req.body;

    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) return res.status(400).json({ message: 'No employee record found. Contact HR.' });

    const totalDays = Math.ceil(
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
    ) + 1;

    const leave = await LeaveRequest.create({
      employeeId: employee.id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      status: 'PENDING',
    });

    const pmoUsers = await User.findAll({ where: { role: 'HEAD_OF_PMO', isActive: true } });
    await Promise.all(
      pmoUsers.map((u) =>
        Notification.create({
          userId: u.id,
          message: `${req.user.name} has submitted a leave request for ${startDate} to ${endDate}.`,
        })
      )
    );

    res.status(201).json(leave);
  } catch (err) {
    next(err);
  }
};

const getMyLeaves = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) return res.json([]);

    const leaves = await LeaveRequest.findAll({
      where: { employeeId: employee.id },
      order: [['createdAt', 'DESC']],
    });

    res.json(leaves);
  } catch (err) {
    next(err);
  }
};

const getAllLeaves = async (req, res, next) => {
  try {
    const leaves = await LeaveRequest.findAll({
      include: [{
        model: Employee,
        attributes: ['department', 'designation'],
        include: [{ model: User, attributes: ['name', 'email'] }],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json(leaves);
  } catch (err) {
    next(err);
  }
};

const approveLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id, {
      include: [{ model: Employee, include: [{ model: User, attributes: ['id', 'name'] }] }],
    });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.status !== 'PENDING') return res.status(400).json({ message: 'Can only approve pending requests' });

    await leave.update({ status: 'APPROVED', reviewedBy: req.user.id, reviewNote: req.body.note || null });

    if (leave.Employee?.User?.id) {
      await Notification.create({
        userId: leave.Employee.User.id,
        message: `Your leave request (${leave.startDate} to ${leave.endDate}) has been approved.`,
      });
    }

    res.json({ message: 'Leave approved successfully', leave });
  } catch (err) {
    console.error('Approve leave error:', err);
    res.status(500).json({ message: err.message });
  }
};

const rejectLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id, {
      include: [{ model: Employee, include: [{ model: User, attributes: ['id', 'name'] }] }],
    });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.status !== 'PENDING') return res.status(400).json({ message: 'Can only reject pending requests' });

    await leave.update({ status: 'REJECTED', reviewedBy: req.user.id, reviewNote: req.body.note || null });

    if (leave.Employee?.User?.id) {
      await Notification.create({
        userId: leave.Employee.User.id,
        message: `Your leave request (${leave.startDate} to ${leave.endDate}) has been rejected.`,
      });
    }

    res.json({ message: 'Leave rejected successfully', leave });
  } catch (err) {
    console.error('Reject leave error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { requestLeave, getMyLeaves, getAllLeaves, approveLeave, rejectLeave };

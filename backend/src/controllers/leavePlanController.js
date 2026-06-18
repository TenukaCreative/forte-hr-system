const { LeavePlan, User, Notification } = require('../models');
const { sendLeavePlanNotification } = require('../services/emailService');

// Count working days between two dates inclusive, excluding Saturdays/Sundays.
// Copied from leaveController.js intentionally (kept self-contained here).
const countWorkingDays = (start, end) => {
  let count = 0;
  const current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// POST /api/leave-plans
// Employee submits a new leave plan
const createLeavePlan = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, note } = req.body;

    const userRecord = await User.findByPk(req.user.id);
    if (!userRecord || !userRecord.managerId) {
      return res.status(400).json({ error: 'No reporting manager assigned. Contact HR.' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // startDate must not be in the past (compare at local midnight).
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(`${startDate}T00:00:00`);
    if (start < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    const daysCount = countWorkingDays(startDate, endDate);
    if (daysCount === 0) {
      return res.status(400).json({ error: 'Leave plan dates must fall on working days' });
    }

    const plan = await LeavePlan.create({
      employeeId: req.user.id,
      managerId: userRecord.managerId,
      leaveType,
      startDate,
      endDate,
      daysCount,
      note,
    });

    const created = await LeavePlan.findByPk(plan.id, {
      include: [{ model: User, as: 'employee',
        attributes: ['id', 'name', 'email', 'jobTitle'] }],
    });

    // Email the reporting manager (best-effort — never block the response).
    try {
      const manager = await User.findByPk(userRecord.managerId,
        { attributes: ['email', 'name'] }
      );
      if (manager?.email) {
        await sendLeavePlanNotification({
          managerEmail: manager.email,
          employeeName: req.user.name,
          leaveType: leaveType,
          startDate: startDate,
          endDate: endDate,
          daysCount: daysCount,
          note: note || '',
          senderAccessToken: userRecord.msAccessToken,
        });
      }
    } catch (emailErr) {
      console.error('Leave plan notification failed:', emailErr);
      // Non-blocking — do not fail the request
    }

    // In-app notification for the manager (same pattern as other controllers:
    // Notification has only userId + message — there is no type column).
    try {
      await Notification.create({
        userId: userRecord.managerId,
        message: `${req.user.name} has submitted a leave plan from ${startDate} to ${endDate}`,
      });
    } catch (notifyErr) {
      console.error('Leave plan in-app notification failed:', notifyErr);
      // Non-blocking — do not fail the request
    }

    res.status(201).json(created);
  } catch (err) {
    console.error('CREATE LEAVE PLAN ERROR:', err);
    next(err);
  }
};

// GET /api/leave-plans/my
// Employee sees their own plans
const getMyPlans = async (req, res, next) => {
  try {
    const plans = await LeavePlan.findAll({
      where: { employeeId: req.user.id },
      include: [{ model: User, as: 'employee',
        attributes: ['id', 'name', 'email', 'jobTitle'] }],
      order: [['startDate', 'ASC']],
    });
    res.json(plans);
  } catch (err) {
    next(err);
  }
};

// GET /api/leave-plans/team
// Manager sees all plans from their direct reports
const getTeamPlans = async (req, res, next) => {
  try {
    const plans = await LeavePlan.findAll({
      where: { managerId: req.user.id },
      include: [{ model: User, as: 'employee',
        attributes: ['id', 'name', 'email', 'jobTitle'] }],
      order: [['startDate', 'ASC']],
    });
    res.json(plans);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/leave-plans/:id
// Employee deletes one of their own plans
const deleteLeavePlan = async (req, res, next) => {
  try {
    const plan = await LeavePlan.findOne({
      where: { id: req.params.id, employeeId: req.user.id },
    });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(plan.startDate);
    if (start <= today) {
      return res.status(400).json({ error: 'Cannot delete a plan that has already started or passed' });
    }

    await plan.destroy();
    res.json({ message: 'Leave plan deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLeavePlan,
  getMyPlans,
  getTeamPlans,
  deleteLeavePlan,
};

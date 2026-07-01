const { Op } = require('sequelize');
const { LeaveRequest, LeaveEntitlement, User } = require('../models');
const resolveRole = require('../utils/resolveRole');
const { sendEmail } = require('../services/emailService');

// Parse a yyyy-mm-dd string as local midnight (not UTC midnight), so the
// weekday is not shifted back a day in timezones ahead of UTC (e.g. Colombo).
const parseLocalDate = (dateStr) => new Date(`${dateStr}T00:00:00`);

// Count working days between two dates inclusive, excluding Saturdays/Sundays.
const countWorkingDays = (start, end) => {
  let count = 0;
  const current = parseLocalDate(start);
  const endDate = parseLocalDate(end);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// ── ENTITLEMENTS ──────────────────────────────────────────────

// POST /api/leaves/entitlement
// HR assigns entitlement to an employee for a year
const assignEntitlement = async (req, res, next) => {
  try {
    const { employeeId, year, totalDays } = req.body;
    const existing = await LeaveEntitlement.findOne({
      where: { employeeId, year },
    });
    if (existing) {
      await existing.update({ totalDays, assignedBy: req.user.id });
      return res.json(existing);
    }
    const entitlement = await LeaveEntitlement.create({
      employeeId,
      year,
      totalDays: totalDays || 18.0,
      assignedBy: req.user.id,
    });
    res.status(201).json(entitlement);
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/entitlement/:employeeId
// Get entitlement for current year for an employee
const getEntitlement = async (req, res, next) => {
  try {
    const year = new Date().getFullYear();
    const entitlement = await LeaveEntitlement.findOne({
      where: { employeeId: req.params.employeeId, year },
    });
    res.json(entitlement || { totalDays: 0, usedDays: 0, year });
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/entitlement/me
// Current user views their own entitlement for the current year
const getMyEntitlement = async (req, res, next) => {
  try {
    const year = new Date().getFullYear();
    const entitlement = await LeaveEntitlement.findOne({
      where: { employeeId: req.user.id, year },
    });
    res.json(entitlement || { totalDays: 0, usedDays: 0, year });
  } catch (err) {
    next(err);
  }
};

// ── LEAVE REQUESTS ────────────────────────────────────────────

// POST /api/leaves/request
// Employee submits a leave request
const submitRequest = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employeeId = req.user.id;
    const year = new Date(startDate).getFullYear();

    // Check entitlement exists
    const entitlement = await LeaveEntitlement.findOne({
      where: { employeeId, year },
    });
    if (!entitlement) {
      return res.status(400).json({
        message: 'No leave entitlement assigned for this year. Contact HR.',
      });
    }

    // Validate the range falls on working days (exclude weekends).
    const workingDays = countWorkingDays(startDate, endDate);
    if (workingDays === 0) {
      return res.status(400).json({ error: 'Leave dates must fall on working days' });
    }

    // Reject if the employee already has a non-rejected request covering any of
    // the same dates.
    const overlapping = await LeaveRequest.findOne({
      where: {
        employeeId: req.user.id,
        status: { [Op.notIn]: ['REJECTED'] },
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate },
      },
    });

    if (overlapping) {
      return res.status(400).json({
        error: `You already have a ${overlapping.status.toLowerCase().replace('_', ' ')} leave request from ${overlapping.startDate} to ${overlapping.endDate} that overlaps with these dates. Please cancel it first before submitting a new request.`,
      });
    }

    // Calculate days — a half day is always 0.5; otherwise use the working
    // day count (weekends excluded), not the raw calendar day difference.
    let daysCount;
    if (leaveType === 'HALF_DAY') {
      daysCount = 0.5;
    } else {
      daysCount = workingDays;
    }

    // Sum days from all non-rejected active requests for this employee this year
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    const pendingDays = await LeaveRequest.sum('daysCount', {
      where: {
        employeeId: req.user.id,
        status: { [Op.in]: ['PENDING', 'MANAGER_APPROVED'] },
        startDate: {
          [Op.between]: [yearStart, yearEnd]
        }
      }
    }) || 0;

    const effectiveUsed = parseFloat(entitlement.usedDays) + parseFloat(pendingDays);

    const totalDays = parseFloat(entitlement.totalDays);
    if (effectiveUsed + workingDays > totalDays) {
      return res.status(400).json({
        error: `Insufficient leave balance. You have ${totalDays - effectiveUsed} days available (including pending requests).`
      });
    }

    // Get reporting manager
    const employee = await User.findByPk(employeeId);
    const managerId = employee?.managerId || null;

    const request = await LeaveRequest.create({
      employeeId,
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason,
      managerId,
      status: 'PENDING',
      managerStatus: 'PENDING',
      approverStatus: 'PENDING',
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/my
// Employee views their own requests
const getMyRequests = async(req,res,next) =>{
  try{
    const requests = await LeaveRequest.findAll({
      where: {employeeId: req.user.id},
      include: [{
        model: User,
        as: 'manager',
        attributes: ['id', 'name'],
      }],
      order: [['createdAt', 'DESC']],
    });
    res.json(requests);
  }
  catch(err){
    next(err);
  }
};

// GET /api/leaves/pending-manager
// Reporting manager sees requests from direct reports at Step 1
const getPendingForManager = async (req, res, next) => {
  try {
    const requests = await LeaveRequest.findAll({
      where: { managerId: req.user.id, managerStatus: 'PENDING' },
      include: [{ model: User, as: 'employee',
        attributes: ['id', 'name', 'email', 'jobTitle'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/leaves/:id/manager-review
// Reporting manager approves or rejects (Step 1)
const managerReview = async (req, res, next) => {
  try {
    const { status, note } = req.body; // APPROVED or REJECTED
    const request = await LeaveRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.managerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updates = {
      managerStatus: status,
      managerNote: note || null,
    };

    if (status === 'APPROVED') {
      updates.status = 'MANAGER_APPROVED';
      updates.approverStatus = 'PENDING';
    } else {
      updates.status = 'REJECTED';
    }

    await request.update(updates);
    res.json(request);
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/pending-approval
// HR Manager / Super Admin sees all manager-approved requests
const getPendingApproval = async (req, res, next) => {
  try {
    const requests = await LeaveRequest.findAll({
      where: { status: 'MANAGER_APPROVED', approverStatus: 'PENDING' },
      include: [
        { model: User, as: 'employee',
          attributes: ['id', 'name', 'email', 'jobTitle'] },
        { model: User, as: 'manager',
          attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/leaves/:id/final-review
// HR Manager / Super Admin final approval (Step 2)
const finalReview = async (req, res, next) => {
  try {
    const { status, note } = req.body; // APPROVED or REJECTED
    const request = await LeaveRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'MANAGER_APPROVED') {
      return res.status(400).json({
        message: 'Request has not been approved by manager yet.',
      });
    }

    const updates = {
      approverStatus: status,
      approverNote: note || null,
      approverId: req.user.id,
    };

    if (status === 'APPROVED') {
      updates.status = 'APPROVED';
      // Deduct balance
      const year = new Date(request.startDate).getFullYear();
      const entitlement = await LeaveEntitlement.findOne({
        where: { employeeId: request.employeeId, year },
      });
      if (entitlement) {
        await entitlement.update({
          usedDays: parseFloat(entitlement.usedDays) + parseFloat(request.daysCount),
        });
      }
    } else {
      updates.status = 'REJECTED';
    }

    await request.update(updates);
    res.json(request);
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/all
// HR Manager / Super Admin sees all requests
const getAllRequests = async (req, res, next) => {
  try {
    const requests = await LeaveRequest.findAll({
      include: [
        { model: User, as: 'employee',
          attributes: ['id', 'name', 'email', 'jobTitle'] },
        { model: User, as: 'manager',
          attributes: ['id', 'name'] },
        { model: User, as: 'approver',
          attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/team
// Reporting manager sees ALL requests (any status) from their direct reports
const getTeamRequests = async (req, res, next) => {
  try {
    const requests = await LeaveRequest.findAll({
      where: { managerId: req.user.id },
      include: [
        { model: User, as: 'employee',
          attributes: ['id', 'name', 'email', 'jobTitle'] },
        { model: User, as: 'manager',
          attributes: ['id', 'name'] },
        { model: User, as: 'approver',
          attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/team-approved
// Reporting manager sees the full approved-leave history for their direct
// reports (not just leave active today), ordered by start date.
const getTeamApprovedLeaves = async (req, res, next) => {
  try {
    const requests = await LeaveRequest.findAll({
      where: {
        managerId: req.user.id,
        status: 'APPROVED',
      },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'jobTitle'],
        },
      ],
      order: [['startDate', 'ASC']],
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

// ── LEAVE DOCUMENTS ───────────────────────────────────────────

// POST /api/leaves/:id/document
// Employee attaches a supporting document to their own request
const uploadLeaveDocument = async (req, res, next) => {
  try {
    const request = await LeaveRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Not found' });
    if (request.employeeId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { uploadToBlob } = require('../utils/azureBlob');
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file provided' });

    const url = await uploadToBlob(
      file.originalname,
      file.buffer,
      file.mimetype,
      'leaves'
    );
    await request.update({ documentUrl: url });
    res.json({ documentUrl: url });
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/:id/document
// Returns a short-lived SAS URL for the attached document
const getLeaveDocument = async (req, res, next) => {
  try {
    const request = await LeaveRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Not found' });
    if (!request.documentUrl) {
      return res.status(404).json({ message: 'No document attached' });
    }
    const { generateSasUrl } = require('../utils/azureBlob');
    const sasUrl = await generateSasUrl(request.documentUrl, 'leaves');
    res.json({ url: sasUrl });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/leaves/:id
// Employee cancels (deletes) their own leave request before it starts
const deleteLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the leave request and verify ownership
    const leaveRequest = await LeaveRequest.findOne({
      where: { id, employeeId: req.user.id },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Cannot delete if already fully approved
    if (leaveRequest.status === 'APPROVED') {
      return res.status(400).json({
        error: 'Cannot delete an approved leave request. Contact HR.',
      });
    }

    // Cannot delete if start date has passed or is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(leaveRequest.startDate);
    if (startDate <= today) {
      return res.status(400).json({
        error: 'Cannot delete a leave request that has already started or passed.',
      });
    }

    // Store details before deletion for notification
    const employeeName = leaveRequest.employee.name;
    const managerEmail = leaveRequest.manager?.email;
    const leaveType = leaveRequest.leaveType;
    const start = leaveRequest.startDate;
    const end = leaveRequest.endDate;

    // Delete the record
    await leaveRequest.destroy();

    // Send notification email to manager if manager exists. Follows the same
    // emailService / MS Graph sendMail pattern used elsewhere in the project.
    if (managerEmail) {
      try {
        await sendEmail({
          subject: 'Leave Request Cancelled',
          bodyHtml: `<p>${employeeName} has cancelled their ${leaveType} leave request from ${start} to ${end}.</p>`,
        });
      } catch (emailErr) {
        console.error('Delete leave notification failed:', emailErr);
        // Non-blocking — do not fail the request
      }
    }

    return res.json({ message: 'Leave request deleted successfully' });
  } catch (err) {
    console.error('DELETE LEAVE REQUEST ERROR:', err);
    next(err);
  }
};

module.exports = {
  assignEntitlement,
  getEntitlement,
  getMyEntitlement,
  submitRequest,
  getMyRequests,
  getPendingForManager,
  managerReview,
  getPendingApproval,
  finalReview,
  getAllRequests,
  getTeamRequests,
  getTeamApprovedLeaves,
  uploadLeaveDocument,
  getLeaveDocument,
  deleteLeaveRequest,
};

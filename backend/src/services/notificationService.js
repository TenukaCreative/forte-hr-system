const {sendEmail,wrap} = require('./emailService');
const { KPI, Task, Employee, User, Team, Notification, KPIEvaluation } = require('../models');

// -----------------------------------------------
//KPI
//------------------------------------------------

// KPI assigned to an employee
const notifyKpiAssigned = async (employee, kpi) => {
  if (!employee?.User?.id) return;

  // In-app notification
  await Notification.create({
    userId: employee.User.id,
    message: `New KPI assigned: ${kpi.title}.${kpi.endDate ? ` Due: ${kpi.endDate}` : ''}`,
  });

  // Email notification
  await sendEmail({
    subject: `New KPI Assigned — ${kpi.title}`,
    bodyHtml: wrap(
      'New KPI Assigned',
      `<p>A new KPI has been assigned to ${employee.User.name || 'you'}:
        <strong>${kpi.title}</strong>.
        Target score: ${kpi.targetScore ?? '—'}.
        ${kpi.endDate ? `Due: ${kpi.endDate}.` : ''}</p>`
    ),
    toEmail: employee.User.email,
  });
};
// KPI deleted to an employee
const notifyKpiDeleted = async(employee,kpi) =>{
    if(!employee?.User?.id) return;

    //in app notificaiton
    await Notification.create({
        userId: employee.User.id,
        message: `${kpi.title} is deleted`
    });

    //email notification
    await sendEmail({
        subject:`Deleted KPI ${kpi.title}`,
        bodyHtml: wrap(
            `Kpi is deleted`,
            `<p> ${kpi.title} is been deleted</p>`
        ),
        toEmail: employee.User.email,
    });
};

// KPI updated to an employee
const notifyKpiUpdated = async (employee,kpi) =>{
    if(!employee?.User?.id) return;

    //in app notificaiton
    await Notification.create({
        userId: employee.User.id,
        message: `kpi title is updated to ${kpi.title}`
    });

    //email notification
    await sendEmail({
         subject:`Updated KPI ${kpi.title}`,
        bodyHtml: wrap(
            `Kpi title is updated`,
            `<p> ${kpi.title} is been updated </p>`
        ),
        toEmail: employee.User.email,
    })
}

const notifySelfEvalSubmitted = async (employee, kpi, managerUser) => {
  if (!employee?.User?.id) return;

  await Notification.create({
    userId: kpi.assignedBy,
    message: `${employee.User.name} submitted a self evaluation for KPI: ${kpi.title}`,
  });

  await sendEmail({
    subject: `Self Evaluation Submitted — ${kpi.title}`,
    bodyHtml: wrap(
      'Self Evaluation Submitted',
      `<p>${employee.User.name} has submitted a self evaluation for KPI: <strong>${kpi.title}</strong>. Please review and submit your manager evaluation.</p>`
    ),
    toEmail: managerUser?.email,
  });
};

const notifyManagerEvalDone = async (employee, kpi) => {
  if (!employee?.User?.id) return;

  await Notification.create({
    userId: employee.User.id,
    message: `Your manager has evaluated your KPI: ${kpi.title}. Status: Closed.`,
  });

  await sendEmail({
    subject: `KPI Evaluated — ${kpi.title}`,
    bodyHtml: wrap(
      'KPI Evaluation Complete',
      `<p>Your manager has completed the evaluation for your KPI: <strong>${kpi.title}</strong>. The KPI has been closed.</p>`
    ),
    toEmail: employee.User.email,
  });
};

// task assigned to an employee
const nofifyKpiTaskAssigned = async (employee,kpi,task)=>{
        if(!employee?.User.id) return;

        //in app notificatoin
        await Notification.create({
            userId: employee.User.id,
            message: ` ${task.title} added to ${kpi.title}`
        })

        //email notification
        await sendEmail({
            subject:`New Task added`,
        bodyHtml: wrap(
            `${task.title} is added to  ${kpi.name}`,
            `<p> ${task.title} </p>`
            `<p> ${task.description} </p>`
        )
        })
}
// Employee submitted leave request — notify manager
const notifyLeaveSubmitted = async (employeeUser, managerUser, request) => {
  if (!managerUser?.id) return;
  await Notification.create({
    userId: managerUser.id,
    message: `${employeeUser.name} submitted a ${request.leaveType} leave request from ${request.startDate} to ${request.endDate}.`,
  });

  await sendEmail({
    subject: 'New Leave Request Submitted',
    bodyHtml: wrap(
      'New Leave Request',
      `<p>${employeeUser.name} has submitted a ${request.leaveType} leave request from ${request.startDate} to ${request.endDate}.</p>`
    ),
    toEmail: managerUser?.email,
  });
};

// Manager reviewed leave request — notify employee
const notifyManagerReviewed = async (employeeUser, request, status) => {
  if (!employeeUser?.id) return;
  const action = status === 'APPROVED' ? 'approved' : 'rejected';
  await Notification.create({
    userId: employeeUser.id,
    message: `Your leave request from ${request.startDate} to ${request.endDate} has been ${action} by your manager.`,
  });

  await sendEmail({
    subject: `Leave Request ${action === 'approved' ? 'Approved' : 'Rejected'} by Manager`,
    bodyHtml: wrap(
      `Leave Request ${action === 'approved' ? 'Approved ✓' : 'Rejected ✗'}`,
      `<p>Your leave request from ${request.startDate} to ${request.endDate} has been ${action} by your manager.</p>`,
      action === 'approved' ? '#065F46' : '#C8203D'
    ),
    toEmail: employeeUser?.email,
  });
};

// HR final reviewed leave request — notify employee
const notifyFinalReviewed = async (employeeUser, request, status) => {
  if (!employeeUser?.id) return;
  const action = status === 'APPROVED' ? 'approved' : 'rejected';
  await Notification.create({
    userId: employeeUser.id,
    message: `Your leave request from ${request.startDate} to ${request.endDate} has been finally ${action} by HR.`,
  });

  await sendEmail({
    subject: `Leave Request Finally ${action === 'approved' ? 'Approved' : 'Rejected'} by HR`,
    bodyHtml: wrap(
      `Leave ${action === 'approved' ? 'Approved ✓' : 'Rejected ✗'}`,
      `<p>Your leave request from ${request.startDate} to ${request.endDate} has been finally ${action} by HR.</p>`,
      action === 'approved' ? '#065F46' : '#C8203D'
    ),
    toEmail: employeeUser?.email,
  });
};

// Employee cancelled leave request — notify manager
const notifyLeaveCancelled = async (employeeUser, managerUser, request) => {
  if (!managerUser?.id) return;
  await Notification.create({
    userId: managerUser.id,
    message: `${employeeUser.name} cancelled their ${request.leaveType} leave request from ${request.startDate} to ${request.endDate}.`,
  });

  await sendEmail({
    subject: 'Leave Request Cancelled',
    bodyHtml: wrap(
      'Leave Request Cancelled',
      `<p>${employeeUser.name} has cancelled their ${request.leaveType} leave request from ${request.startDate} to ${request.endDate}.</p>`
    ),
    toEmail: managerUser?.email,
  });
};

module.exports = {
  notifyKpiAssigned,
  notifyKpiDeleted,
  notifyKpiUpdated,
  notifySelfEvalSubmitted,
  notifyManagerEvalDone,
  nofifyKpiTaskAssigned,
  notifyLeaveSubmitted,
  notifyManagerReviewed,
  notifyFinalReviewed,
  notifyLeaveCancelled
};
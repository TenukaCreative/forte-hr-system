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
        )
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
        )
    })
}

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
module.exports = {
  notifyKpiAssigned,
  notifyKpiDeleted,
  notifyKpiUpdated,
  nofifyKpiTaskAssigned
};
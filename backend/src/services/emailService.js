const axios = require('axios');
const { User } = require('../models');

const GRAPH = process.env.GRAPH_API_ENDPOINT || 'https://graph.microsoft.com/v1.0';

// For testing, every email is sent FROM this mailbox and TO this address,
// regardless of who triggered the action or who the real recipient is.
const TEST_SENDER_EMAIL = 'hrstest1@forteinsurance.com'; // HARDCODED FOR TESTING
const TEST_RECIPIENT_EMAIL = 'Tenuka@CreativeSoftware.com'; // HARDCODED FOR TESTING

// Core send routine. Looks up the hardcoded test sender, uses their stored
// MS Graph access token, and sends to the hardcoded test recipient.
// Extra fields (e.g. senderId/toEmail from legacy callers) are ignored on
// purpose — sender and recipient are always the hardcoded test values.
const sendEmail = async ({ subject, bodyHtml }) => {
  // 1. Look up the sender user from the DB by email.
  const sender = await User.findOne({
    where: { email: TEST_SENDER_EMAIL }, // HARDCODED FOR TESTING
    attributes: ['id', 'email', 'msAccessToken'],
  });

  // 2. Use that user's stored msAccessToken. If missing, warn and return.
  if (!sender?.msAccessToken) {
    console.warn(`[emailService] No msAccessToken for test sender ${TEST_SENDER_EMAIL}; skipping email.`);
    return;
  }

  // 5. Wrap the Graph call so email failure never breaks the main action.
  try {
    await axios.post(
      `${GRAPH}/me/sendMail`,
      {
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: bodyHtml,
          },
          toRecipients: [
            // 3. Recipient is always the hardcoded test address.
            { emailAddress: { address: TEST_RECIPIENT_EMAIL } }, // HARDCODED FOR TESTING
          ],
        },
        saveToSentItems: false,
      },
      {
        headers: {
          Authorization: `Bearer ${sender.msAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('[emailService] Failed to send email:', err.message);
  }
};

// Shared HTML wrapper for a simple, branded email body.
const wrap = (heading, inner, color = '#C8203D') => `
  <div style="font-family:Inter,sans-serif;padding:24px">
    <h2 style="color:${color}">${heading}</h2>
    ${inner}
    <p>View details in Forte TrackIT.</p>
  </div>
`;

// ---- Trigger functions ----
// Each builds a relevant subject + simple HTML body and calls the core
// sendEmail. `employee` is the (real) subject of the event; recipient is
// always overridden to the hardcoded test address inside sendEmail.

const sendLeaveSubmittedEmail = (employee, leaveData = {}) =>
  sendEmail({
    subject: `Leave Request Submitted — ${employee?.name || 'Employee'}`,
    bodyHtml: wrap(
      'Leave Request Submitted',
      `<p>${employee?.name || 'An employee'} has submitted a leave request
        (${leaveData.leaveType || 'Leave'}) from ${leaveData.startDate || '—'}
        to ${leaveData.endDate || '—'}.</p>`
    ),
  });

const sendLeaveApprovedEmail = (employee, leaveData = {}) =>
  sendEmail({
    subject: 'Leave Request Approved',
    bodyHtml: wrap(
      'Leave Approved ✓',
      `<p>${employee?.name || 'Your'} leave request from ${leaveData.startDate || '—'}
        to ${leaveData.endDate || '—'} has been approved.
        ${leaveData.reviewNote ? `Note: ${leaveData.reviewNote}` : ''}</p>`,
      '#065F46'
    ),
  });

const sendLeaveRejectedEmail = (employee, leaveData = {}) =>
  sendEmail({
    subject: 'Leave Request Rejected',
    bodyHtml: wrap(
      'Leave Rejected ✗',
      `<p>${employee?.name || 'Your'} leave request from ${leaveData.startDate || '—'}
        to ${leaveData.endDate || '—'} has been rejected.
        ${leaveData.reviewNote ? `Note: ${leaveData.reviewNote}` : ''}</p>`
    ),
  });

const sendLeavePlanNotification = async ({
  managerEmail,
  employeeName,
  leaveType,
  startDate,
  endDate,
  daysCount,
  note,
  senderAccessToken, // eslint-disable-line no-unused-vars
}) =>
  // Follows the same pattern as the other leave emails: build subject + body
  // and delegate to sendEmail. (sendEmail uses the hardcoded test sender /
  // recipient, so managerEmail and senderAccessToken are accepted for API
  // parity with the caller but not used for routing — same as every other
  // trigger in this file.)
  sendEmail({
    subject: 'New Leave Plan Submitted',
    bodyHtml: wrap(
      'New Leave Plan Submitted',
      `<p>${employeeName || 'An employee'} has submitted a leave plan.</p>
        <p>Type: ${leaveType || '—'}<br/>
        From: ${startDate || '—'} to ${endDate || '—'} (${daysCount ?? 0} working days)</p>
        ${note ? `<p>Note: ${note}</p>` : ''}
        <p>This is a leave plan only and does not require your approval.</p>`,
      '#7288FA'
    ),
  });

const sendKpiAssignedEmail = (employee, kpiData = {}) =>
  sendEmail({
    subject: `New KPI Assigned — ${kpiData.title || 'KPI'}`,
    bodyHtml: wrap(
      'New KPI Assigned',
      `<p>A new KPI has been assigned to ${employee?.name || 'you'}:
        <strong>${kpiData.title || 'KPI'}</strong>.
        Target: ${kpiData.targetScore ?? '—'}.
        ${kpiData.endDate ? `Due: ${kpiData.endDate}.` : ''}</p>`
    ),
  });

const sendPerformanceReviewEmail = (employee, reviewData = {}) =>
  sendEmail({
    subject: `Performance Review — ${reviewData.period || ''}`.trim(),
    bodyHtml: wrap(
      'Performance Review Submitted',
      `<p>A performance review for ${employee?.name || 'you'}
        ${reviewData.period ? `(${reviewData.period})` : ''} has been submitted.
        Score: ${reviewData.score ?? reviewData.ethicsScore ?? '—'}/100.</p>`
    ),
  });

const sendEthicsReviewEmail = (employee, reviewData = {}) =>
  sendEmail({
    subject: `Ethics Review Submitted — ${reviewData.period || ''}`.trim(),
    bodyHtml: wrap(
      'Ethics Review Submitted',
      `<p>An ethics review for ${employee?.name || 'you'}
        ${reviewData.period ? `(${reviewData.period})` : ''} has been submitted.
        Score: ${reviewData.ethicsScore ?? '—'}/100.</p>`
    ),
  });

// Legacy templates — still used by taskController for task-assignment emails.
const templates = {
  taskAssigned: (taskTitle, kpiTitle, etaDate) => ({
    subject: `New Task Assigned — ${taskTitle}`,
    bodyHtml: wrap(
      'New Task Assigned',
      `<table style="margin:16px 0">
        <tr><td style="padding:4px 16px 4px 0;font-weight:600">Task</td><td>${taskTitle}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600">KPI</td><td>${kpiTitle}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600">Due Date</td><td>${etaDate}</td></tr>
      </table>`
    ),
  }),
};

module.exports = {
  sendEmail,
  templates,
  sendLeaveSubmittedEmail,
  sendLeaveApprovedEmail,
  sendLeaveRejectedEmail,
  sendLeavePlanNotification,
  sendKpiAssignedEmail,
  sendPerformanceReviewEmail,
  sendEthicsReviewEmail,
};

const axios = require('axios');
const { User } = require('../models');

const GRAPH = process.env.GRAPH_API_ENDPOINT || 'https://graph.microsoft.com/v1.0';

// Get a valid token for the sender.
const getSenderToken = async (senderId) => {
  const user = await User.findByPk(senderId, {
    attributes: ['msAccessToken', 'msTokenExpiry', 'email'],
  });

  if (!user?.msAccessToken) {
    throw new Error('No access token for sender');
  }

  return user.msAccessToken;
};

// Send email via MS Graph on behalf of the sender.
const sendEmail = async ({
  senderId, // userId of sender
  toEmail,  // recipient email
  subject,
  bodyHtml, // HTML email body
}) => {
  try {
    if (!toEmail) {
      console.error('Email send skipped: no recipient address');
      return false;
    }

    const token = await getSenderToken(senderId);

    await axios.post(
      `${GRAPH}/me/sendMail`,
      {
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: bodyHtml,
          },
          toRecipients: [{
            emailAddress: { address: toEmail },
          }],
        },
        saveToSentItems: false,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Email sent to ${toEmail}`);
    return true;
  } catch (err) {
    // Log but don't throw — email failure must never block the main action.
    console.error('Email send failed:', err.response?.data || err.message);
    return false;
  }
};

// Email templates
const templates = {
  leaveSubmitted: (employeeName, startDate, endDate, leaveType) => ({
    subject: `Leave Request — ${employeeName}`,
    bodyHtml: `
      <div style="font-family:Inter,sans-serif;padding:24px">
        <h2 style="color:#C8203D">Leave Request Submitted</h2>
        <p>${employeeName} has submitted a leave request:</p>
        <table style="margin:16px 0">
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">Type</td><td>${leaveType}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">From</td><td>${startDate}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">To</td><td>${endDate}</td></tr>
        </table>
        <p>Please review in Forte TrackIT.</p>
      </div>
    `,
  }),

  leaveDecision: (status, startDate, endDate, reviewNote) => ({
    subject: `Leave ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
    bodyHtml: `
      <div style="font-family:Inter,sans-serif;padding:24px">
        <h2 style="color:${status === 'APPROVED' ? '#065F46' : '#C8203D'}">
          Leave ${status === 'APPROVED' ? 'Approved ✓' : 'Rejected ✗'}
        </h2>
        <p>Your leave request has been ${status.toLowerCase()}:</p>
        <table style="margin:16px 0">
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">From</td><td>${startDate}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">To</td><td>${endDate}</td></tr>
          ${reviewNote ? `<tr><td style="padding:4px 16px 4px 0;font-weight:600">Note</td><td>${reviewNote}</td></tr>` : ''}
        </table>
        <p>View details in Forte TrackIT.</p>
      </div>
    `,
  }),

  kpiAssigned: (employeeName, kpiTitle, targetScore, etaDate) => ({
    subject: `New KPI Assigned — ${kpiTitle}`,
    bodyHtml: `
      <div style="font-family:Inter,sans-serif;padding:24px">
        <h2 style="color:#C8203D">New KPI Assigned</h2>
        <p>A new KPI has been assigned to you:</p>
        <table style="margin:16px 0">
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">KPI</td><td>${kpiTitle}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">Target Score</td><td>${targetScore}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">Due Date</td><td>${etaDate}</td></tr>
        </table>
        <p>View in Forte TrackIT.</p>
      </div>
    `,
  }),

  taskAssigned: (taskTitle, kpiTitle, etaDate) => ({
    subject: `New Task Assigned — ${taskTitle}`,
    bodyHtml: `
      <div style="font-family:Inter,sans-serif;padding:24px">
        <h2 style="color:#C8203D">New Task Assigned</h2>
        <p>A new task has been assigned to you:</p>
        <table style="margin:16px 0">
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">Task</td><td>${taskTitle}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">KPI</td><td>${kpiTitle}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">Due Date</td><td>${etaDate}</td></tr>
        </table>
        <p>View in Forte TrackIT.</p>
      </div>
    `,
  }),

  ethicsReview: (employeeName, period, ethicsScore) => ({
    subject: `Ethics Review Submitted — ${period}`,
    bodyHtml: `
      <div style="font-family:Inter,sans-serif;padding:24px">
        <h2 style="color:#C8203D">Ethics Review Submitted</h2>
        <p>Your ethics review for ${period} has been submitted:</p>
        <table style="margin:16px 0">
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">Period</td><td>${period}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">Score</td><td>${ethicsScore}/100</td></tr>
        </table>
        <p>View full review in Forte TrackIT.</p>
      </div>
    `,
  }),

  performanceReview: (employeeName, period, score) => ({
    subject: `Performance Review — ${period}`,
    bodyHtml: `
      <div style="font-family:Inter,sans-serif;padding:24px">
        <h2 style="color:#C8203D">Performance Review Submitted</h2>
        <p>Your performance review for ${period} has been completed:</p>
        <table style="margin:16px 0">
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">Period</td><td>${period}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-weight:600">Score</td><td>${score}/100</td></tr>
        </table>
        <p>View details in Forte TrackIT.</p>
      </div>
    `,
  }),
};

module.exports = { sendEmail, templates };

const axios = require('axios');
const { User } = require('../models');
const { decrypt } = require('../utils/encryption');

const GRAPH = process.env.GRAPH_API_ENDPOINT || 'https://graph.microsoft.com/v1.0';

const getOutlookEvents = async (userId) => {
  try {
    const user = await User.findByPk(userId, { attributes: ['msAccessToken'] });

    if (!user?.msAccessToken) {
      return [];
    }

    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString();

    const { data } = await axios.get(`${GRAPH}/me/events`, {
      headers: {
        Authorization: `Bearer ${decrypt(user.msAccessToken)}`,
        'Content-Type': 'application/json',
      },
      params: {
        $filter: `start/dateTime ge '${threeMonthsAgo}' and start/dateTime le '${threeMonthsAhead}'`,
        $select: 'subject,start,end,bodyPreview,isAllDay',
        $top: 100,
        $orderby: 'start/dateTime asc',
      },
    });

    return (data.value || []).map((e) => ({
      id: e.id,
      title: e.subject,
      start: e.start.dateTime || e.start.date,
      end: e.end.dateTime || e.end.date,
      isAllDay: e.isAllDay,
      type: 'OUTLOOK',
      preview: e.bodyPreview,
    }));
  } catch (err) {
    console.error('Calendar fetch failed:', err.response?.data || err.message);
    return [];
  }
};

module.exports = { getOutlookEvents };

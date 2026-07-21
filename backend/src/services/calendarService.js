const axios = require('axios');

const GRAPH = process.env.GRAPH_API_ENDPOINT || 'https://graph.microsoft.com/v1.0';
const SHARED_CALENDAR_EMAIL = 'fortecalendar@forteinsurance.com';

const getAppToken = async () => {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    console.warn('Missing Azure credentials for shared calendar fetch');
    return null;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', 'https://graph.microsoft.com/.default');

  const { data } = await axios.post(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  return data.access_token;
};

const getSharedCalendarEvents = async () => {
  try {
    
    const now = new Date();
    const startDateTime = new Date(now.getFullYear(), 0, 1).toISOString();
    const endDateTime = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();

    const { data } = await axios.get(
      `${GRAPH}/users/${SHARED_CALENDAR_EMAIL}/calendarView`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          startDateTime,
          endDateTime,
          $select: 'subject,start,end,isAllDay',
          $top: 200,
          $orderby: 'start/dateTime asc',
        },
      }
    );

    return (data.value || []).map((e) => ({
      id: e.id,
      title: e.subject,
      start: e.start.dateTime || e.start.date,
      end: e.end.dateTime || e.end.date,
      isAllDay: e.isAllDay,
      type: 'SHARED_HOLIDAY',
    }));
  } catch (err) {
    console.error('Shared calendar fetch failed:', err.response?.data || err.message);
    return [];
  }
};

const getOutlookEvents = async (msToken) => {

  try {
    if (!msToken) return [];

    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString();

    const { data } = await axios.get(`${GRAPH}/me/events`, {
      headers: {
        Authorization: `Bearer ${msToken}`,
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

module.exports = { getOutlookEvents, getSharedCalendarEvents };

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getOutlookEvents } = require('../services/calendarService');

// GET /api/calendar/outlook
// Returns Outlook events for the logged-in user.
router.get('/outlook', auth, async (req, res, next) => {
  try {
    const msToken = req.headers['x-ms-token'];
    if (!msToken) return res.json([]);
    const events = await getOutlookEvents(msToken);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

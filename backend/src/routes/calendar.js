const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getOutlookEvents } = require('../services/calendarService');

// GET /api/calendar/outlook
// Returns Outlook events for the logged-in user.
router.get('/outlook', auth, async (req, res, next) => {
  try {
    const events = await getOutlookEvents(req.user.id);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

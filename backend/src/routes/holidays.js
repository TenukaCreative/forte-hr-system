const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authorizePermission } = require('../middleware/rbac');
const {
  getHolidays,
  loadFromApi,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  clearPublicHolidays,
} = require('../controllers/holidayController');

// All routes require authentication
router.use(auth);

// Public read — any logged in user can fetch holidays
// needed for calendar view and date picker blocking
router.get('/', getHolidays);

// HR only — manage holidays
router.post('/load-from-api', authorizePermission('manage_holidays'), loadFromApi);
router.post('/', authorizePermission('manage_holidays'), createHoliday);
router.put('/:id', authorizePermission('manage_holidays'), updateHoliday);
router.delete('/year/:year/public', authorizePermission('manage_holidays'), clearPublicHolidays);
router.delete('/:id', authorizePermission('manage_holidays'), deleteHoliday);

module.exports = router;

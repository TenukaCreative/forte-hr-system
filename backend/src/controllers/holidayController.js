const axios = require('axios');
const { PublicHoliday, User } = require('../models');

// GET /api/holidays?year=2026
const getHolidays = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const holidays = await PublicHoliday.findAll({
      where: { year },
      order: [['date', 'ASC']],
    });
    res.json(holidays);
  } catch (err) {
    next(err);
  }
};

// POST /api/holidays/load-from-api
// Fetches Cambodia public holidays from Calendarific and saves to DB
const loadFromApi = async (req, res, next) => {
  try {
    const year = parseInt(req.body.year) || new Date().getFullYear();

    // Check if already loaded for this year
    const existing = await PublicHoliday.findAll({
      where: { year, type: 'PUBLIC' },
    });
    if (existing.length > 0) {
      return res.status(400).json({
        message: `Public holidays for ${year} are already loaded. Delete them first to reload.`,
      });
    }

    // Call Calendarific API
    const { data } = await axios.get('https://calendarific.com/api/v2/holidays', {
      params: {
        api_key: process.env.CALENDARIFIC_API_KEY,
        country: 'KH',
        year,
      },
    });

    if (!data?.response?.holidays?.length) {
      return res.status(502).json({ message: 'No holidays returned from Calendarific API.' });
    }

    // Map API response to our model
    const holidays = data.response.holidays.map((h) => ({
      date: h.date.iso.split('T')[0],
      name: h.name,
      type: 'PUBLIC',
      year,
      description: h.description || null,
      createdBy: req.user.id,
    }));

    // Bulk insert
    await PublicHoliday.bulkCreate(holidays, { ignoreDuplicates: true });

    res.status(201).json({
      message: `${holidays.length} holidays loaded for ${year}`,
      count: holidays.length,
    });
  } catch (err) {
    if (err.response?.status === 401) {
      return res.status(502).json({ message: 'Invalid Calendarific API key.' });
    }
    next(err);
  }
};

// POST /api/holidays
// HR manually creates a single holiday
const createHoliday = async (req, res, next) => {
  try {
    const { date, name, type, description } = req.body;
    if (!date || !name) {
      return res.status(400).json({ message: 'Date and name are required.' });
    }
    const year = parseInt(date.split('-')[0]);
    const holiday = await PublicHoliday.create({
      date,
      name,
      type: type || 'COMPANY',
      year,
      description: description || null,
      createdBy: req.user.id,
    });
    res.status(201).json(holiday);
  } catch (err) {
    next(err);
  }
};

// PUT /api/holidays/:id
// HR edits a holiday
const updateHoliday = async (req, res, next) => {
  try {
    const holiday = await PublicHoliday.findByPk(req.params.id);
    if (!holiday) return res.status(404).json({ message: 'Holiday not found.' });
    const { date, name, type, description } = req.body;
    const updates = {};
    if (date) { updates.date = date; updates.year = parseInt(date.split('-')[0]); }
    if (name) updates.name = name;
    if (type) updates.type = type;
    if (description !== undefined) updates.description = description;
    await holiday.update(updates);
    res.json(holiday);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/holidays/:id
// HR deletes a single holiday
const deleteHoliday = async (req, res, next) => {
  try {
    const holiday = await PublicHoliday.findByPk(req.params.id);
    if (!holiday) return res.status(404).json({ message: 'Holiday not found.' });
    await holiday.destroy();
    res.json({ message: 'Holiday deleted.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/holidays/year/:year/public
// HR clears all PUBLIC holidays for a year (to allow reload from API)
const clearPublicHolidays = async (req, res, next) => {
  try {
    const year = parseInt(req.params.year);
    const count = await PublicHoliday.destroy({
      where: { year, type: 'PUBLIC' },
    });
    res.json({ message: `${count} public holidays cleared for ${year}.` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHolidays,
  loadFromApi,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  clearPublicHolidays,
};

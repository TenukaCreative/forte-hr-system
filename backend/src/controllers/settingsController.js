const { PerformanceSettings } = require('../models');

// GET /api/settings/performance — latest weights, or defaults if none saved yet
const getPerformanceSettings = async (req, res, next) => {
  try {
    const settings = await PerformanceSettings.findOne({
      order: [['createdAt', 'DESC']],
    });
    if (!settings) return res.json({ kpiWeight: 50, ethicsWeight: 50 });
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

// POST /api/settings/performance — save a new weights record
const savePerformanceSettings = async (req, res, next) => {
  try {
    const kpiWeight = Number(req.body.kpiWeight);
    const ethicsWeight = Number(req.body.ethicsWeight);

    if (Number.isNaN(kpiWeight) || Number.isNaN(ethicsWeight) || kpiWeight + ethicsWeight !== 100) {
      return res.status(400).json({ message: 'Weights must total 100%' });
    }

    const settings = await PerformanceSettings.create({
      createdBy: req.user.id,
      kpiWeight,
      ethicsWeight,
    });

    res.status(201).json(settings);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPerformanceSettings, savePerformanceSettings };

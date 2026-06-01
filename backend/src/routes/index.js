const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const employeeRoutes = require('./employees');
const documentRoutes = require('./documents');
const leaveRoutes = require('./leaves');
const dashboardRoutes = require('./dashboard');
const notificationRoutes = require('./notifications');
const teamRoutes = require('./teams');
const kpiRoutes = require('./kpis');
const taskRoutes = require('./tasks');

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/documents', documentRoutes);
router.use('/leaves', leaveRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/teams', teamRoutes);
router.use('/kpis', kpiRoutes);
router.use('/tasks', taskRoutes);

module.exports = router;

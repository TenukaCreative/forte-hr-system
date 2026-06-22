const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const employeeRoutes = require('./employees');
const documentRoutes = require('./documents');
const leaveRoutes = require('./leaves');
const leavePlanRoutes = require('./leavePlans');
const dashboardRoutes = require('./dashboard');
const notificationRoutes = require('./notifications');
const teamRoutes = require('./teams');
const kpiRoutes = require('./kpis');
const taskRoutes = require('./tasks');
const ethicsRoutes = require('./ethics');
const settingsRoutes = require('./settings');
const calendarRoutes = require('./calendar');
const rolesRoutes = require('./roles');

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/documents', documentRoutes);
router.use('/leaves', leaveRoutes);
router.use('/leave-plans', leavePlanRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/teams', teamRoutes);
router.use('/kpis', kpiRoutes);
router.use('/tasks', taskRoutes);
router.use('/ethics', ethicsRoutes);
router.use('/settings', settingsRoutes);
router.use('/calendar', calendarRoutes);
router.use('/roles', rolesRoutes);

module.exports = router;

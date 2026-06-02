const sequelize = require('../config/db');

const User = require('./User')(sequelize);
const Employee = require('./Employee')(sequelize);
const Document = require('./Document')(sequelize);
const LeaveRequest = require('./LeaveRequest')(sequelize);
const LeavePlan = require('./LeavePlan')(sequelize);
const KPI = require('./KPI')(sequelize);
const Task = require('./Task')(sequelize);
const Notification = require('./Notification')(sequelize);
const Team = require('./Team')(sequelize);
const TeamMember = require('./TeamMember')(sequelize);
const EthicsReview = require('./EthicsReview')(sequelize);
const PerformanceSettings = require('./PerformanceSettings')(sequelize);

// User <-> Employee
User.hasOne(Employee, { foreignKey: 'userId' });
Employee.belongsTo(User, { foreignKey: 'userId' });

// Employee <-> Document
Employee.hasMany(Document, { foreignKey: 'employeeId' });
Document.belongsTo(Employee, { foreignKey: 'employeeId' });
Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// Employee <-> LeaveRequest
Employee.hasMany(LeaveRequest, { foreignKey: 'employeeId' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employeeId' });
LeaveRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// Employee <-> LeavePlan
Employee.hasMany(LeavePlan, { foreignKey: 'employeeId' });
LeavePlan.belongsTo(Employee, { foreignKey: 'employeeId' });

// Employee <-> KPI
Employee.hasMany(KPI, { foreignKey: 'employeeId' });
KPI.belongsTo(Employee, { foreignKey: 'employeeId' });

// User <-> KPI (assigner)
User.hasMany(KPI, { foreignKey: 'assignedBy', as: 'assignedKPIs' });
KPI.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' });

// KPI <-> Task
KPI.hasMany(Task, { foreignKey: 'kpiId', as: 'tasks' });
Task.belongsTo(KPI, { foreignKey: 'kpiId' });

// Team <-> KPI
KPI.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });
Team.hasMany(KPI, { foreignKey: 'teamId' });

// User <-> Task (completedBy)
Task.belongsTo(User, { foreignKey: 'completedBy', as: 'completedByUser' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Team <-> User (creator)
Team.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Team, { foreignKey: 'createdBy' });

// Team <-> TeamMember <-> User
Team.hasMany(TeamMember, { foreignKey: 'teamId', onDelete: 'CASCADE' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId' });
TeamMember.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(TeamMember, { foreignKey: 'userId' });

// Employee <-> EthicsReview
Employee.hasMany(EthicsReview, { foreignKey: 'employeeId' });
EthicsReview.belongsTo(Employee, { foreignKey: 'employeeId' });
EthicsReview.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedBy' });

// User <-> PerformanceSettings (creator)
PerformanceSettings.belongsTo(User, { foreignKey: 'createdBy' });

module.exports = {
  sequelize,
  User,
  Employee,
  Document,
  LeaveRequest,
  LeavePlan,
  KPI,
  Task,
  Notification,
  Team,
  TeamMember,
  EthicsReview,
  PerformanceSettings,
};

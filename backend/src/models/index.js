const sequelize = require('../config/db');

const User = require('./User')(sequelize);
const Employee = require('./Employee')(sequelize);
const Document = require('./Document')(sequelize);
const LeaveRequest = require('./LeaveRequest')(sequelize);
const LeaveEntitlement = require('./LeaveEntitlement')(sequelize);
const LeavePlan = require('./LeavePlan')(sequelize);
const KPI = require('./KPI')(sequelize);
const Task = require('./Task')(sequelize);
const Notification = require('./Notification')(sequelize);
const Team = require('./Team')(sequelize);
const TeamMember = require('./TeamMember')(sequelize);
const EthicsReview = require('./EthicsReview')(sequelize);
const PerformanceSettings = require('./PerformanceSettings')(sequelize);
const Role = require('./Role')(sequelize);
const RolePermission = require('./RolePermission')(sequelize);

// User <-> Employee
User.hasOne(Employee, { foreignKey: 'userId' });
Employee.belongsTo(User, { foreignKey: 'userId' });

// Employee <-> Document
Employee.hasMany(Document, { foreignKey: 'employeeId' });
Document.belongsTo(Employee, { foreignKey: 'employeeId' });
Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// LeaveRequest <-> User (employeeId references the User; plus manager/approver)
LeaveRequest.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });
LeaveRequest.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
LeaveRequest.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

// LeaveEntitlement <-> User
LeaveEntitlement.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });
LeaveEntitlement.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedByUser' });

// LeavePlan <-> User (employee + reporting manager at time of planning)
LeavePlan.belongsTo(User, { as: 'employee', foreignKey: 'employeeId' });
LeavePlan.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });
User.hasMany(LeavePlan, { as: 'leavePlans', foreignKey: 'employeeId' });

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

// Role <-> RolePermission, and User <-> Role (assigned role)
Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'permissions' });
RolePermission.belongsTo(Role, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'assignedRoleId', as: 'assignedRole' });
Role.hasMany(User, { foreignKey: 'assignedRoleId' });

module.exports = {
  sequelize,
  User,
  Employee,
  Document,
  LeaveRequest,
  LeaveEntitlement,
  LeavePlan,
  KPI,
  Task,
  Notification,
  Team,
  TeamMember,
  EthicsReview,
  PerformanceSettings,
  Role,
  RolePermission,
};

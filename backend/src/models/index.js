const sequelize = require('../config/db');

const User = require('./User')(sequelize);
const Employee = require('./Employee')(sequelize);
const Document = require('./Document')(sequelize);
const LeaveRequest = require('./LeaveRequest')(sequelize);
const LeavePlan = require('./LeavePlan')(sequelize);
const PerformanceEval = require('./PerformanceEval')(sequelize);

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

// Employee <-> PerformanceEval
Employee.hasMany(PerformanceEval, { foreignKey: 'employeeId' });
PerformanceEval.belongsTo(Employee, { foreignKey: 'employeeId' });
PerformanceEval.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
PerformanceEval.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

module.exports = {
  sequelize,
  User,
  Employee,
  Document,
  LeaveRequest,
  LeavePlan,
  PerformanceEval,
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaveRequest = sequelize.define('LeaveRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    leaveType: {
      type: DataTypes.ENUM(
        'ANNUAL',
        'FULL_DAY',
        'HALF_DAY',
        'CHANGE',
        'HOSPITALIZATION',
        'MATERNITY',
        'SICK',
        'SPECIAL'
      ),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    daysCount: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    documentUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Step 1 — Reporting Manager
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    managerStatus: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    managerNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Step 2 — HR Manager / Super Admin
    approverId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    approverStatus: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    approverNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Overall status
    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'MANAGER_APPROVED',
        'APPROVED',
        'REJECTED'
      ),
      defaultValue: 'PENDING',
    },
  });

  return LeaveRequest;
};

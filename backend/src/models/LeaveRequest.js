const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaveRequest = sequelize.define('LeaveRequest', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    employeeId: {
      type: DataTypes.UUID,
      references: { model: 'Employees', key: 'id' },
    },
    leaveType: {
      type: DataTypes.ENUM('ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'UNPAID'),
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    totalDays: {
      type: DataTypes.INTEGER,
    },
    reason: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    reviewedBy: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
      allowNull: true,
    },
    reviewNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });

  return LeaveRequest;
};

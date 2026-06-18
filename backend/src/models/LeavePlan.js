const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeavePlan = sequelize.define('LeavePlan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    },
    // Reporting manager at the time of planning — copied from user.managerId
    // on creation.
    managerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
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
    // Working days only, excluding weekends.
    daysCount: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return LeavePlan;
};

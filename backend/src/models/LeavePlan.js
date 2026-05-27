const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeavePlan = sequelize.define('LeavePlan', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    employeeId: {
      type: DataTypes.UUID,
      references: { model: 'Employees', key: 'id' },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 12 },
    },
    plannedDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    actualDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    timestamps: true,
  });

  return LeavePlan;
};

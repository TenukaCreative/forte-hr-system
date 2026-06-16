const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaveEntitlement = sequelize.define('LeaveEntitlement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalDays: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 18.0,
      allowNull: false,
    },
    usedDays: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 0.0,
      allowNull: false,
    },
    assignedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['employeeId', 'year'],
      },
    ],
  });

  return LeaveEntitlement;
};

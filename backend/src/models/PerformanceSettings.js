const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PerformanceSettings = sequelize.define('PerformanceSettings', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    // kpiWeight + ethicsWeight must total 100
    kpiWeight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 50.00,
    },
    ethicsWeight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 50.00,
    },
  }, {
    timestamps: true,
  });

  return PerformanceSettings;
};

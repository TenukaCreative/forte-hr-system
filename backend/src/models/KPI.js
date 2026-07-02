const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const KPI = sequelize.define('KPI', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Employees', key: 'id' },
    },
    assignedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Teams', key: 'id' },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // KPI deadline / ETA
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    targetScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'PENDING_REVIEW', 'CLOSED'),
      defaultValue: 'ACTIVE',
    },
  }, {
    timestamps: true,
  });

  return KPI;
};

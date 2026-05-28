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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    quarter: {
      type: DataTypes.ENUM('Q1', 'Q2', 'Q3', 'Q4'),
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    targetScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'CLOSED'),
      defaultValue: 'ACTIVE',
    },
  }, {
    timestamps: true,
  });

  return KPI;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PerformanceEval = sequelize.define('PerformanceEval', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    employeeId: {
      type: DataTypes.UUID,
      references: { model: 'Employees', key: 'id' },
    },
    quarter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 4 },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reviewerId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
    },
    approverId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
      allowNull: true,
    },
    kpiScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'SUBMITTED', 'APPROVED'),
      defaultValue: 'DRAFT',
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });

  return PerformanceEval;
};

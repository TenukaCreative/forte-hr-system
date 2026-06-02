const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EthicsReview = sequelize.define('EthicsReview', {
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
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    period: {
      type: DataTypes.STRING,
      allowNull: false,
      // e.g. "Q2-2026"
    },

    // Performance Metrics (80pts total)
    timeliness:          { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 20pts
    workQuality:         { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 20pts
    workDiscipline:      { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 15pts
    ownership:           { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 15pts
    collaboration:       { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 10pts
    productOwnership:    { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 10pts
    businessDevelopment: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 5pts
    learningImprovement: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 5pts

    // Behavioral Metrics (20pts total)
    behavioralMetrics:   { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 5pts
    attitude:            { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 5pts
    effort:              { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 5pts
    trust:               { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, // 5pts

    // Auto-calculated on save (0-100)
    ethicsScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });

  return EthicsReview;
};

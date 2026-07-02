const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const KPIEvaluation = sequelize.define('KPIEvaluation', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    kpiId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'KPIs', key: 'id' },
      onDelete: 'CASCADE',
    },
    selfRating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    selfComment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    selfSubmittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    managerRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 },
    },
    managerComment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    managerReviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
    },
  }, {
    timestamps: true,
  });

  return KPIEvaluation;
};

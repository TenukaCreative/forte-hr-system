const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PublicHoliday = sequelize.define('PublicHoliday', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('PUBLIC', 'COMPANY'),
      allowNull: false,
      defaultValue: 'PUBLIC',
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'PublicHolidays',
    timestamps: true,
  });

  return PublicHoliday;
};

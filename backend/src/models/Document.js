const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    employeeId: {
      type: DataTypes.UUID,
      references: { model: 'Employees', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('CV', 'JD', 'KPI', 'OTHER'),
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploadedBy: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
    },
  }, {
    timestamps: true,
  });

  return Document;
};

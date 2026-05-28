const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
    },
    employeeCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
    },
    designation: {
      type: DataTypes.STRING,
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emergencyContact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emergencyPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profilePhoto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    joinDate: {
      type: DataTypes.DATEONLY,
    },
  }, {
    timestamps: true,
  });

  return Employee;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RolePermission = sequelize.define('RolePermission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    permissionKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'RolePermissions',
    timestamps: false,
  });

  return RolePermission;
};

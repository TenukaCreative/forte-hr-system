const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    // Will be enforced NOT NULL once Azure AD integration is live
    azureId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // MS Graph access token, cached so the app can send mail and read the
    // user's Outlook calendar on their behalf. Refreshed on each login.
    msAccessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    msTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Self-reference to the user's manager. Typed UUID (not INTEGER) to match
    // the UUID primary key it references.
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    isProvisioned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    profilePhotoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });

  User.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });
  User.hasMany(User, { as: 'directReports', foreignKey: 'managerId' });

  return User;
};

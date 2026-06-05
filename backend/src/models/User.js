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
    // DEV ONLY — role comes from AD token in production,
    // remove this field when AD integration is complete
    role: {
      type: DataTypes.ENUM('IT', 'HR_MANAGER', 'HEAD_OF_PMO', 'PM', 'BA', 'SUPER_ADMIN'),
      allowNull: true,
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
  }, {
    timestamps: true,
  });

  return User;
};

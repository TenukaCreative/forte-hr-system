const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TeamMember = sequelize.define('TeamMember', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Teams', key: 'id' },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
  }, {
    timestamps: true,
    uniqueKeys: {
      unique_team_member: {
        fields: ['teamId', 'userId'],
      },
    },
  });

  return TeamMember;
};

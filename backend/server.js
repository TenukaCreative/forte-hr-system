require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./src/models');
const { seedRoles } = require('./src/utils/seedRoles');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    // TODO: switch to migrations before production deploy
    await sequelize.sync({ alter: true });
    console.log('Models synced successfully.');
    await seedRoles();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
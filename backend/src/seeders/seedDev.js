require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize, User } = require('../models');

const DEV_USERS = [
  { azureId: 'dev-it-001',  email: 'it.dev@forte.lk',  name: 'Dev IT Admin',    isActive: true, role: 'IT'          },
  { azureId: 'dev-hr-001',  email: 'hr.dev@forte.lk',  name: 'Dev HR Manager',  isActive: true, role: 'HR_MANAGER'  },
  { azureId: 'dev-pmo-001', email: 'pmo.dev@forte.lk', name: 'Dev Head of PMO', isActive: true, role: 'HEAD_OF_PMO' },
  { azureId: 'dev-pm-001',  email: 'pm.dev@forte.lk',  name: 'Dev PM',          isActive: true, role: 'PM'          },
  { azureId: 'dev-ba-001',  email: 'ba.dev@forte.lk',  name: 'Dev BA',          isActive: true, role: 'BA'          },
];

(async () => {
  try {
    await sequelize.authenticate();

    for (const userData of DEV_USERS) {
      const user = await User.findOne({ where: { azureId: userData.azureId } });
      if (user) {
        await user.update(userData);
      } else {
        await User.create(userData);
      }
    }

    console.log('✅ Dev users seeded successfully');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();

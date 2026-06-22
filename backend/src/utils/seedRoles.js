const { Role, RolePermission } = require('../models');

const SYSTEM_ROLES = [
  {
    name: 'Super Admin',
    isSystem: true,
    description: 'Full system access',
    permissions: [
      'dashboard', 'leave_management', 'leave_overview',
      'employee_management', 'team_performance',
      'performance_evaluation', 'company_calendar',
      'role_management',
    ],
  },
  {
    name: 'HR Administrator',
    isSystem: true,
    description: 'HR full access',
    permissions: [
      'dashboard', 'leave_management', 'leave_overview',
      'employee_management', 'team_performance',
      'performance_evaluation', 'company_calendar',
      'role_management',
    ],
  },
  {
    name: 'HR Manager',
    isSystem: true,
    description: 'HR management access',
    permissions: [
      'dashboard', 'leave_management', 'leave_overview',
      'employee_management', 'team_performance',
      'performance_evaluation', 'company_calendar',
      'role_management',
    ],
  },
  {
    name: 'Administrator',
    isSystem: true,
    description: 'System administrator access',
    permissions: [
      'dashboard', 'leave_management', 'leave_overview',
      'employee_management', 'team_performance',
      'performance_evaluation', 'company_calendar',
      'role_management',
    ],
  },
];

async function seedRoles() {
  try {
    for (const roleData of SYSTEM_ROLES) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: {
          isSystem: roleData.isSystem,
          description: roleData.description,
        },
      });

      if (created) {
        const permRows = roleData.permissions.map((key) => ({
          roleId: role.id,
          permissionKey: key,
        }));
        await RolePermission.bulkCreate(permRows);
        console.log(`[Seed] Created system role: ${roleData.name}`);
      } else {
        console.log(`[Seed] Role already exists, skipping: ${roleData.name}`);
      }
    }
  } catch (err) {
    console.error('[Seed] Failed to seed roles:', err.message);
  }
}

module.exports = { seedRoles };

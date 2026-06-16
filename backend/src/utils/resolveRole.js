function resolveRole(designation) {
  if (!designation) return 'STAFF';
  const lower = designation.trim().toLowerCase();

  if (lower === 'super admin') return 'SUPER_ADMIN';
  if (lower === 'hr manager') return 'HR_MANAGER';
  if (lower.startsWith('head of') || lower.endsWith('lead')) return 'SENIOR';
  if (lower === 'project manager' || lower === 'pm') return 'PMO_MEMBER';
  if (lower === 'business analyst' || lower === 'ba') return 'PMO_MEMBER';

  return 'STAFF';
}

module.exports = resolveRole;

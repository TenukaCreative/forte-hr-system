
const authorizePermission = (...permissionKeys) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }

    // SUPER_ADMIN bypass — designation
    // detected from AD always gets through
    const designation = (
      req.user.designation || ''
    ).toLowerCase().trim().replace(/\s+/g, ' ');

    const isSuperUser =
      designation.includes('super admin') ||
      designation.includes('superadmin') ||
      designation.includes('hr manager') ||
      designation.includes('hr administrator') ||
      designation === 'administrator';

    if (isSuperUser) return next();

    // Check permissions array from JWT
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissionKeys.some(
      key => userPermissions.includes(key)
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: 'Forbidden: insufficient permissions'
      });
    }

    return next();
  };
};

module.exports = {
  authorizePermission  // add new export
};

const resolveRole = require('../utils/resolveRole');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const resolvedRole = resolveRole(req.user?.designation);
    if (!allowedRoles.includes(resolvedRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

module.exports = { authorize };

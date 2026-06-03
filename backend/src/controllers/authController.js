const jwt = require('jsonwebtoken');
const { User } = require('../models');

// DEV ONLY — remove before production
const devLogin = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Access denied. Contact IT.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account deactivated.' });
    }

    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/microsoft/callback
// Receives the Azure AD token from the frontend after MSAL redirect.
// Extracts email, name, and role from the AD token claims,
// then finds or creates the user record by azureId.
// Role is intentionally NOT stored in the DB — it comes from AD on every login.
const microsoftCallback = async (req, res, next) => {
  try {
    // TODO: implement when AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
    // are provided by Forte IT. Steps:
    //   1. Validate the incoming AD token with MSAL / passport-azure-ad
    //   2. Destructure: { oid: azureId, email, name, roles } from token claims
    //   3. const [user] = await User.findOrCreate({
    //        where: { azureId },
    //        defaults: { azureId, email, name, isActive: true },
    //      });
    //   4. If user.email changed, update it (AD is source of truth)
    //   5. Issue JWT: { id, email, name, role } where role = roles[0] from AD
    res.status(501).json({ message: 'Azure AD SSO not yet configured' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
// Role/id/email come from the JWT, but name is pulled fresh from the DB so it
// reflects HR edits made after the user's last login (the JWT name is stale).
const me = async (req, res, next) => {
  try {
    const dbUser = await User.findByPk(req.user.id, { attributes: ['name'] });
    res.json({ ...req.user, name: dbUser?.name ?? req.user.name });
  } catch (err) {
    next(err);
  }
};

module.exports = { devLogin, microsoftCallback, me };

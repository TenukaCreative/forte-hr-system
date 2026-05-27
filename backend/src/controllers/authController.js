const jwt = require('jsonwebtoken');
const { User } = require('../models');

// TODO: Replace local login with Azure AD SSO when AZURE_TENANT_ID, AZURE_CLIENT_ID,
// and AZURE_CLIENT_SECRET are provided by Forte IT

const login = async (req, res, next) => {
  try {
    const { email, role, name } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'email and role are required' });
    }

    const [user] = await User.findOrCreate({
      where: { email },
      defaults: { email, role, name: name || email.split('@')[0] },
    });

    user.lastLogin = new Date();
    await user.save();

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    });
  } catch (err) {
    next(err);
  }
};

const me = (req, res) => {
  res.json(req.user);
};

module.exports = { login, me };

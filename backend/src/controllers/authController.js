const jwt = require('jsonwebtoken');
const axios = require('axios');
const { User, Employee } = require('../models');

const getGraphProfile = async (accessToken) => {
  const { data } = await axios.get(
    `${process.env.GRAPH_API_ENDPOINT}/me`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        $select: 'id,displayName,mail,userPrincipalName,jobTitle,department',
      },
    }
  );
  return data;
};

const issueJwt = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    designation: user.jobTitle || null,
  };
  return {
    token: jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }),
    user: payload,
  };
};

const microsoftCallback = async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ message: 'Access token is required.' });
    }

    let profile;
    try {
      profile = await getGraphProfile(accessToken);
    } catch (err) {
      console.error('MS Graph error:', err.response?.data || err.message);
      return res.status(401).json({ message: 'Invalid or expired Azure AD token.' });
    }

    const azureId = profile.id;
    const email = profile.mail || profile.userPrincipalName;
    const name = profile.displayName;
    const designation = profile.jobTitle || null;
    const department = profile.department || null;

    if (!azureId || !email) {
      return res.status(400).json({ message: 'Incomplete profile from Azure AD.' });
    }

    let user = await User.findOne({ where: { azureId } });
    if (!user) {
      user = await User.create({
        azureId,
        email,
        name,
        isActive: true,
        jobTitle: profile.jobTitle,
      });
      console.log(`New user provisioned from AD: ${email}`);
    } else {
      await user.update({ email, name, jobTitle: profile.jobTitle });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact IT.' });
    }

    const existingEmployee = await Employee.findOne({ where: { userId: user.id } });
    if (existingEmployee) {
      const adUpdates = {};
      if (designation && existingEmployee.designation !== designation) adUpdates.designation = designation;
      if (department && existingEmployee.department !== department) adUpdates.department = department;
      if (Object.keys(adUpdates).length > 0) {
        await existingEmployee.update(adUpdates);
        console.log(`Employee record synced from AD for: ${email}`);
      }
    } else {
      await Employee.create({
        userId: user.id,
        employeeCode: `PENDING-${user.id.slice(0, 8)}`,
        designation,
        department,
      });
      console.log(`Employee record auto-created on first login for: ${email}`);
    }

    // Store the MS Graph access token so the app can send mail and read the
    // user's Outlook calendar on their behalf (token lasts ~60 min).
    // Also sync the AD hierarchy fields onto the User record and mark it
    // provisioned, now that the profile has been confirmed from Azure AD.
    const tokenExpiry = new Date(Date.now() + 55 * 60 * 1000); // refresh 5 min early
    const userUpdates = {
      msAccessToken: accessToken,
      msTokenExpiry: tokenExpiry,
      isProvisioned: true,
    };
    if (department) userUpdates.department = department;
    if (designation) userUpdates.jobTitle = designation;
    await user.update(userUpdates);

    // Fetch the user's reporting manager from AD and link the hierarchy.
    // Not every user has a manager set in AD — a 404 (or any error) is
    // expected/tolerated here and must never break the login flow.
    try {
      const { data: managerData } = await axios.get(
        `${process.env.GRAPH_API_ENDPOINT}/me/manager`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { $select: 'displayName,mail,jobTitle,department' },
        }
      );

      const managerEmail = managerData.mail;
      if (managerEmail) {
        let managerUser = await User.findOne({ where: { email: managerEmail } });
        if (!managerUser) {
          managerUser = await User.create({
            name: managerData.displayName,
            email: managerEmail,
            jobTitle: managerData.jobTitle || null,
            department: managerData.department || null,
            isProvisioned: false,
          });
          console.log(`Manager stub created from AD: ${managerEmail}`);
        }

        await User.update(
          { managerId: managerUser.id },
          { where: { email } }
        );
      }
    } catch (err) {
      // 404 = no manager assigned in AD; swallow it and continue (managerId
      // stays null). Log anything unexpected, but never fail the login.
      if (err.response?.status !== 404) {
        console.error('MS Graph manager fetch failed:', err.response?.data || err.message);
      }
    }

    const { token, user: userPayload } = issueJwt(user);
    return res.json({ token, user: userPayload });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const dbUser = await User.findByPk(req.user.id, {
      attributes: ['name', 'jobTitle', 'isActive'],
    });
    if (!dbUser || !dbUser.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact IT.' });
    }
    res.json({
      ...req.user,
      name: dbUser.name ?? req.user.name,
      designation: dbUser.jobTitle ?? req.user.designation,
    });
  } catch (err) {
    console.error('GET /auth/me failed:', err);
    next(err);
  }
};

module.exports = { microsoftCallback, me };

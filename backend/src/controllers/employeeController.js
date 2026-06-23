const { User, Employee, Document } = require('../models');

const getEmployees = async (req, res, next) => {
  try {
    const users = await User.findAll({
      include: [{ model: Employee, required: false }],
      order: [['name', 'ASC']],
    });

    const result = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      designation: u.jobTitle,
      isActive: u.isActive,
      employee: u.Employee ? {
        id: u.Employee.id,
        employeeCode: u.Employee.employeeCode,
        department: u.Employee.department,
        designation: u.Employee.designation,
        joinDate: u.Employee.joinDate,
      } : null,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Lightweight user list for dropdowns (team members, KPI assignment).
// Includes the employee id so PMO screens can assign KPIs without the
// full HR-only employee listing.
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'jobTitle'],
      where: { isActive: true },
      include: [{ model: Employee, attributes: ['id'], required: false }],
      order: [['name', 'ASC']],
    });

    res.json(users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      designation: u.jobTitle,
      employee: u.Employee ? { id: u.Employee.id } : null,
    })));
  } catch (err) {
    next(err);
  }
};

const getEmployee = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email', 'jobTitle', 'department', 'profilePhotoUrl'],
          required: false,
        },
      ],
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const employee = await Employee.findOne({ where: { userId } });
    const documents = employee
      ? await Document.findAll({ where: { employeeId: employee.id }, order: [['uploadedAt', 'DESC']] })
      : [];

    res.json({ user, employee, documents });
  } catch (err) {
    next(err);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const existing = await Employee.findOne({ where: { userId } });
    if (existing) return res.status(400).json({ message: 'Employee record already exists for this user' });

    const { name, employeeCode, department, designation, joinDate, contactNumber, address, emergencyContact, emergencyPhone } = req.body;

    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (Object.keys(userUpdates).length) {
      await User.update(userUpdates, { where: { id: userId } });
    }
    const employee = await Employee.create({ userId, employeeCode, department, designation, joinDate, contactNumber, address, emergencyContact, emergencyPhone });

    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const employee = await Employee.findOne({ where: { userId } });
    if (!employee) return res.status(404).json({ message: 'Employee record not found' });

    const { name, employeeCode, department, designation, joinDate, contactNumber, address, emergencyContact, emergencyPhone } = req.body;

    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (Object.keys(userUpdates).length) {
      await User.update(userUpdates, { where: { id: userId } });
    }
    await employee.update({ employeeCode, department, designation, joinDate, contactNumber, address, emergencyContact, emergencyPhone });

    res.json(employee);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/employees/profile
// Any logged-in user updates their own contact number and join date only.
const updateMyProfile = async (req, res) => {
  try {
    const { contactNumber, joinDate } = req.body;
    const userId = req.user.id;

    const employee = await Employee.findOne({ where: { userId } });

    if (!employee) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    await employee.update({
      contactNumber: contactNumber || employee.contactNumber,
      joinDate: joinDate || employee.joinDate,
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('updateMyProfile error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// GET /api/employees/profile-status
// Any logged-in user reads their own profile-completion state.
const getProfileStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, { attributes: ['assignedRoleId'] });
    const employee = await Employee.findOne({ where: { userId } });

    const assignedRoleId = user?.assignedRoleId || null;
    const contactNumber = employee?.contactNumber || null;
    const joinDate = employee?.joinDate || null;
    const isComplete = !!assignedRoleId && !!contactNumber && !!joinDate;

    res.json({ assignedRoleId, contactNumber, joinDate, isComplete });
  } catch (err) {
    console.error('getProfileStatus error:', err);
    res.status(500).json({ message: 'Failed to fetch profile status' });
  }
};

// GET /api/employees/my-reports
// Any logged-in user lists their own active direct reports.
const getMyDirectReports = async (req, res, next) => {
  try {
    const { User, Employee } = require('../models');

    const directReports = await User.findAll({
      where: {
        managerId: req.user.id,
        isActive: true,
      },
      attributes: ['id', 'name', 'email', 'jobTitle'],
      include: [{
        model: Employee,
        attributes: ['id', 'designation', 'department'],
        required: false,
      }],
    });

    const result = directReports.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      designation: u.jobTitle || u.Employee?.designation,
      employeeId: u.Employee?.id || null,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getEmployees, getAllUsers, getEmployee, createEmployee, updateEmployee, updateMyProfile, getProfileStatus, getMyDirectReports };

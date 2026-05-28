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
      role: u.role,
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

const getEmployee = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
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

    const { employeeCode, department, designation, joinDate, contactNumber, address, emergencyContact, emergencyPhone } = req.body;
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

    const { employeeCode, department, designation, joinDate, contactNumber, address, emergencyContact, emergencyPhone } = req.body;
    await employee.update({ employeeCode, department, designation, joinDate, contactNumber, address, emergencyContact, emergencyPhone });

    res.json(employee);
  } catch (err) {
    next(err);
  }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee };

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authorizePermission } =
  require('../middleware/rbac');
const { Role, RolePermission } =
  require('../models');

// GET all roles (with their permissions)
router.get(
  '/',
  auth,
  authorizePermission('role_management'),
  async (req, res) => {
    try {
      const roles = await Role.findAll({
        include: [{
          model: RolePermission,
          as: 'permissions',
          attributes: ['permissionKey'],
        }],
        order: [['createdAt', 'ASC']],
      });
      res.json(roles);
    } catch (err) {
      res.status(500).json({
        message: 'Failed to fetch roles'
      });
    }
  }
);

// POST create a new role
router.post(
  '/',
  auth,
  authorizePermission('role_management'),
  async (req, res) => {
    try {
      const { name, description, permissions } = req.body;

      if (!name || !permissions || !permissions.length) {
        return res.status(400).json({
          message: 'Name and permissions are required'
        });
      }

      const existing = await Role.findOne({
        where: { name }
      });
      if (existing) {
        return res.status(409).json({
          message: 'Role name already exists'
        });
      }

      const role = await Role.create({
        name,
        description,
        isSystem: false
      });

      const permRows = permissions.map(key => ({
        roleId: role.id,
        permissionKey: key,
      }));
      await RolePermission.bulkCreate(permRows);

      const created = await Role.findOne({
        where: { id: role.id },
        include: [{
          model: RolePermission,
          as: 'permissions',
          attributes: ['permissionKey'],
        }],
      });

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({
        message: 'Failed to create role'
      });
    }
  }
);

// PATCH update a role's permissions
router.patch(
  '/:id',
  auth,
  authorizePermission('role_management'),
  async (req, res) => {
    try {
      const role = await Role.findByPk(req.params.id);
      if (!role) {
        return res.status(404).json({
          message: 'Role not found'
        });
      }
      if (role.isSystem) {
        return res.status(403).json({
          message: 'System roles cannot be modified'
        });
      }

      const { name, description, permissions } = req.body;

      await role.update({ name, description });

      await RolePermission.destroy({
        where: { roleId: role.id }
      });

      if (permissions && permissions.length) {
        const permRows = permissions.map(key => ({
          roleId: role.id,
          permissionKey: key,
        }));
        await RolePermission.bulkCreate(permRows);
      }

      const updated = await Role.findOne({
        where: { id: role.id },
        include: [{
          model: RolePermission,
          as: 'permissions',
          attributes: ['permissionKey'],
        }],
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({
        message: 'Failed to update role'
      });
    }
  }
);

// DELETE a role (non-system only)
router.delete(
  '/:id',
  auth,
  authorizePermission('role_management'),
  async (req, res) => {
    try {
      const role = await Role.findByPk(req.params.id);
      if (!role) {
        return res.status(404).json({
          message: 'Role not found'
        });
      }
      if (role.isSystem) {
        return res.status(403).json({
          message: 'System roles cannot be deleted'
        });
      }

      await RolePermission.destroy({
        where: { roleId: role.id }
      });
      await role.destroy();

      res.json({ message: 'Role deleted successfully' });
    } catch (err) {
      res.status(500).json({
        message: 'Failed to delete role'
      });
    }
  }
);

// PATCH assign role to a user
router.patch(
  '/assign/:userId',
  auth,
  authorizePermission('role_management'),
  async (req, res) => {
    try {
      const { User } = require('../models');
      const { roleId } = req.body;

      const user = await User.findByPk(req.params.userId);
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      await user.update({ assignedRoleId: roleId || null });

      res.json({
        message: 'Role assigned successfully',
        userId: user.id,
        assignedRoleId: roleId || null,
      });
    } catch (err) {
      res.status(500).json({
        message: 'Failed to assign role'
      });
    }
  }
);

module.exports = router;

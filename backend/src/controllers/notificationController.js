const { Notification } = require('../models');

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read — mark a single notification as read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all — mark all of this user's notifications as read
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notifications/clear-all — hard-delete all of this user's notifications
const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.destroy({ where: { userId: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, clearAllNotifications };

const Notification = require('../models/notificationModel');

//  @desc    Get logged-in user's notifications
//  @route   GET /api/notifications?unreadOnly=true
//  @access  Private
const getNotifications = async (req, res) => {
  const { unreadOnly, page = 1, limit = 20 } = req.query;

  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .populate('triggeredBy', 'name profileImage')
      .populate('relatedProject', 'title')
      .populate('relatedTask', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    notifications,
  });
};

//  @desc    Get unread notification count (for navbar badge)
//  @route   GET /api/notifications/unread-count
//  @access  Private
const getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.status(200).json({ success: true, count });
};

//  @desc    Mark a single notification as read
//  @route   PUT /api/notifications/:id/read
//  @access  Private
const markAsRead = async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id, // Ensures users can only mark their own notifications
  });

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    return next(error);
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({ success: true, notification });
};

//  @desc    Mark all notifications as read
//  @route   PUT /api/notifications/read-all
//  @access  Private
const markAllAsRead = async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({ success: true, message: 'All notifications marked as read' });
};

//  @desc    Delete a notification
//  @route   DELETE /api/notifications/:id
//  @access  Private
const deleteNotification = async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ success: true, message: 'Notification deleted' });
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All notification routes require authentication
router.use(protect);

//  Static routes (must come before /:id) 

// @route   GET /api/notifications/unread-count
router.get('/unread-count', getUnreadCount);

// @route   PUT /api/notifications/read-all
router.put('/read-all', markAllAsRead);

//  Collection route 

// @route   GET /api/notifications?unreadOnly=true
router.get('/', getNotifications);

//  Dynamic ID routes 

// @route   PUT /api/notifications/:id/read
router.put('/:id/read', markAsRead);

// @route   DELETE /api/notifications/:id
router.delete('/:id', deleteNotification);

module.exports = router;
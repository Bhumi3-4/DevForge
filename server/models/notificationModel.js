const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: {
        values: ['task-assigned', 'join-request-received', 'request-accepted', 'request-rejected'],
        message: 'Invalid notification type',
      },
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional references — only the relevant one(s) are set, depending on type
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },

    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },

    relatedApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
    },

    // The user who triggered this notification (e.g. who applied, who assigned)
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes 
// Fetching a user's notifications, newest first, is the dominant query pattern
notificationSchema.index({ recipient: 1, createdAt: -1 });
// Fast "unread count" queries
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
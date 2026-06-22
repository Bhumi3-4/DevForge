const Notification = require('../models/notificationModel');

/**
 * Creates a notification. Designed to never throw — notification failures
 * should never break the primary action (e.g. a task assignment should still
 * succeed even if the notification insert fails for some reason).
 *
 * @param {Object} params
 * @param {string} params.recipient - User ID receiving the notification
 * @param {string} params.type - One of the Notification model's enum values
 * @param {string} params.message - Human-readable notification text
 * @param {string} [params.triggeredBy] - User ID who caused this notification
 * @param {string} [params.relatedProject] - Project ID, if applicable
 * @param {string} [params.relatedTask] - Task ID, if applicable
 * @param {string} [params.relatedApplication] - Application ID, if applicable
 */
const notify = async ({
  recipient,
  type,
  message,
  triggeredBy = null,
  relatedProject = null,
  relatedTask = null,
  relatedApplication = null,
}) => {
  try {
    // Don't notify someone about their own action
    // (e.g. owner assigning a task to themselves)
    if (triggeredBy && recipient.toString() === triggeredBy.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      type,
      message,
      triggeredBy,
      relatedProject,
      relatedTask,
      relatedApplication,
    });

    return notification;
  } catch (error) {
    // Log but never throw — a failed notification must not roll back
    // or fail the parent action (task assignment, application accept, etc.)
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

module.exports = notify;
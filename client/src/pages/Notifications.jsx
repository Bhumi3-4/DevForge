import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, UserPlus, CheckSquare, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const NOTIFICATION_ICONS = {
  'task-assigned': CheckSquare,
  'join-request-received': UserPlus,
  'request-accepted': UserCheck,
  'request-rejected': UserX,
};

const NOTIFICATION_COLORS = {
  'task-assigned': 'text-blue-400 bg-blue-500/10',
  'join-request-received': 'text-purple-400 bg-purple-500/10',
  'request-accepted': 'text-green-400 bg-green-500/10',
  'request-rejected': 'text-red-400 bg-red-500/10',
};

const Notifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const fetchNotifications = async (page = 1, unreadOnlyFlag = unreadOnly) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/notifications', {
        params: { page, limit: 20, unreadOnly: unreadOnlyFlag },
      });
      setNotifications(data.notifications);
      setPagination({ page: data.page, pages: data.pages });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, unreadOnly);
  }, [unreadOnly]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation(); // Don't trigger the card's own click-to-navigate
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  //  Clicking a notification marks it read, then navigates to what it's about 
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    if (notification.relatedTask && notification.relatedProject) {
      navigate(`/projects/${notification.relatedProject._id}`);
    } else if (notification.relatedProject) {
      navigate(`/projects/${notification.relatedProject._id}`);
    }
    // Notifications with no related project (shouldn't normally happen given
    // our four types) simply mark as read without navigating anywhere
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell size={22} /> Notifications
          </h1>
        </div>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {/*  Filter toggle  */}
      <div className="flex gap-2">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
            !unreadOnly ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
            unreadOnly ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Unread only
        </button>
      </div>

      {/*  List  */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-xl py-16 text-center">
          <Bell size={28} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {unreadOnly ? "You're all caught up." : "No notifications yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
            const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-gray-400 bg-gray-500/10';

            return (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  notification.isRead
                    ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    : 'bg-gray-900 border-blue-900/50 hover:border-blue-700'
                }`}
              >
                <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.isRead ? 'text-gray-300' : 'text-white font-medium'}`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {notification.relatedProject?.title && (
                      <span className="text-xs text-gray-500">{notification.relatedProject.title}</span>
                    )}
                    <span className="text-xs text-gray-600">
                      {new Date(notification.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification._id);
                      }}
                      className="text-gray-500 hover:text-blue-400 p-1.5"
                      aria-label="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(notification._id, e)}
                    className="text-gray-500 hover:text-red-400 p-1.5"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/*  Pagination  */}
      {!loading && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => fetchNotifications(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchNotifications(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
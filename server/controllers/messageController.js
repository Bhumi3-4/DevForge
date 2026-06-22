const Message = require('../models/messageModel');
const Project = require('../models/projectModel');

// ─── @desc    Get message history for a project room
// ─── @route   GET /api/messages/project/:projectId?page=1&limit=50
// ─── @access  Private (project members only)
const getProjectMessages = async (req, res, next) => {
  const { projectId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    return next(error);
  }

  if (!project.isMember(req.user._id)) {
    const error = new Error('You must be a project member to view this chat');
    error.statusCode = 403;
    return next(error);
  }

  const skip = (Number(page) - 1) * Number(limit);

  // Fetch newest-first for pagination math, then reverse so the array
  // renders oldest-to-newest (how a chat window should read top to bottom)
  const messages = await Message.find({ project: projectId })
    .populate('sender', 'name profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    count: messages.length,
    messages: messages.reverse(),
  });
};

// ─── @desc    Get message history for a 1:1 conversation
// ─── @route   GET /api/messages/direct/:userId?page=1&limit=50
// ─── @access  Private
const getDirectMessages = async (req, res, next) => {
  const { userId: otherUserId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const myId = req.user._id;

  const skip = (Number(page) - 1) * Number(limit);

  // Messages where I'm the sender and they're the recipient, OR vice versa
  const messages = await Message.find({
    $or: [
      { sender: myId, recipient: otherUserId },
      { sender: otherUserId, recipient: myId },
    ],
  })
    .populate('sender', 'name profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Mark all messages sent TO me in this conversation as read,
  // now that I've actually opened and fetched this thread
  await Message.updateMany(
    { sender: otherUserId, recipient: myId, readBy: { $ne: myId } },
    { $push: { readBy: myId } }
  );

  res.status(200).json({
    success: true,
    count: messages.length,
    messages: messages.reverse(),
  });
};

// ─── @desc    Get a list of all DM conversations (inbox-style preview list)
// ─── @route   GET /api/messages/conversations
// ─── @access  Private
const getConversations = async (req, res) => {
  const myId = req.user._id;

  // Aggregation: find the most recent message with each distinct other-user,
  // across all messages where I'm either the sender or the recipient
  const conversations = await Message.aggregate([
    {
      $match: {
        recipient: { $ne: null }, // Only direct messages, not project messages
        $or: [{ sender: myId }, { recipient: myId }],
      },
    },
    {
      // Normalize: figure out who the "other person" is regardless of
      // whether I was the sender or recipient on a given message
      $addFields: {
        otherUser: {
          $cond: [{ $eq: ['$sender', myId] }, '$recipient', '$sender'],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      // Keep only the most recent message per other-user
      $group: {
        _id: '$otherUser',
        lastMessage: { $first: '$content' },
        lastMessageAt: { $first: '$createdAt' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$recipient', myId] }, { $not: { $in: [myId, '$readBy'] } }] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { lastMessageAt: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$user._id',
        name: '$user.name',
        profileImage: '$user.profileImage',
        lastMessage: 1,
        lastMessageAt: 1,
        unreadCount: 1,
      },
    },
  ]);

  res.status(200).json({ success: true, conversations });
};

module.exports = { getProjectMessages, getDirectMessages, getConversations };
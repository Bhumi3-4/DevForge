const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Project = require('../models/projectModel');
const Message = require('../models/messageModel');

// Tracks currently connected users: userId -> Set of socket ids
// A Set (not a single socket id) handles a user with multiple tabs/devices open
const onlineUsers = new Map();

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  //  Authenticate every socket connection using the same JWT as the REST API 
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('Authentication failed'));
      }

      socket.user = user; // Attach the authenticated user to this socket
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    //  Track this user as online 
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Notify everyone this user is now online (only on their FIRST connection,
    // not on every additional tab they open)
    if (onlineUsers.get(userId).size === 1) {
      io.emit('user-online', { userId });
    }

    //  Join a project room 
    socket.on('join-project', async (projectId) => {
      try {
        const project = await Project.findById(projectId);

        if (!project || !project.isMember(userId)) {
          socket.emit('error-message', 'You are not a member of this project');
          return;
        }

        socket.join(`project:${projectId}`);
      } catch {
        socket.emit('error-message', 'Failed to join project room');
      }
    });

    socket.on('leave-project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    //  Project room message 
    socket.on('send-project-message', async ({ projectId, content }) => {
      try {
        if (!content?.trim()) return;

        const project = await Project.findById(projectId);
        if (!project || !project.isMember(userId)) {
          socket.emit('error-message', 'You are not a member of this project');
          return;
        }

        const message = await Message.create({
          sender: userId,
          project: projectId,
          content: content.trim(),
          readBy: [userId],
        });

        await message.populate('sender', 'name profileImage');

        // Broadcast to everyone in the room, including the sender
        // (sender renders their own message from this event, not optimistically,
        // so every client shows the exact same persisted, timestamped message)
        io.to(`project:${projectId}`).emit('new-project-message', message);
      } catch {
        socket.emit('error-message', 'Failed to send message');
      }
    });

    //  Direct (1:1) message 
    socket.on('send-direct-message', async ({ recipientId, content }) => {
      try {
        if (!content?.trim()) return;

        const message = await Message.create({
          sender: userId,
          recipient: recipientId,
          content: content.trim(),
          readBy: [userId],
        });

        await message.populate('sender', 'name profileImage');

        // Send to every socket the recipient currently has open (all their tabs/devices)
        const recipientSockets = onlineUsers.get(recipientId.toString());
        if (recipientSockets) {
          recipientSockets.forEach((socketId) => {
            io.to(socketId).emit('new-direct-message', message);
          });
        }

        // Echo back to the sender's own other tabs/devices too
        socket.emit('new-direct-message', message);
      } catch {
        socket.emit('error-message', 'Failed to send message');
      }
    });

    //  Typing indicators (not persisted — purely ephemeral) 
    socket.on('typing-project', ({ projectId }) => {
      socket.to(`project:${projectId}`).emit('user-typing', { userId, projectId });
    });

    socket.on('typing-direct', ({ recipientId }) => {
      const recipientSockets = onlineUsers.get(recipientId.toString());
      if (recipientSockets) {
        recipientSockets.forEach((socketId) => {
          io.to(socketId).emit('user-typing', { userId });
        });
      }
    });

    //  Disconnect 
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (!userSockets) return;

      userSockets.delete(socket.id);

      // Only announce "offline" once their LAST connection closes
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit('user-offline', { userId });
      }
    });
  });

  return io;
};

// Lets REST controllers check online status without importing the whole socket file
const isUserOnline = (userId) => onlineUsers.has(userId.toString());

module.exports = { initSocket, isUserOnline };
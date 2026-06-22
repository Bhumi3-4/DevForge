const express = require('express');
const {
  getProjectMessages,
  getDirectMessages,
  getConversations,
} = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All message routes require authentication
router.use(protect);

//  Static route (must come before /direct/:userId) 

// @route   GET /api/messages/conversations
router.get('/conversations', getConversations);

//  Project room history 

// @route   GET /api/messages/project/:projectId?page=1&limit=50
router.get('/project/:projectId', getProjectMessages);

//  Direct (1:1) conversation history 

// @route   GET /api/messages/direct/:userId?page=1&limit=50
router.get('/direct/:userId', getDirectMessages);

module.exports = router;
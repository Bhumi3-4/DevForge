const express = require('express');
const {
  getUserById,
  updateProfile,
  uploadProfileImage,
  searchUsers,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes below require authentication
router.use(protect);

// User Search & Listing 

// @route   GET /api/users?search=john&skill=react
router.get('/', searchUsers);

// Own Profile 

// @route   PUT /api/users/profile
router.put('/profile', updateProfile);

// @route   PUT /api/users/profile/image
router.put('/profile/image', uploadProfileImage);

// Public User Profile // NOTE: This must come AFTER /profile routes to avoid
// Express matching "profile" as a dynamic :id param

// @route   GET /api/users/:id
router.get('/:id', getUserById);

module.exports = router;

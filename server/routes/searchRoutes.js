const express = require('express');
const { globalSearch } = require('../controllers/searchController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All search routes require authentication
router.use(protect);

// @route   GET /api/search?q=react
router.get('/', globalSearch);

module.exports = router;
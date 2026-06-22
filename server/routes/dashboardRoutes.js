const express = require('express');
const { getDashboard, getUpcomingDeadlines } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

// @route   GET /api/dashboard
router.get('/', getDashboard);

// @route   GET /api/dashboard/deadlines
router.get('/deadlines', getUpcomingDeadlines);

module.exports = router;
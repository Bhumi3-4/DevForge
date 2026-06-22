const express = require('express');
const {
  applyToProject,
  getPendingRequests,
  acceptApplication,
  rejectApplication,
  getMyApplications,
} = require('../controllers/recruitmentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All recruitment routes require authentication
router.use(protect);

//  Logged-in user's own applications 

// @route   GET /api/recruitment/my-applications
router.get('/my-applications', getMyApplications);

//  Project-scoped routes 

// @route   POST /api/recruitment/:projectId/apply
router.post('/:projectId/apply', applyToProject);

// @route   GET /api/recruitment/:projectId/requests
router.get('/:projectId/requests', getPendingRequests);

//  Application-scoped routes 

// @route   PUT /api/recruitment/requests/:applicationId/accept
router.put('/requests/:applicationId/accept', acceptApplication);

// @route   PUT /api/recruitment/requests/:applicationId/reject
router.put('/requests/:applicationId/reject', rejectApplication);

module.exports = router;
const express = require('express');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getMyProjects,
} = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All project routes require authentication
router.use(protect);

//  Collection Routes 

// @route   GET  /api/projects              — browse all projects (search + filter)
// @route   POST /api/projects              — create new project
router.route('/')
  .get(getAllProjects)
  .post(createProject);

//  Static Named Routes (must come before /:id) 

// @route   GET /api/projects/my            — get logged-in user's projects
router.get('/my', getMyProjects);

//  Dynamic ID Routes 

// @route   GET    /api/projects/:id        — get single project
// @route   PUT    /api/projects/:id        — update project (owner only)
// @route   DELETE /api/projects/:id        — delete project (owner only)
router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

module.exports = router;
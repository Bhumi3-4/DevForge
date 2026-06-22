const express = require('express');
const {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  assignTask,
  deleteTask,
  getMyTasks,
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All task routes require authentication
router.use(protect);

//  Global: tasks assigned to me across all projects 
// Must be registered BEFORE /:projectId to avoid route collision

// @route   GET /api/tasks/my-tasks
router.get('/my-tasks', getMyTasks);

//  Project-scoped task collection 

// @route   GET  /api/tasks/:projectId           — list tasks (with filters)
// @route   POST /api/tasks/:projectId           — create task
router.route('/:projectId')
  .get(getProjectTasks)
  .post(createTask);

//  Single task 

// @route   GET    /api/tasks/:projectId/:taskId  — get single task
// @route   PUT    /api/tasks/:projectId/:taskId  — update task
// @route   DELETE /api/tasks/:projectId/:taskId  — delete task
router.route('/:projectId/:taskId')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

// @route   PUT /api/tasks/:projectId/:taskId/assign — assign/reassign task
router.put('/:projectId/:taskId/assign', assignTask);

module.exports = router;
const Task = require('../models/taskModel');
const Project = require('../models/projectModel');

// Helper: Verify the requester is a member of the task's project 
// Not exported - internal use only within this controller
const ensureProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  if (!project.isMember(userId)) {
    const error = new Error('You must be a project member to perform this action');
    error.statusCode = 403;
    throw error;
  }

  return project;
};

// @desc    Create a new task
// @route   POST /api/tasks/:projectId
// @access  Private (project members only)
const createTask = async (req, res, next) => {
  const { projectId } = req.params;
  const { title, description, assignee, priority, dueDate } = req.body;

  if (!title) {
    const error = new Error('Task title is required');
    error.statusCode = 400;
    return next(error);
  }

  const project = await ensureProjectMember(projectId, req.user._id);

  // If an assignee is provided, they must also be a project member
  if (assignee && !project.isMember(assignee)) {
    const error = new Error('Assignee must be a member of this project');
    error.statusCode = 400;
    return next(error);
  }

  const task = await Task.create({
    title,
    description: description || '',
    project: projectId,
    assignee: assignee || null,
    createdBy: req.user._id,
    priority: priority || 'medium',
    dueDate: dueDate || null,
  });

  await task.populate('assignee', 'name email profileImage');
  await task.populate('createdBy', 'name email profileImage');

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    task,
  });
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/:projectId
// @access  Private (project members only)
const getProjectTasks = async (req, res, next) => {
  const { projectId } = req.params;
  const { status, assignee, priority } = req.query;

  await ensureProjectMember(projectId, req.user._id);

  const query = { project: projectId };
  if (status) query.status = status;
  if (assignee) query.assignee = assignee;
  if (priority) query.priority = priority;

  const tasks = await Task.find(query)
    .populate('assignee', 'name email profileImage')
    .populate('createdBy', 'name email profileImage')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks,
  });
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:projectId/:taskId
// @access  Private (project members only)
const getTaskById = async (req, res, next) => {
  const { projectId, taskId } = req.params;

  await ensureProjectMember(projectId, req.user._id);

  const task = await Task.findOne({ _id: taskId, project: projectId })
    .populate('assignee', 'name email profileImage')
    .populate('createdBy', 'name email profileImage');

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ success: true, task });
};

// @desc    Update task (title, description, priority, due date, status)
// @route   PUT /api/tasks/:projectId/:taskId
// @access  Private (project members only)
const updateTask = async (req, res, next) => {
  const { projectId, taskId } = req.params;

  const project = await ensureProjectMember(projectId, req.user._id);

  const task = await Task.findOne({ _id: taskId, project: projectId });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    return next(error);
  }

  const { title, description, priority, status, dueDate } = req.body;

  const updateFields = {};
  if (title !== undefined) updateFields.title = title;
  if (description !== undefined) updateFields.description = description;
  if (priority !== undefined) updateFields.priority = priority;
  if (dueDate !== undefined) updateFields.dueDate = dueDate;

  // Validate status transitions against the allowed enum (schema also enforces this,
  // but checking here lets us return a clean 400 instead of a Mongoose ValidationError)
  if (status !== undefined) {
    const validStatuses = ['todo', 'in-progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      const error = new Error('Invalid status value');
      error.statusCode = 400;
      return next(error);
    }
    updateFields.status = status;
  }

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { $set: updateFields },
    { new: true, runValidators: true }
  )
    .populate('assignee', 'name email profileImage')
    .populate('createdBy', 'name email profileImage');

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    task: updatedTask,
  });
};

// @desc    Assign or reassign a task to a project member
// @route   PUT /api/tasks/:projectId/:taskId/assign
// @access  Private (project members only)
const assignTask = async (req, res, next) => {
  const { projectId, taskId } = req.params;
  const { assignee } = req.body; // null/undefined to unassign

  const project = await ensureProjectMember(projectId, req.user._id);

  const task = await Task.findOne({ _id: taskId, project: projectId });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    return next(error);
  }

  if (assignee && !project.isMember(assignee)) {
    const error = new Error('Assignee must be a member of this project');
    error.statusCode = 400;
    return next(error);
  }

  task.assignee = assignee || null;
  await task.save();

  // Notify the newly assigned user
  if (assignee) {
    const notify = require('../utils/notify');
    await notify({
      recipient: assignee,
      type: 'task-assigned',
      message: `You were assigned to "${task.title}"`,
      triggeredBy: req.user._id,
      relatedProject: projectId,
      relatedTask: task._id,
    });
  }

  await task.populate('assignee', 'name email profileImage');
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:projectId/:taskId
// @access  Private (project members only)
const deleteTask = async (req, res, next) => {
  const { projectId, taskId } = req.params;

  await ensureProjectMember(projectId, req.user._id);

  const task = await Task.findOneAndDelete({ _id: taskId, project: projectId });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  });
};

// @desc    Get tasks assigned to the logged-in user across all projects
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = async (req, res) => {
  const tasks = await Task.find({ assignee: req.user._id })
    .populate('project', 'title status')
    .populate('createdBy', 'name profileImage')
    .sort({ dueDate: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks,
  });
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  assignTask,
  deleteTask,
  getMyTasks,
};
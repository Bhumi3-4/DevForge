const Project = require('../models/projectModel');

//  @desc    Create a new project
//  @route   POST /api/projects
//  @access  Private 
const createProject = async (req, res, next) => {
  const { title, description, techStack, tags, maxMembers, isRecruiting } = req.body;

  if (!title || !description) {
    const error = new Error('Title and description are required');
    error.statusCode = 400;
    return next(error);
  }

  const project = await Project.create({
    title,
    description,
    techStack: techStack || [],
    tags: tags || [],
    maxMembers: maxMembers || 5,
    isRecruiting: isRecruiting !== undefined ? isRecruiting : true,
    owner: req.user._id,
    // Owner is automatically added as first member with 'owner' role
    members: [{ user: req.user._id, role: 'owner' }],
  });

  await project.populate('owner', 'name email profileImage');

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    project,
  });
};

//  @desc    Get all projects with search & filter
//  @route   GET /api/projects?search=&tech=&tag=&status=&page=&limit=
//  @access  Private 
const getAllProjects = async (req, res) => {
  const {
    search,
    tech,
    tag,
    status,
    recruiting,
    page = 1,
    limit = 10,
  } = req.query;

  const query = {};

  // Full-text search on title and description (uses text index)
  if (search) {
    query.$text = { $search: search };
  }

  if (tech) {
    query.techStack = { $in: tech.split(',').map((t) => t.trim().toLowerCase()) };
  }

  if (tag) {
    query.tags = { $in: tag.split(',').map((t) => t.trim().toLowerCase()) };
  }

  if (status) {
    query.status = status;
  }

  if (recruiting === 'true') {
    query.isRecruiting = true;
  }


  // Pagination math
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('owner', 'name email profileImage')
      .populate('members.user', 'name email profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Project.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: projects.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    projects,
  });
};

//  @desc    Get single project by ID
//  @route   GET /api/projects/:id
//  @access  Private 
const getProjectById = async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email profileImage bio')
    .populate('members.user', 'name email profileImage skills');

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({ success: true, project });
};

//  @desc    Update a project
//  @route   PUT /api/projects/:id
//  @access  Private (owner only) ─
const updateProject = async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    return next(error);
  }

  // Only the project owner can update
  if (!project.isOwner(req.user._id)) {
    const error = new Error('Not authorized to update this project');
    error.statusCode = 403;
    return next(error);
  }

  // Whitelist updatable fields — owner and members are not directly updatable here
  const allowedFields = [
    'title', 'description', 'techStack', 'tags',
    'status', 'isRecruiting', 'maxMembers', 'coverImage',
  ];

  const updateFields = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateFields[field] = req.body[field];
    }
  });

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    { $set: updateFields },
    { new: true, runValidators: true }
  )
    .populate('owner', 'name email profileImage')
    .populate('members.user', 'name email profileImage');

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    project: updatedProject,
  });
};

//  @desc    Delete a project
//  @route   DELETE /api/projects/:id
//  @access  Private (owner only) ─
const deleteProject = async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    return next(error);
  }

  if (!project.isOwner(req.user._id)) {
    const error = new Error('Not authorized to delete this project');
    error.statusCode = 403;
    return next(error);
  }

  await project.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
};

//  @desc    Get projects owned by or joined by current user
//  @route   GET /api/projects/my
//  @access  Private 
const getMyProjects = async (req, res) => {
  const userId = req.user._id;

   const [owned, joined] = await Promise.all([
    // Projects this user owns
    Project.find({ owner: userId })
      .populate('owner', 'name email profileImage')
      .sort({ createdAt: -1 }),

    // Projects this user joined but does not own
    Project.find({
      'members.user': userId,
      owner: { $ne: userId },
    })
      .populate('owner', 'name email profileImage')
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    owned,
    joined,
  });
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getMyProjects,
};
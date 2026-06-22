const Application = require('../models/applicationModel');
const Project = require('../models/projectModel');

//  @desc    Apply to join a project
//  @route   POST /api/recruitment/:projectId/apply
//  @access  Private
const applyToProject = async (req, res, next) => {
  const { projectId } = req.params;
  const { message } = req.body;

  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    return next(error);
  }

  // Cannot apply to your own project
  if (project.isOwner(req.user._id)) {
    const error = new Error('You cannot apply to your own project');
    error.statusCode = 400;
    return next(error);
  }

  // Already a member?
  if (project.isMember(req.user._id)) {
    const error = new Error('You are already a member of this project');
    error.statusCode = 400;
    return next(error);
  }

  if (!project.isRecruiting) {
    const error = new Error('This project is not currently recruiting');
    error.statusCode = 400;
    return next(error);
  }

  if (project.isFull) {
    const error = new Error('This project has reached its maximum team size');
    error.statusCode = 400;
    return next(error);
  }

  // Check for an existing pending/accepted application
  // (unique index also protects this, but explicit check gives a cleaner message)
  const existing = await Application.findOne({ applicant: req.user._id, project: projectId });

  if (existing && existing.status === 'pending') {
    const error = new Error('You already have a pending application for this project');
    error.statusCode = 400;
    return next(error);
  }

  let application;

  if (existing && existing.status === 'rejected') {
    // Allow re-applying after a rejection — reset the existing record
    existing.status = 'pending';
    existing.message = message || '';
    application = await existing.save();
  } else {
    application = await Application.create({
      applicant: req.user._id,
      project: projectId,
      message: message || '',
    });
  }

   await application.populate('applicant', 'name email profileImage skills');

  // Notify the project owner of the new request
  const notify = require('../utils/notify');
  await notify({
    recipient: project.owner,
    type: 'join-request-received',
    message: `${req.user.name} requested to join "${project.title}"`,
    triggeredBy: req.user._id,
    relatedProject: project._id,
    relatedApplication: application._id,
  });
};

//  @desc    Get all pending requests for a project (owner only)
//  @route   GET /api/recruitment/:projectId/requests
//  @access  Private (owner only)
const getPendingRequests = async (req, res, next) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    return next(error);
  }

  if (!project.isOwner(req.user._id)) {
    const error = new Error('Only the project owner can view requests');
    error.statusCode = 403;
    return next(error);
  }

  const requests = await Application.find({ project: projectId, status: 'pending' })
    .populate('applicant', 'name email profileImage skills bio')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: requests.length,
    requests,
  });
};

//  @desc    Accept an application
//  @route   PUT /api/recruitment/requests/:applicationId/accept
//  @access  Private (owner only)
const acceptApplication = async (req, res, next) => {
  const application = await Application.findById(req.params.applicationId);

  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    return next(error);
  }

  if (application.status !== 'pending') {
    const error = new Error(`This application has already been ${application.status}`);
    error.statusCode = 400;
    return next(error);
  }

  const project = await Project.findById(application.project);

  if (!project) {
    const error = new Error('Project no longer exists');
    error.statusCode = 404;
    return next(error);
  }

  if (!project.isOwner(req.user._id)) {
    const error = new Error('Only the project owner can accept requests');
    error.statusCode = 403;
    return next(error);
  }

  if (project.isFull) {
    const error = new Error('Project has reached its maximum team size');
    error.statusCode = 400;
    return next(error);
  }

  // Defensive check — should never trigger due to applyToProject's own check,
  // but protects against race conditions
  if (!project.isMember(application.applicant)) {
    project.members.push({ user: application.applicant, role: 'member' });
    await project.save();
  }

  application.status = 'accepted';
  await application.save();

  // Notify the applicant they've been accepted
  const notify = require('../utils/notify');
  await notify({
    recipient: application.applicant,
    type: 'request-accepted',
    message: `Your request to join "${project.title}" was accepted`,
    triggeredBy: req.user._id,
    relatedProject: project._id,
    relatedApplication: application._id,
  });

  await application.populate('applicant', 'name email profileImage');
};

//  @desc    Reject an application
//  @route   PUT /api/recruitment/requests/:applicationId/reject
//  @access  Private (owner only)
const rejectApplication = async (req, res, next) => {
  const application = await Application.findById(req.params.applicationId);

  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    return next(error);
  }

  if (application.status !== 'pending') {
    const error = new Error(`This application has already been ${application.status}`);
    error.statusCode = 400;
    return next(error);
  }

  const project = await Project.findById(application.project);

  if (!project || !project.isOwner(req.user._id)) {
    const error = new Error('Only the project owner can reject requests');
    error.statusCode = 403;
    return next(error);
  }

  application.status = 'rejected';
  await application.save();

  const notify = require('../utils/notify');
  await notify({
    recipient: application.applicant,
    type: 'request-rejected',
    message: `Your request to join "${project.title}" was not accepted`,
    triggeredBy: req.user._id,
    relatedProject: project._id,
    relatedApplication: application._id,
  });
};

//  @desc    Get logged-in user's own applications
//  @route   GET /api/recruitment/my-applications
//  @access  Private
const getMyApplications = async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate('project', 'title description techStack status')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: applications.length,
    applications,
  });
};

module.exports = {
  applyToProject,
  getPendingRequests,
  acceptApplication,
  rejectApplication,
  getMyApplications,
};
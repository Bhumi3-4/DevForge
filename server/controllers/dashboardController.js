const Project = require('../models/projectModel');
const Task = require('../models/taskModel');


const getDashboard = async (req, res) => {
  const userId = req.user._id;

  const [ownedProjects, joinedProjects, recentTasks, taskStats] = await Promise.all([
    // Projects I own
    Project.find({ owner: userId })
      .select('title status techStack members createdAt')
      .sort({ createdAt: -1 })
      .limit(5),

    // Projects I joined but don't own
    Project.find({ 'members.user': userId, owner: { $ne: userId } })
      .select('title status techStack members createdAt')
      .populate('owner', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(5),

    // My 5 most recently updated tasks across all projects
    Task.find({ assignee: userId })
      .populate('project', 'title')
      .sort({ updatedAt: -1 })
      .limit(5),

    // Task counts grouped by status — powers the stats cards
    Task.aggregate([
      { $match: { assignee: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  // Convert aggregate result [{ _id: 'todo', count: 3 }, ...] into a flat object
  const statusCounts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
  taskStats.forEach((stat) => {
    statusCounts[stat._id] = stat.count;
  });

  // Total project counts (separate lightweight queries — no need to fetch full docs)
  const [totalOwned, totalJoined] = await Promise.all([
    Project.countDocuments({ owner: userId }),
    Project.countDocuments({ 'members.user': userId, owner: { $ne: userId } }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalProjectsOwned: totalOwned,
      totalProjectsJoined: totalJoined,
      tasksByStatus: statusCounts,
      totalAssignedTasks: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    },
    myProjects: ownedProjects,
    joinedProjects,
    recentTasks,
  });
};

//  @desc    Get upcoming task deadlines for logged-in user
//  @route   GET /api/dashboard/deadlines
//  @access  Private
const getUpcomingDeadlines = async (req, res) => {
  const userId = req.user._id;
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const upcoming = await Task.find({
    assignee: userId,
    status: { $ne: 'done' },
    dueDate: { $gte: today },
  })
    .populate('project', 'title')
    .sort({ dueDate: 1 })
    .limit(10);

  res.status(200).json({
    success: true,
    count: upcoming.length,
    deadlines: upcoming,
  });
};

module.exports = { getDashboard, getUpcomingDeadlines };
const Project = require('../models/projectModel');
const User = require('../models/userModel');

//  @desc    Global search across projects and users
//  @route   GET /api/search?q=react
//  @access  Private
const globalSearch = async (req, res, next) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    const error = new Error('Search query is required');
    error.statusCode = 400;
    return next(error);
  }

  const searchTerm = q.trim();

  const [projects, users] = await Promise.all([
    // Text search on title/description, plus tech stack and tags
    Project.find({
      $or: [
        { $text: { $search: searchTerm } },
        { techStack: { $in: [searchTerm.toLowerCase()] } },
        { tags: { $in: [searchTerm.toLowerCase()] } },
      ],
    })
      .populate('owner', 'name profileImage')
      .select('title description techStack tags status owner')
      .limit(5),

    // Name, email, or skill match
    User.find({
      isActive: true,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { skills: { $in: [searchTerm.toLowerCase()] } },
      ],
    })
      .select('name email bio skills profileImage')
      .limit(5),
  ]);

  res.status(200).json({
    success: true,
    query: searchTerm,
    results: {
      projects,
      users,
    },
    counts: {
      projects: projects.length,
      users: users.length,
    },
  });
};

module.exports = { globalSearch };
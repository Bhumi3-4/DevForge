const User = require('../models/userModel');

//  @desc    Get any user's public profile by ID
//  @route   GET /api/users/:id
//  @access  Private 
const getUserById = async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user || !user.isActive) {
    const error = new Error('User not found');
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({
    success: true,
    user: user.toPublicProfile(),
  });
};

//  @desc    Update logged-in user's profile
//  @route   PUT /api/users/profile
//  @access  Private 
const updateProfile = async (req, res, next) => {
  // Whitelist allowed fields — prevents mass assignment attacks
  const { name, bio, skills, github, linkedin } = req.body;

  // Build update object with only provided fields
  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (bio !== undefined) updateFields.bio = bio;
  if (github !== undefined) updateFields.github = github;
  if (linkedin !== undefined) updateFields.linkedin = linkedin;

  // Skills: accept array or comma-separated string
  if (skills !== undefined) {
    updateFields.skills = Array.isArray(skills)
      ? skills
      : skills.split(',').map((s) => s.trim()).filter(Boolean);
  }

  if (name && name.trim().length === 0) {
    const error = new Error('Name cannot be empty');
    error.statusCode = 400;
    return next(error);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    {
      new: true,           // Return updated document
      runValidators: true, // Run schema validators on update
    }
  ).select('-password');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser.toPublicProfile(),
  });
};

//  @desc    Upload / update profile image (base64)
//  @route   PUT /api/users/profile/image
//  @access  Private 
const uploadProfileImage = async (req, res, next) => {
  const { image } = req.body;

  if (!image) {
    const error = new Error('Please provide an image');
    error.statusCode = 400;
    return next(error);
  }

  // Validate it's a base64 image string (data URI format)
  const isBase64Image = /^data:image\/(jpeg|jpg|png|webp);base64,/.test(image);
  if (!isBase64Image) {
    const error = new Error('Invalid image format. Use JPEG, PNG, or WebP');
    error.statusCode = 400;
    return next(error);
  }

  // Rough size check — base64 inflates by ~33%, so 10mb limit ≈ 7.5mb image
  const sizeInBytes = (image.length * 3) / 4;
  if (sizeInBytes > 5 * 1024 * 1024) {
    const error = new Error('Image must be smaller than 5MB');
    error.statusCode = 400;
    return next(error);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { profileImage: image } },
    { new: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    message: 'Profile image updated successfully',
    profileImage: updatedUser.profileImage,
  });
};

//  @desc    Search users by name or skills
//  @route   GET /api/users?search=react&skill=node
//  @access  Private 
const searchUsers = async (req, res) => {
  const { search, skill } = req.query;

  const query = { isActive: true };

  if (search) {
    // Case-insensitive search on name or email
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (skill) {
    // Match users who have this skill in their skills array
    query.skills = { $in: [skill.toLowerCase()] };
  }

   const users = await User.find(query)
    .select('name email bio skills profileImage github linkedin')
    .limit(20); // Safety limit

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
};

module.exports = { getUserById, updateProfile, uploadProfileImage, searchUsers };
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never returned in queries by default
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },

    skills: {
      type: [String],
      default: [],
      // Trim each skill string before saving
      set: (skills) => skills.map((s) => s.trim().toLowerCase()),
    },

    github: {
      type: String,
      trim: true,
      default: '',
      match: [
        /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
        'Please provide a valid GitHub URL',
      ],
    },

     linkedin: {
      type: String,
      trim: true,
      default: '',
      match: [
        /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,
        'Please provide a valid LinkedIn URL',
      ],
    },

    profileImage: {
      type: String,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

//  Pre-save Hook: Hash password before saving 
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

//  Instance Method: Compare entered password with hashed password 
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//  Instance Method: Return safe user object (no password) 
userSchema.methods.toPublicProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    bio: this.bio,
    skills: this.skills,
    github: this.github,
    linkedin: this.linkedin,
    profileImage: this.profileImage,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
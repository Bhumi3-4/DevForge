const mongoose = require('mongoose');

//  Team Member Sub-Schema 
// Embedded in project to avoid extra lookups for member role checks
const teamMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false } // No separate _id for sub-documents
);

//  Main Project Schema 
const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    techStack: {
      type: [String],
      default: [],
      set: (stack) => stack.map((t) => t.trim().toLowerCase()),
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) => tags.map((t) => t.trim().toLowerCase()),
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Embedded array of team members with roles
    members: {
      type: [teamMemberSchema],
      default: [],
    },

    status: {
      type: String,
      enum: {
        values: ['open', 'in-progress', 'completed', 'archived'],
        message: 'Status must be open, in-progress, completed, or archived',
      },
      default: 'open',
    },

    isRecruiting: {
      type: Boolean,
      default: true, // Open for applications by default
    },

    maxMembers: {
      type: Number,
      default: 5,
      min: [1, 'Team must have at least 1 member'],
      max: [20, 'Team cannot exceed 20 members'],
    },

    coverImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//  Virtual: Member count 
// Computed on the fly — not stored in DB
projectSchema.virtual('memberCount').get(function () {
  return this.members?.length || 0;
});

projectSchema.virtual('isFull').get(function () {
  return (this.members?.length || 0) >= this.maxMembers;
});

//  Instance Method: Check if a user is a member 
projectSchema.methods.isMember = function (userId) {
  return this.members.some(
    (m) => m.user.toString() === userId.toString()
  );
};

//  Instance Method: Check if a user is the owner 
projectSchema.methods.isOwner = function (userId) {
  return this.owner.toString() === userId.toString()
};

//  Indexes for fast querying 
projectSchema.index({ owner: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ techStack: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ title: 'text', description: 'text' }); // Full-text search

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
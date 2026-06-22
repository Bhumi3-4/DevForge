const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },

     message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

//  Prevent duplicate applications 
// A user can only have ONE application per project (enforced at DB level)
applicationSchema.index({ applicant: 1, project: 1 }, { unique: true });

//  Indexes for common queries 
applicationSchema.index({ project: 1, status: 1 }); // "pending requests for my project"
applicationSchema.index({ applicant: 1, status: 1 }); // "my pending applications"

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },

    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Unassigned tasks are allowed
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high',
      },
      default: 'medium',
    },

    status: {
      type: String,
      enum: {
        values: ['todo', 'in-progress', 'review', 'done'],
        message: 'Status must be todo, in-progress, review, or done',
      },
      default: 'todo',
    },

    dueDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          // Only validate on creation — allow editing tasks with past due dates
          if (!this.isNew || !value) return true;
          return value >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: 'Due date cannot be in the past',
      },
    },
  },{ timestamps: true }
);

//  Indexes for common queries 
taskSchema.index({ project: 1, status: 1 }); // Kanban board columns
taskSchema.index({ assignee: 1 });           // "my tasks" dashboard query
taskSchema.index({ project: 1, dueDate: 1 }); // upcoming deadlines per project

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
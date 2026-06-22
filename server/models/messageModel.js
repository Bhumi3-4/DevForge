const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Exactly one of these two is set, depending on chat type — never both
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

//  Indexes 
// Fetching a project room's history, oldest-to-newest within a page
messageSchema.index({ project: 1, createdAt: -1 });

// Fetching a 1:1 conversation between two specific users.
// Since either user could be "sender" or "recipient" depending on who sent
// which message, the controller will query both directions — this index
// supports that lookup efficiently from either side.
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
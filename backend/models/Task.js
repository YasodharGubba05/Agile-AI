const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  aiSuggestedPriority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: null
  },
  priorityAccepted: {
    type: Boolean,
    default: false
  },
  estimatedEffort: {
    type: Number,
    required: true,
    min: 1
  },
  actualEffort: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Completed'],
    default: 'To Do'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sprintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  deadline: {
    type: Date
  },
  complexity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  dependencyCount: {
    type: Number,
    default: 0
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  requiredSkills: {
    type: [String],
    default: []
  },
  bugCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);

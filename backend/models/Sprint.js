const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  plannedVelocity: {
    type: Number,
    default: 0
  },
  actualVelocity: {
    type: Number,
    default: 0
  },
  aiPredictedCapacity: {
    type: Number,
    default: 0
  },
  sprintHealthScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Planning', 'Active', 'Completed'],
    default: 'Planning'
  },
  aiRecommendation: {
    predictedCapacity: Number,
    overloadWarning: Boolean,
    explanation: String,
    accepted: {
      type: Boolean,
      default: false
    },
    humanDecision: {
      type: String,
      enum: ['Accepted', 'Overridden', 'Pending'],
      default: 'Pending'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sprint', sprintSchema);

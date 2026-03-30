const mongoose = require('mongoose');

/**
 * AI Decision Log Schema
 * 
 * Persists all AI recommendations and human decisions to MongoDB.
 * Supports the Human-in-the-Loop framework by providing a durable
 * audit trail of every AI suggestion and how the user responded.
 */
const aiDecisionLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sprint_capacity', 'risk_prediction', 'task_priority', 'retrospective', 'workload_balance', 'velocity_forecast'],
    required: true,
    index: true
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  aiSuggestion: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  explanation: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  humanDecision: {
    type: String,
    enum: ['Accepted', 'Overridden', 'Pending'],
    default: 'Pending',
    index: true
  },
  overrideReason: {
    type: String,
    default: null
  },
  decisionUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  decisionTimestamp: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
aiDecisionLogSchema.index({ type: 1, humanDecision: 1, createdAt: -1 });

module.exports = mongoose.model('AIDecisionLog', aiDecisionLogSchema);

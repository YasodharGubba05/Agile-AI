const mongoose = require('mongoose');
const AIDecisionLog = require('../../models/AIDecisionLog');

/**
 * Human-in-the-Loop Service
 * 
 * PURPOSE:
 * - Log all AI recommendations and human decisions
 * - Track acceptance/rejection rates
 * - Store override reasons
 * - Ensure AI never auto-applies changes
 * 
 * ACADEMIC JUSTIFICATION:
 * - Critical for explainable AI systems
 * - Enables audit trail for AI decisions
 * - Supports research on human-AI collaboration
 * - Demonstrates ethical AI practices
 */

class HumanInTheLoopService {
  /**
   * Log AI recommendation
   * @param {Object} params - Recommendation details
   */
  async logAIRecommendation(params) {
    const {
      type, // 'sprint_capacity', 'risk_prediction', 'task_priority', 'retrospective', 'workload_balance', 'velocity_forecast'
      entityId, // Sprint ID, Project ID, Task ID, etc.
      aiSuggestion,
      confidence,
      explanation,
      userId
    } = params;

    const logEntry = new AIDecisionLog({
      type,
      entityId,
      aiSuggestion,
      confidence: confidence || 0.5,
      explanation,
      userId,
      humanDecision: 'Pending'
    });

    await logEntry.save();
    return logEntry._id.toString();
  }

  /**
   * Log human decision (accept or override)
   * @param {string} logId - Log entry ID
   * @param {string} decision - 'Accepted' or 'Overridden'
   * @param {string} overrideReason - Optional reason for override
   * @param {string} userId - User making the decision
   */
  async logHumanDecision(logId, decision, overrideReason = null, userId = null) {
    const logEntry = await AIDecisionLog.findById(logId);
    if (!logEntry) {
      throw new Error('Log entry not found');
    }

    logEntry.humanDecision = decision;
    logEntry.overrideReason = overrideReason;
    logEntry.decisionTimestamp = new Date();
    logEntry.decisionUserId = userId;

    await logEntry.save();
    return logEntry;
  }

  /**
   * Get acceptance rate for a specific AI type
   * @param {string} type - AI recommendation type
   * @returns {Object} Statistics
   */
  async getAcceptanceRate(type = null) {
    const query = { humanDecision: { $ne: 'Pending' } };
    if (type) {
      query.type = type;
    }

    const total = await AIDecisionLog.countDocuments(query);
    if (total === 0) {
      return {
        total: 0,
        accepted: 0,
        overridden: 0,
        acceptanceRate: 0,
        overrideRate: 0
      };
    }

    const accepted = await AIDecisionLog.countDocuments({ ...query, humanDecision: 'Accepted' });
    const overridden = await AIDecisionLog.countDocuments({ ...query, humanDecision: 'Overridden' });

    return {
      total,
      accepted,
      overridden,
      acceptanceRate: (accepted / total) * 100,
      overrideRate: (overridden / total) * 100
    };
  }

  /**
   * Get all logs (for analysis)
   * @param {Object} filters - Optional filters
   * @returns {Array} Log entries
   */
  async getLogs(filters = {}) {
    let query = {};

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.entityId) {
      query.entityId = filters.entityId;
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.decision) {
      query.humanDecision = filters.decision;
    }

    return await AIDecisionLog.find(query)
      .populate('userId', 'name email role')
      .populate('decisionUserId', 'name email role')
      .sort({ createdAt: -1 });
  }

  /**
   * Get override reasons analysis
   * @returns {Object} Analysis of override reasons
   */
  async getOverrideReasonsAnalysis() {
    const overriddenLogs = await AIDecisionLog.find({
      humanDecision: 'Overridden',
      overrideReason: { $ne: null }
    });

    const reasons = {};
    overriddenLogs.forEach(log => {
      const reason = log.overrideReason || 'No reason provided';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    return {
      totalOverrides: overriddenLogs.length,
      reasonsBreakdown: reasons,
      mostCommonReason: Object.keys(reasons).length > 0
        ? Object.keys(reasons).reduce((a, b) => reasons[a] > reasons[b] ? a : b)
        : null
    };
  }
}

module.exports = new HumanInTheLoopService();

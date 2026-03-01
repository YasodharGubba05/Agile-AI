const mongoose = require('mongoose');

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

// In-memory storage (in production, use MongoDB collection)
const aiDecisionLog = [];

class HumanInTheLoopService {
  /**
   * Log AI recommendation
   * @param {Object} params - Recommendation details
   */
  logAIRecommendation(params) {
    const {
      type, // 'sprint_capacity', 'risk_prediction', 'task_priority', 'retrospective'
      entityId, // Sprint ID, Project ID, Task ID, etc.
      aiSuggestion,
      confidence,
      explanation,
      userId
    } = params;

    const logEntry = {
      id: mongoose.Types.ObjectId().toString(),
      timestamp: new Date(),
      type,
      entityId,
      aiSuggestion,
      confidence,
      explanation,
      userId,
      humanDecision: 'Pending',
      overrideReason: null,
      decisionTimestamp: null
    };

    aiDecisionLog.push(logEntry);
    return logEntry.id;
  }

  /**
   * Log human decision (accept or override)
   * @param {string} logId - Log entry ID
   * @param {string} decision - 'Accepted' or 'Overridden'
   * @param {string} overrideReason - Optional reason for override
   * @param {string} userId - User making the decision
   */
  logHumanDecision(logId, decision, overrideReason = null, userId = null) {
    const logEntry = aiDecisionLog.find(log => log.id === logId);
    if (!logEntry) {
      throw new Error('Log entry not found');
    }

    logEntry.humanDecision = decision;
    logEntry.overrideReason = overrideReason;
    logEntry.decisionTimestamp = new Date();
    logEntry.decisionUserId = userId;

    return logEntry;
  }

  /**
   * Get acceptance rate for a specific AI type
   * @param {string} type - AI recommendation type
   * @returns {Object} Statistics
   */
  getAcceptanceRate(type = null) {
    const logs = type 
      ? aiDecisionLog.filter(log => log.type === type && log.humanDecision !== 'Pending')
      : aiDecisionLog.filter(log => log.humanDecision !== 'Pending');

    if (logs.length === 0) {
      return {
        total: 0,
        accepted: 0,
        overridden: 0,
        acceptanceRate: 0,
        overrideRate: 0
      };
    }

    const accepted = logs.filter(log => log.humanDecision === 'Accepted').length;
    const overridden = logs.filter(log => log.humanDecision === 'Overridden').length;

    return {
      total: logs.length,
      accepted,
      overridden,
      acceptanceRate: (accepted / logs.length) * 100,
      overrideRate: (overridden / logs.length) * 100
    };
  }

  /**
   * Get all logs (for analysis)
   * @param {Object} filters - Optional filters
   * @returns {Array} Log entries
   */
  getLogs(filters = {}) {
    let logs = [...aiDecisionLog];

    if (filters.type) {
      logs = logs.filter(log => log.type === filters.type);
    }

    if (filters.entityId) {
      logs = logs.filter(log => log.entityId === filters.entityId);
    }

    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }

    if (filters.decision) {
      logs = logs.filter(log => log.humanDecision === filters.decision);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get override reasons analysis
   * @returns {Object} Analysis of override reasons
   */
  getOverrideReasonsAnalysis() {
    const overriddenLogs = aiDecisionLog.filter(log => 
      log.humanDecision === 'Overridden' && log.overrideReason
    );

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

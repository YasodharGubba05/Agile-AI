const sprintCapacityService = require('../services/ai/sprintCapacityService');
const riskPredictionService = require('../services/ai/riskPredictionService');
const retrospectiveService = require('../services/ai/retrospectiveService');
const productivityService = require('../services/ai/productivityService');
const evaluationMetricsService = require('../services/ai/evaluationMetricsService');
const humanInTheLoopService = require('../services/ai/humanInTheLoopService');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');

/**
 * AI Controller
 * Handles all AI-related API endpoints
 */

/**
 * POST /api/ai/sprint-capacity
 * Predict sprint capacity using Linear Regression
 */
exports.predictSprintCapacity = async (req, res) => {
  try {
    const { projectId, plannedVelocity, teamSize } = req.body;

    if (!projectId || plannedVelocity === undefined || !teamSize) {
      return res.status(400).json({ 
        message: 'Missing required fields: projectId, plannedVelocity, teamSize' 
      });
    }

    // Get AI prediction
    const prediction = await sprintCapacityService.predictSprintCapacity(
      projectId,
      plannedVelocity,
      teamSize
    );

    // Log AI recommendation for human-in-the-loop tracking
    const logId = humanInTheLoopService.logAIRecommendation({
      type: 'sprint_capacity',
      entityId: projectId,
      aiSuggestion: {
        predictedCapacity: prediction.predictedCapacity,
        overloadRisk: prediction.overloadRisk
      },
      confidence: prediction.confidenceScore,
      explanation: prediction.explanation,
      userId: req.user._id.toString()
    });

    res.json({
      message: 'Sprint capacity prediction completed',
      ...prediction,
      logId // Return log ID for tracking human decision
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/ai/project-risk/:projectId
 * Predict project risk using Decision Tree
 */
exports.predictProjectRisk = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await riskPredictionService.predictProjectRisk(projectId);
    
    // Log AI recommendation
    const logId = humanInTheLoopService.logAIRecommendation({
      type: 'risk_prediction',
      entityId: projectId,
      aiSuggestion: {
        riskLevel: result.riskLevel,
        riskScore: result.riskScore
      },
      confidence: 0.85, // Decision trees have high interpretability confidence
      explanation: result.explanation,
      userId: req.user._id.toString()
    });
    
    res.json({
      message: 'Risk prediction completed',
      ...result,
      logId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/ai/retrospective/:sprintId
 * Generate sprint retrospective
 */
exports.generateRetrospective = async (req, res) => {
  try {
    const { sprintId } = req.params;
    
    const result = await retrospectiveService.generateRetrospective(sprintId);
    
    if (result.error) {
      return res.status(400).json(result);
    }
    
    // Log AI recommendation
    const logId = humanInTheLoopService.logAIRecommendation({
      type: 'retrospective',
      entityId: sprintId,
      aiSuggestion: {
        insights: result.insights.length,
        recommendations: result.recommendations.length
      },
      confidence: 0.75,
      explanation: 'Sprint retrospective generated',
      userId: req.user._id.toString()
    });
    
    res.json({
      message: 'Retrospective generated successfully',
      ...result,
      logId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/ai/productivity/:projectId
 * Analyze team productivity and burnout indicators
 */
exports.analyzeProductivity = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await productivityService.analyzeProductivity(projectId);
    
    res.json({
      message: 'Productivity analysis completed',
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/ai/metrics/:projectId
 * Get evaluation metrics for AI system
 */
exports.getEvaluationMetrics = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const metrics = await evaluationMetricsService.calculateMetrics(projectId);
    
    // Calculate overall score (weighted average)
    const overallScore = (
      metrics.sprintPredictability.score * 0.3 +
      metrics.velocityStability.score * 0.3 +
      metrics.taskCompletionRate.rate * 0.2 +
      metrics.riskDetectionTiming.earlyDetectionScore * 0.2
    );

    res.json({ 
      metrics: {
        ...metrics,
        overallScore: Math.round(overallScore)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /api/ai/decision
 * Log human decision on AI recommendation
 */
exports.logHumanDecision = async (req, res) => {
  try {
    const { logId, decision, overrideReason } = req.body;

    if (!logId || !decision) {
      return res.status(400).json({ 
        message: 'Missing required fields: logId, decision' 
      });
    }

    if (!['Accepted', 'Overridden'].includes(decision)) {
      return res.status(400).json({ 
        message: 'Decision must be "Accepted" or "Overridden"' 
      });
    }

    const logEntry = humanInTheLoopService.logHumanDecision(
      logId,
      decision,
      overrideReason,
      req.user._id.toString()
    );

    res.json({
      message: 'Human decision logged successfully',
      logEntry
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/ai/decisions
 * Get AI decision logs and statistics
 */
exports.getDecisionLogs = async (req, res) => {
  try {
    const { type, entityId, decision } = req.query;
    
    const logs = humanInTheLoopService.getLogs({ type, entityId, decision });
    const acceptanceRate = humanInTheLoopService.getAcceptanceRate(type);
    const overrideAnalysis = humanInTheLoopService.getOverrideReasonsAnalysis();

    res.json({
      logs,
      statistics: {
        acceptanceRate,
        overrideAnalysis
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

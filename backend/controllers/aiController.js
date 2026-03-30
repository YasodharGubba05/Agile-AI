const sprintCapacityService = require('../services/ai/sprintCapacityService');
const riskPredictionService = require('../services/ai/riskPredictionService');
const retrospectiveService = require('../services/ai/retrospectiveService');
const productivityService = require('../services/ai/productivityService');
const evaluationMetricsService = require('../services/ai/evaluationMetricsService');
const humanInTheLoopService = require('../services/ai/humanInTheLoopService');
const velocityForecastingService = require('../services/ai/velocityForecastingService');
const teamWorkloadBalancerService = require('../services/ai/teamWorkloadBalancerService');
const oracleService = require('../services/ai/oracleService');
const skillMatchingService = require('../services/ai/skillMatchingService');
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
    const logId = await humanInTheLoopService.logAIRecommendation({
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
    const logId = await humanInTheLoopService.logAIRecommendation({
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
    const logId = await humanInTheLoopService.logAIRecommendation({
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
 * GET /api/ai/forecast/:projectId
 * Multi-sprint velocity forecasting
 */
exports.forecastVelocity = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await velocityForecastingService.forecastVelocity(projectId);
    
    // Log AI recommendation
    const logId = await humanInTheLoopService.logAIRecommendation({
      type: 'velocity_forecast',
      entityId: projectId,
      aiSuggestion: result.forecasts[0],
      confidence: result.forecasts[0]?.confidence || 0.5,
      explanation: `Forecast based on ${result.historicalData?.length || 0} sprints using ${result.bestModel}`,
      userId: req.user._id.toString()
    });
    
    res.json({
      message: 'Velocity forecasting completed',
      ...result,
      logId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/ai/workload/:projectId
 * Team workload balancing and optimization
 */
exports.getWorkloadBalance = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await teamWorkloadBalancerService.analyzeWorkload(projectId);
    
    // Log AI recommendation
    const logId = await humanInTheLoopService.logAIRecommendation({
      type: 'workload_balance',
      entityId: projectId,
      aiSuggestion: { balanced: result.balanced, suggestions: result.suggestions?.length || 0 },
      confidence: 0.9,
      explanation: result.message,
      userId: req.user._id.toString()
    });
    
    res.json({
      message: 'Workload analysis completed',
      ...result,
      logId
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
      (metrics.sprintPredictability?.score || 0) * 0.3 +
      (metrics.velocityStability?.score || 0) * 0.3 +
      (metrics.taskCompletionRate?.rate || 0) * 0.2 +
      (metrics.riskDetectionTiming?.earlyDetectionScore || 0) * 0.2
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

    const logEntry = await humanInTheLoopService.logHumanDecision(
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
    
    const logs = await humanInTheLoopService.getLogs({ type, entityId, decision });
    const statistics = {
      acceptanceRate: await humanInTheLoopService.getAcceptanceRate(type),
      overrideAnalysis: await humanInTheLoopService.getOverrideReasonsAnalysis()
    };

    res.json({
      logs,
      statistics
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/ai/dashboard-summary/:projectId
 * Get aggregated AI metrics for central dashboard
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const [risk, evaluation, productivity, workload, forecast] = await Promise.all([
      riskPredictionService.predictProjectRisk(projectId),
      evaluationMetricsService.calculateMetrics(projectId),
      productivityService.analyzeProductivity(projectId),
      teamWorkloadBalancerService.analyzeWorkload(projectId),
      velocityForecastingService.forecastVelocity(projectId)
    ]);
    
    res.json({
      message: 'Dashboard summary retrieved',
      summary: {
        projectRisk: {
          level: risk.riskLevel,
          score: risk.riskScore
        },
        evaluation: {
          overallScore: evaluation.overallScore || 0,
          predictability: evaluation.sprintPredictability?.score || 0
        },
        productivity: {
          healthStatus: productivity.healthStatus || 'Stable',
          trend: productivity.trends?.velocity?.direction || 'N/A'
        },
        workload: {
          isBalanced: workload.balanced,
          suggestionCount: workload.suggestions?.length || 0
        },
        forecast: {
          nextSprint: forecast.forecasts?.[0]?.predicted || forecast.forecasts?.[0]?.models?.sma || 0,
          trend: forecast.trend?.direction || 'Stable'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /api/ai/oracle/:projectId
 * AI Project Oracle — answer natural language queries about a project
 */
exports.queryOracle = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const response = await oracleService.query(projectId, query, req.user._id.toString());
    res.json({ response });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/ai/skill-match/:taskId
 * Recommend the best team member for a task based on skills & workload
 */
exports.getSkillMatch = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await skillMatchingService.recommendAssignee(taskId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/ai/team-skills/:projectId
 * Get skill profile of the entire project team
 */
exports.getTeamSkillProfile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await skillMatchingService.getTeamSkillProfile(projectId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

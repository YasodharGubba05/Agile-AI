const Sprint = require('../../models/Sprint');
const Task = require('../../models/Task');
const Project = require('../../models/Project');

/**
 * Evaluation Metrics Service
 * 
 * PURPOSE:
 * - Calculate key performance indicators for AI system evaluation
 * - Measure sprint predictability
 * - Track risk detection timing
 * - Calculate velocity stability
 * - Measure task completion rates
 * 
 * ACADEMIC JUSTIFICATION:
 * - Essential for evaluating AI system performance
 * - Provides quantitative metrics for research
 * - Enables comparison with baseline (non-AI) systems
 * - Supports continuous improvement
 */

class EvaluationMetricsService {
  /**
   * Calculate all evaluation metrics for a project
   * @param {string} projectId - Project ID
   * @returns {Object} Evaluation metrics
   */
  async calculateMetrics(projectId) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const sprints = await Sprint.find({ projectId });
      const tasks = await Task.find({ projectId });
      const completedSprints = sprints.filter(s => s.status === 'Completed');

      return {
        sprintPredictability: this.calculateSprintPredictability(completedSprints),
        riskDetectionTiming: this.calculateRiskDetectionTiming(project, completedSprints),
        velocityStability: this.calculateVelocityStability(completedSprints),
        taskCompletionRate: this.calculateTaskCompletionRate(tasks),
        aiRecommendationAccuracy: await this.calculateAIAccuracy(projectId),
        overallScore: 0 // Will be calculated
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate sprint predictability (planned vs actual)
   * @param {Array} completedSprints - Completed sprints
   * @returns {Object} Predictability metrics
   */
  calculateSprintPredictability(completedSprints) {
    if (completedSprints.length === 0) {
      return {
        score: 0,
        message: 'No completed sprints',
        averageDeviation: 0,
        predictabilityPercentage: 0
      };
    }

    let totalDeviation = 0;
    const deviations = [];

    completedSprints.forEach(sprint => {
      if (sprint.plannedVelocity > 0) {
        const deviation = Math.abs(sprint.actualVelocity - sprint.plannedVelocity) / sprint.plannedVelocity;
        totalDeviation += deviation;
        deviations.push(deviation);
      }
    });

    const avgDeviation = totalDeviation / completedSprints.length;
    const predictabilityScore = Math.max(0, (1 - avgDeviation) * 100);
    const predictabilityPercentage = Math.round(predictabilityScore);

    return {
      score: Math.round(predictabilityScore),
      message: `Based on ${completedSprints.length} sprints, ${predictabilityPercentage}% predictability`,
      averageDeviation: Math.round(avgDeviation * 100) / 100,
      predictabilityPercentage,
      sprintsAnalyzed: completedSprints.length
    };
  }

  /**
   * Calculate risk detection timing (how early risks were detected)
   * @param {Object} project - Project object
   * @param {Array} completedSprints - Completed sprints
   * @returns {Object} Risk detection metrics
   */
  calculateRiskDetectionTiming(project, completedSprints) {
    const riskLevel = project.riskLevel || 'Low';
    const riskScore = project.riskScore || 0;

    // Calculate how early risk was detected
    // (Simplified: assumes risk was detected when first high-risk sprint occurred)
    let earlyDetectionScore = 100;
    
    if (completedSprints.length > 0 && riskLevel === 'High') {
      // Check if risk was detected early (in first half of sprints)
      const highRiskSprints = completedSprints.filter(s => 
        s.sprintHealthScore < 60
      );
      
      if (highRiskSprints.length > 0) {
        const firstRiskSprintIndex = completedSprints.findIndex(s => 
          s.sprintHealthScore < 60
        );
        const detectionTiming = (firstRiskSprintIndex / completedSprints.length) * 100;
        earlyDetectionScore = Math.max(0, 100 - detectionTiming);
      }
    }

    return {
      riskLevel,
      riskScore,
      earlyDetectionScore: Math.round(earlyDetectionScore),
      message: `Risk level: ${riskLevel} (Score: ${riskScore}/100)`,
      detectedEarly: earlyDetectionScore > 50
    };
  }

  /**
   * Calculate velocity stability (consistency of sprint velocities)
   * @param {Array} completedSprints - Completed sprints
   * @returns {Object} Stability metrics
   */
  calculateVelocityStability(completedSprints) {
    if (completedSprints.length < 2) {
      return {
        score: 0,
        message: 'Insufficient data (need at least 2 sprints)',
        coefficientOfVariation: 0
      };
    }

    const velocities = completedSprints.map(s => s.actualVelocity || 0);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;

    if (avgVelocity === 0) {
      return {
        score: 0,
        message: 'No velocity data',
        coefficientOfVariation: 0
      };
    }

    // Calculate coefficient of variation
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / avgVelocity) * 100;

    // Stability score: lower variation = higher score
    const stabilityScore = Math.max(0, 100 - coefficientOfVariation);

    return {
      score: Math.round(stabilityScore),
      message: `Velocity stability: ${Math.round(stabilityScore)}% (lower variation is better)`,
      coefficientOfVariation: Math.round(coefficientOfVariation * 10) / 10,
      averageVelocity: Math.round(avgVelocity),
      standardDeviation: Math.round(stdDev * 10) / 10
    };
  }

  /**
   * Calculate task completion rate
   * @param {Array} tasks - All tasks
   * @returns {Object} Completion metrics
   */
  calculateTaskCompletionRate(tasks) {
    if (tasks.length === 0) {
      return {
        rate: 0,
        message: 'No tasks',
        completed: 0,
        total: 0
      };
    }

    const completed = tasks.filter(t => t.status === 'Completed').length;
    const rate = (completed / tasks.length) * 100;

    return {
      rate: Math.round(rate),
      message: `${completed}/${tasks.length} tasks completed (${Math.round(rate)}%)`,
      completed,
      total: tasks.length
    };
  }

  /**
   * Calculate AI recommendation accuracy
   * (Compare AI predictions with actual outcomes)
   * @param {string} projectId - Project ID
   * @returns {Object} Accuracy metrics
   */
  async calculateAIAccuracy(projectId) {
    // This would compare AI predictions with actual outcomes
    // For now, return placeholder
    return {
      sprintCapacityAccuracy: 'N/A - Requires prediction tracking',
      riskPredictionAccuracy: 'N/A - Requires prediction tracking',
      taskPriorityAccuracy: 'N/A - Requires prediction tracking',
      note: 'Accuracy tracking requires logging of predictions and outcomes'
    };
  }
}

module.exports = new EvaluationMetricsService();

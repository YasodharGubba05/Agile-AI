const Sprint = require('../../models/Sprint');
const Task = require('../../models/Task');
const MLR = require('ml-regression').MultivariateLinearRegression;

/**
 * AI-Assisted Sprint Capacity Prediction Service
 * 
 * MODEL: Multivariate Linear Regression (MLR)
 * 
 * ACADEMIC JUSTIFICATION:
 * - Multivariate Linear Regression captures the independent influence of each feature
 * - More robust than simple regression with weighted sums
 * - Provides coefficients for each factor, maintaining high explainability
 * - Handles small datasets via synthetic data augmentation
 * - Fast training/inference suitable for real-time Agile planning
 * 
 * FEATURES:
 * 1. teamSize: Core capacity baseline
 * 2. numberOfTasks: Overhead and switching costs
 * 3. averageStoryPoints: Granularity and complexity factor
 * 4. historicalVelocity: Momentum and team-specific performance baseline
 * 
 * TARGET: actualVelocity (story points completed)
 */
class SprintCapacityService {
  /**
   * Predict sprint capacity using Multivariate Linear Regression
   * @param {string} projectId - Project ID
   * @param {number} plannedVelocity - Planned velocity for the sprint
   * @param {number} teamSize - Number of team members
   * @returns {Object} Prediction results with explanation
   */
  async predictSprintCapacity(projectId, plannedVelocity, teamSize) {
    try {
      // Get historical sprint data
      const historicalSprints = await Sprint.find({
        projectId,
        status: 'Completed',
        actualVelocity: { $gt: 0 }
      })
      .sort({ endDate: -1 })
      .limit(30);

      // Prepare training data
      let trainingData = [];
      if (historicalSprints.length < 5) {
        // Augment with synthetic data if sparse
        trainingData = await this.prepareTrainingData(projectId, historicalSprints, teamSize, true);
      } else {
        trainingData = await this.prepareTrainingData(projectId, historicalSprints, teamSize, false);
      }

      // Feature extraction
      const x = trainingData.map(d => [
        d.teamSize,
        d.numberOfTasks,
        d.averageStoryPoints,
        d.historicalVelocity
      ]);
      const y = trainingData.map(d => [d.actualVelocity]);

      // Train Multivariate Linear Regression model
      const regression = new MLR(x, y);

      // Get current sprint features
      const currentTasks = await Task.find({ 
        projectId,
        sprintId: null // Tasks not yet assigned to a sprint
      });
      
      const currentNumberOfTasks = currentTasks.length || 10;
      const currentAverageEffort = currentTasks.length > 0
        ? currentTasks.reduce((sum, t) => sum + t.estimatedEffort, 0) / currentTasks.length
        : 5;

      const avgHistoricalVelocity = historicalSprints.length > 0
        ? historicalSprints.reduce((sum, s) => sum + (s.actualVelocity || 0), 0) / historicalSprints.length
        : teamSize * 8;

      // Predict capacity
      const currentX = [[
        teamSize,
        currentNumberOfTasks,
        currentAverageEffort,
        avgHistoricalVelocity
      ]];
      
      const prediction = regression.predict(currentX);
      const predictedCapacity = Math.max(0, Math.round(prediction[0][0]));

      // Calculate model metrics
      const predictions = regression.predict(x);
      const residualSumSq = y.reduce((sum, val, i) => sum + Math.pow(val[0] - predictions[i][0], 2), 0);
      const yMean = y.reduce((sum, val) => sum + val[0], 0) / y.length;
      const totalSumSq = y.reduce((sum, val) => sum + Math.pow(val[0] - yMean, 2), 0);
      const rSquared = totalSumSq === 0 ? 0 : 1 - (residualSumSq / totalSumSq);
      
      const mae = y.reduce((sum, val, i) => sum + Math.abs(val[0] - predictions[i][0]), 0) / y.length;

      // Confidence scoring
      const confidence = this.calculateConfidence(historicalSprints.length, rSquared, mae, predictedCapacity);

      // Overload risk calculation
      const overloadRisk = plannedVelocity > predictedCapacity;
      const overloadPercentage = predictedCapacity > 0
        ? ((plannedVelocity - predictedCapacity) / predictedCapacity) * 100
        : 100;

      // Generate explanation
      const explanation = this.generateExplanation({
        predictedCapacity,
        plannedVelocity,
        overloadRisk,
        overloadPercentage,
        teamSize,
        currentNumberOfTasks,
        avgHistoricalVelocity,
        historicalSprints: historicalSprints.length,
        confidence,
        rSquared,
        mae
      });

      return {
        predictedCapacity,
        plannedCapacity: plannedVelocity,
        overloadRisk,
        overloadPercentage: overloadRisk ? Math.round(overloadPercentage) : 0,
        confidence: confidence.level,
        confidenceScore: confidence.score,
        modelMetrics: {
          rSquared: Math.round(rSquared * 100) / 100,
          meanAbsoluteError: Math.round(mae * 10) / 10,
          trainingSamples: trainingData.length
        },
        explanation,
        modelType: 'Multivariate Linear Regression',
        academicNotes: {
          modelChoice: 'Multivariate Linear Regression for independent feature weights',
          strengths: 'Captures complex interactions between team size, task volume, and granularity',
          limitations: 'Requires data normalization for optimal performance in larger projects'
        }
      };
    } catch (error) {
      console.error('Error in multivariate prediction:', error);
      // Fallback
      return this.fallbackHeuristic(teamSize, plannedVelocity);
    }
  }

  /**
   * Prepare training data, optionally adding synthetic samples
   */
  async prepareTrainingData(projectId, historicalSprints, teamSize, shouldAugment) {
    const data = [];

    // Real data
    for (const sprint of historicalSprints) {
      const tasks = await Task.find({ sprintId: sprint._id });
      const previousSprints = historicalSprints.filter(s => s.endDate < sprint.endDate);
      
      data.push({
        teamSize,
        numberOfTasks: tasks.length || 1,
        averageStoryPoints: tasks.length > 0 ? tasks.reduce((sum, t) => sum + t.estimatedEffort, 0) / tasks.length : 5,
        historicalVelocity: previousSprints.length > 0 ? previousSprints.reduce((sum, s) => sum + s.actualVelocity, 0) / previousSprints.length : teamSize * 8,
        actualVelocity: sprint.actualVelocity
      });
    }

    // Synthetic data augmentation
    if (shouldAugment) {
      const baseVelocity = teamSize * 8;
      for (let i = 0; i < 10; i++) {
        const numTasks = Math.floor(Math.random() * 15) + 5;
        const avgPoints = Math.random() * 4 + 3;
        const histVel = baseVelocity + (Math.random() * 10 - 5);
        
        // Realistic linear relationship with noise
        const actual = (teamSize * 5) + (numTasks * 0.3) + (avgPoints * 0.2) + (histVel * 0.4) + (Math.random() * 6 - 3);
        
        data.push({
          teamSize,
          numberOfTasks: numTasks,
          averageStoryPoints: avgPoints,
          historicalVelocity: Math.max(0, histVel),
          actualVelocity: Math.max(0, Math.round(actual))
        });
      }
    }

    return data;
  }

  calculateConfidence(dataSize, rSquared, mae, predictedCapacity) {
    let score = 0.5;
    if (dataSize >= 10) score += 0.2;
    if (rSquared > 0.7) score += 0.2;
    if (predictedCapacity > 0 && (mae / predictedCapacity) < 0.15) score += 0.1;
    
    score = Math.min(1, Math.max(0, score));
    return {
      score,
      level: score >= 0.8 ? 'High' : score >= 0.5 ? 'Medium' : 'Low'
    };
  }

  generateExplanation(params) {
    let exp = `🤖 AI Multivariate Capacity Analysis\n\n`;
    exp += `Predicted: ${params.predictedCapacity} pts | Planned: ${params.plannedVelocity} pts\n`;
    exp += `Confidence: ${params.confidence.level} (${Math.round(params.confidence.score * 100)}%)\n\n`;
    
    if (params.overloadRisk) {
      exp += `⚠️ OVERLOAD RISK: ${Math.round(params.overloadPercentage)}%\n`;
      exp += `Recommendation: Reduce scope by ${Math.ceil(params.plannedVelocity - params.predictedCapacity)} story points.\n`;
    } else {
      exp += `✅ PLANNING OK: Within capacity.\n`;
    }
    
    exp += `\nModel based on ${params.historicalSprints} sprints. R-Squared: ${Math.round(params.rSquared * 100)}%`;
    return exp;
  }

  fallbackHeuristic(teamSize, plannedVelocity) {
    const predictedCapacity = teamSize * 8;
    return {
      predictedCapacity,
      plannedCapacity: plannedVelocity,
      overloadRisk: plannedVelocity > predictedCapacity,
      confidence: 'Low',
      explanation: 'Using heuristic fallback due to modeling constraint.'
    };
  }
}

module.exports = new SprintCapacityService();

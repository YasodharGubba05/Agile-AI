const Sprint = require('../../models/Sprint');
const Task = require('../../models/Task');
const LinearRegression = require('ml-regression').SimpleLinearRegression;

/**
 * AI-Assisted Sprint Planning Service
 * Uses Linear Regression to predict sprint capacity based on historical data
 */
class SprintPlanningService {
  /**
   * Predict sprint capacity using linear regression
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
      .limit(10);

      // If no historical data, use simple heuristic
      if (historicalSprints.length < 2) {
        const predictedCapacity = teamSize * 8; // Simple heuristic: 8 story points per team member
        const overloadWarning = plannedVelocity > predictedCapacity;
        
        return {
          predictedCapacity: Math.round(predictedCapacity),
          overloadWarning,
          explanation: `No sufficient historical data available. Using heuristic: ${teamSize} team members × 8 story points = ${predictedCapacity} story points. ${overloadWarning ? 'Warning: Planned velocity exceeds predicted capacity!' : 'Planned velocity is within predicted capacity.'}`
        };
      }

      // Prepare training data
      const X = []; // Features: [teamSize, numberOfTasks, averageTaskEffort]
      const y = []; // Target: actualVelocity

      for (const sprint of historicalSprints) {
        const tasks = await Task.find({ sprintId: sprint._id });
        const numberOfTasks = tasks.length;
        const averageTaskEffort = tasks.length > 0
          ? tasks.reduce((sum, t) => sum + t.estimatedEffort, 0) / tasks.length
          : 0;

        X.push([teamSize, numberOfTasks, averageTaskEffort]);
        y.push(sprint.actualVelocity);
      }

      // Use weighted average of features for simple linear regression
      // Since ml-regression SimpleLinearRegression only handles 1D input,
      // we'll use a weighted combination approach
      const features = X.map(x => x[0] * 0.4 + x[1] * 0.3 + x[2] * 0.3);
      
      // Train linear regression model
      const regression = new LinearRegression(features, y);

      // Predict for current sprint
      const currentTasks = await Task.find({ 
        projectId,
        sprintId: null // Tasks not yet assigned to a sprint
      });
      const currentNumberOfTasks = currentTasks.length;
      const currentAverageEffort = currentTasks.length > 0
        ? currentTasks.reduce((sum, t) => sum + t.estimatedEffort, 0) / currentTasks.length
        : 5; // Default average

      const currentFeature = teamSize * 0.4 + currentNumberOfTasks * 0.3 + currentAverageEffort * 0.3;
      const predictedCapacity = Math.max(0, Math.round(regression.predict(currentFeature)));

      // Calculate overload warning
      const overloadWarning = plannedVelocity > predictedCapacity;

      // Generate explanation
      const avgHistoricalVelocity = y.reduce((a, b) => a + b, 0) / y.length;
      const velocityTrend = y.length >= 2 ? (y[0] - y[y.length - 1]) / y.length : 0;
      
      let explanation = `Based on ${historicalSprints.length} historical sprints:\n`;
      explanation += `- Average historical velocity: ${avgHistoricalVelocity.toFixed(1)} story points\n`;
      explanation += `- Team size: ${teamSize} members\n`;
      explanation += `- Predicted capacity: ${predictedCapacity} story points\n`;
      
      if (overloadWarning) {
        explanation += `⚠️ WARNING: Planned velocity (${plannedVelocity}) exceeds predicted capacity! This may lead to sprint overload.`;
      } else {
        explanation += `✓ Planned velocity (${plannedVelocity}) is within predicted capacity.`;
      }

      return {
        predictedCapacity,
        overloadWarning,
        explanation
      };
    } catch (error) {
      console.error('Error in sprint planning prediction:', error);
      // Fallback to simple heuristic
      const predictedCapacity = teamSize * 8;
      const overloadWarning = plannedVelocity > predictedCapacity;
      
      return {
        predictedCapacity,
        overloadWarning,
        explanation: `Error in prediction model. Using fallback heuristic: ${teamSize} team members × 8 story points = ${predictedCapacity} story points.`
      };
    }
  }
}

module.exports = new SprintPlanningService();

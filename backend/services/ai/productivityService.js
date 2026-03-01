const Sprint = require('../../models/Sprint');
const Task = require('../../models/Task');

/**
 * Team Productivity & Burnout Indicator Service
 * 
 * MODEL: Trend Analysis (Moving Averages + Slope Analysis)
 * 
 * ACADEMIC JUSTIFICATION:
 * - Trend analysis chosen for simplicity and interpretability
 * - Moving averages smooth out noise and reveal underlying trends
 * - Slope analysis provides clear direction (improving/declining)
 * - No complex ML needed - statistical methods sufficient
 * - Easy to explain to stakeholders
 * 
 * STRENGTHS:
 * - Simple and interpretable
 * - Fast computation
 * - Works with time-series data
 * - Clear trend direction
 * 
 * LIMITATIONS:
 * - Assumes linear trends (may miss cyclical patterns)
 * - Requires sufficient historical data
 * - Sensitive to outliers
 * 
 * FEATURES:
 * - Task completion rate over time
 * - Sprint velocity trend
 * - Task status distribution changes
 */
class ProductivityService {
  /**
   * Analyze team productivity trends and detect burnout indicators
   * @param {string} projectId - Project ID
   * @returns {Object} Productivity analysis with recommendations
   */
  async analyzeProductivity(projectId) {
    try {
      const sprints = await Sprint.find({ projectId })
        .sort({ endDate: 1 }); // Oldest first for trend analysis

      const completedSprints = sprints.filter(s => s.status === 'Completed');
      
      if (completedSprints.length < 3) {
        return {
          productivityTrend: 'Insufficient Data',
          warning: false,
          recommendation: 'Need at least 3 completed sprints for trend analysis',
          dataPoints: completedSprints.length
        };
      }

      // Calculate velocity trend
      const velocities = completedSprints.map(s => s.actualVelocity || 0);
      const velocityTrend = this.calculateTrend(velocities);

      // Calculate completion rate trend
      const completionRates = await Promise.all(
        completedSprints.map(async (sprint) => {
          const tasks = await Task.find({ sprintId: sprint._id });
          if (tasks.length === 0) return 100;
          const completed = tasks.filter(t => t.status === 'Completed').length;
          return (completed / tasks.length) * 100;
        })
      );
      const completionTrend = this.calculateTrend(completionRates);

      // Calculate sprint health trend
      const healthScores = completedSprints.map(s => s.sprintHealthScore || 100);
      const healthTrend = this.calculateTrend(healthScores);

      // Determine overall productivity trend
      const trends = [velocityTrend, completionTrend, healthTrend];
      const avgSlope = trends.reduce((sum, t) => sum + t.slope, 0) / trends.length;
      
      let productivityTrend;
      if (avgSlope > 2) {
        productivityTrend = 'Improving';
      } else if (avgSlope < -2) {
        productivityTrend = 'Declining';
      } else {
        productivityTrend = 'Stable';
      }

      // Detect burnout indicators
      const warning = this.detectBurnoutIndicators({
        velocityTrend,
        completionTrend,
        healthTrend,
        velocities,
        completionRates
      });

      // Generate recommendations
      const recommendation = this.generateProductivityRecommendation({
        productivityTrend,
        warning,
        velocityTrend,
        completionTrend,
        healthTrend
      });

      return {
        productivityTrend,
        warning,
        recommendation,
        trends: {
          velocity: {
            direction: velocityTrend.direction,
            slope: Math.round(velocityTrend.slope * 100) / 100,
            change: `${velocityTrend.direction === 'Improving' ? '+' : velocityTrend.direction === 'Declining' ? '-' : ''}${Math.abs(Math.round(velocityTrend.slope * 100) / 100)}`
          },
          completion: {
            direction: completionTrend.direction,
            slope: Math.round(completionTrend.slope * 100) / 100,
            change: `${completionTrend.direction === 'Improving' ? '+' : completionTrend.direction === 'Declining' ? '-' : ''}${Math.abs(Math.round(completionTrend.slope * 100) / 100)}`
          },
          health: {
            direction: healthTrend.direction,
            slope: Math.round(healthTrend.slope * 100) / 100,
            change: `${healthTrend.direction === 'Improving' ? '+' : healthTrend.direction === 'Declining' ? '-' : ''}${Math.abs(Math.round(healthTrend.slope * 100) / 100)}`
          }
        },
        dataPoints: completedSprints.length,
        modelType: 'Trend Analysis (Moving Averages)',
        academicNotes: {
          modelChoice: 'Trend analysis chosen for simplicity and interpretability',
          method: 'Linear regression on moving averages to detect trends',
          strengths: 'Simple, interpretable, reveals underlying patterns',
          limitations: 'Assumes linear trends, requires sufficient data'
        }
      };
    } catch (error) {
      console.error('Error in productivity analysis:', error);
      return {
        productivityTrend: 'Unknown',
        warning: false,
        recommendation: 'Unable to analyze productivity trends',
        modelType: 'Error',
        academicNotes: {
          note: 'Analysis failed due to error'
        }
      };
    }
  }

  /**
   * Calculate trend using linear regression on moving averages
   */
  calculateTrend(values) {
    if (values.length < 2) {
      return { direction: 'Stable', slope: 0 };
    }

    // Calculate moving average (window size = 3 or length if shorter)
    const windowSize = Math.min(3, Math.floor(values.length / 2));
    const movingAverages = [];
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(values.length, i + Math.ceil(windowSize / 2));
      const window = values.slice(start, end);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;
      movingAverages.push(avg);
    }

    // Calculate slope using linear regression
    const n = movingAverages.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = movingAverages.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * movingAverages[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    let direction;
    if (slope > 0.5) {
      direction = 'Improving';
    } else if (slope < -0.5) {
      direction = 'Declining';
    } else {
      direction = 'Stable';
    }

    return { direction, slope };
  }

  /**
   * Detect burnout indicators
   */
  detectBurnoutIndicators(metrics) {
    const { velocityTrend, completionTrend, healthTrend, velocities, completionRates } = metrics;

    // Check for consistent decline
    const decliningTrends = [
      velocityTrend.direction === 'Declining',
      completionTrend.direction === 'Declining',
      healthTrend.direction === 'Declining'
    ].filter(Boolean).length;

    if (decliningTrends >= 2) {
      return true;
    }

    // Check for significant drop in recent sprints
    if (velocities.length >= 3) {
      const recentAvg = velocities.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const earlierAvg = velocities.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      if (recentAvg < earlierAvg * 0.7) { // 30% drop
        return true;
      }
    }

    // Check for low completion rates
    if (completionRates.length > 0) {
      const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
      if (avgCompletion < 60) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate productivity recommendations
   */
  generateProductivityRecommendation(params) {
    const { productivityTrend, warning, velocityTrend, completionTrend, healthTrend } = params;

    if (warning) {
      return '⚠️ Burnout indicators detected. Consider reducing workload, rebalancing tasks, or providing additional support to the team.';
    }

    if (productivityTrend === 'Declining') {
      return 'Productivity is declining. Review sprint planning, identify blockers, and consider team capacity adjustments.';
    }

    if (productivityTrend === 'Improving') {
      return '✅ Productivity is improving! Maintain current practices and continue monitoring trends.';
    }

    return 'Productivity is stable. Continue current practices and monitor for changes.';
  }
}

module.exports = new ProductivityService();

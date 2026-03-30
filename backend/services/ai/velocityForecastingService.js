const Sprint = require('../../models/Sprint');
const Task = require('../../models/Task');
const LinearRegression = require('ml-regression').SimpleLinearRegression;

/**
 * Multi-Sprint Velocity Forecasting Service
 * 
 * MODEL: Linear Regression + Exponential Weighted Moving Average (EWMA)
 * 
 * ACADEMIC JUSTIFICATION:
 * - Uses multiple forecasting methods for comparison
 * - Simple Moving Average (SMA) for baseline
 * - Linear Regression for trend-based prediction
 * - EWMA for recency-weighted prediction
 * - Confidence intervals based on historical standard deviation
 * 
 * OUTPUT:
 * - 3 sprint velocity forecasts with confidence intervals
 * - Trend direction and magnitude
 * - Model comparison results
 */
class VelocityForecastingService {
  /**
   * Forecast velocity for next N sprints
   * @param {string} projectId - Project ID
   * @param {number} horizons - Number of sprints to forecast (default: 3)
   * @returns {Object} Forecast results with confidence intervals
   */
  async forecastVelocity(projectId, horizons = 3) {
    try {
      const completedSprints = await Sprint.find({
        projectId,
        status: 'Completed',
        actualVelocity: { $gt: 0 }
      }).sort({ endDate: 1 });

      if (completedSprints.length < 2) {
        return {
          error: false,
          message: 'Insufficient data for forecasting (need at least 2 completed sprints)',
          forecasts: [],
          dataPoints: completedSprints.length,
          modelType: 'Insufficient Data'
        };
      }

      const velocities = completedSprints.map(s => s.actualVelocity);
      const n = velocities.length;

      // Method 1: Simple Moving Average (SMA)
      const windowSize = Math.min(3, n);
      const smaForecast = velocities.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;

      // Method 2: Linear Regression Trend
      const xValues = Array.from({ length: n }, (_, i) => i);
      const regression = new LinearRegression(xValues, velocities);
      const lrForecasts = [];
      for (let i = 0; i < horizons; i++) {
        lrForecasts.push(Math.max(0, Math.round(regression.predict(n + i))));
      }

      // Method 3: Exponential Weighted Moving Average (EWMA)
      const alpha = 0.3; // Smoothing factor (higher = more weight on recent data)
      let ewma = velocities[0];
      for (let i = 1; i < n; i++) {
        ewma = alpha * velocities[i] + (1 - alpha) * ewma;
      }

      // Calculate standard deviation for confidence intervals
      const mean = velocities.reduce((a, b) => a + b, 0) / n;
      const variance = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      // Calculate R-squared for linear regression
      const predictions = xValues.map(x => regression.predict(x));
      const ssRes = velocities.reduce((sum, v, i) => sum + Math.pow(v - predictions[i], 2), 0);
      const ssTot = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
      const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

      // Determine best model based on fit
      const bestModel = rSquared > 0.5 ? 'Linear Regression' : 'EWMA';

      // Generate forecasts with confidence intervals
      const forecasts = [];
      for (let i = 0; i < horizons; i++) {
        const lrValue = lrForecasts[i];
        const ewmaValue = Math.round(ewma); // EWMA stays flat for future
        const bestValue = bestModel === 'Linear Regression' ? lrValue : ewmaValue;

        // Confidence interval widens with forecast horizon
        const marginMultiplier = 1 + (i * 0.3);
        const margin = Math.round(stdDev * marginMultiplier);

        forecasts.push({
          sprint: `Sprint +${i + 1}`,
          predicted: bestValue,
          lowerBound: Math.max(0, bestValue - margin),
          upperBound: bestValue + margin,
          confidence: Math.max(0.4, Math.round((1 - (i * 0.15)) * 100) / 100),
          models: {
            sma: Math.round(smaForecast),
            linearRegression: lrValue,
            ewma: ewmaValue
          }
        });
      }

      // Trend analysis
      const slope = regression.slope;
      let trendDirection;
      if (slope > 1) trendDirection = 'Improving';
      else if (slope < -1) trendDirection = 'Declining';
      else trendDirection = 'Stable';

      return {
        error: false,
        forecasts,
        trend: {
          direction: trendDirection,
          slope: Math.round(slope * 100) / 100,
          rSquared: Math.round(rSquared * 100) / 100
        },
        historicalData: completedSprints.map(s => ({
          name: s.name,
          velocity: s.actualVelocity,
          date: s.endDate
        })),
        bestModel,
        modelComparison: {
          sma: {
            name: 'Simple Moving Average',
            description: 'Average of last 3 sprints',
            value: Math.round(smaForecast)
          },
          linearRegression: {
            name: 'Linear Regression',
            description: 'Trend-based prediction using least squares',
            rSquared: Math.round(rSquared * 100) / 100,
            value: lrForecasts[0]
          },
          ewma: {
            name: 'Exponential Weighted Moving Average',
            description: 'Recency-weighted prediction (α=0.3)',
            value: Math.round(ewma)
          }
        },
        dataPoints: n,
        modelType: 'Ensemble (SMA + Linear Regression + EWMA)',
        academicNotes: {
          modelChoice: 'Ensemble of 3 forecasting methods for robustness',
          bestModelSelection: `${bestModel} selected based on R² = ${Math.round(rSquared * 100)}%`,
          strengths: 'Multiple models provide cross-validation, confidence intervals quantify uncertainty',
          limitations: 'Assumes historical patterns continue, cannot predict external disruptions'
        }
      };
    } catch (error) {
      console.error('Error in velocity forecasting:', error);
      return {
        error: true,
        message: 'Error generating velocity forecast',
        forecasts: [],
        modelType: 'Error'
      };
    }
  }
}

module.exports = new VelocityForecastingService();

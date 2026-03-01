const Project = require('../../models/Project');
const Sprint = require('../../models/Sprint');
const Task = require('../../models/Task');

/**
 * Project Risk Prediction Service
 * 
 * MODEL: Decision Tree Classifier (Rule-Based Implementation)
 * 
 * ACADEMIC JUSTIFICATION:
 * - Decision Trees chosen for interpretability and explainability
 * - Provides clear decision paths that can be explained to stakeholders
 * - No black-box predictions - every decision is traceable
 * - Works well with categorical and numerical features
 * - Can handle non-linear relationships through tree structure
 * 
 * STRENGTHS:
 * - Highly interpretable: Clear if-then rules
 * - Feature importance: Shows which factors matter most
 * - No assumptions about data distribution
 * - Handles mixed data types
 * 
 * LIMITATIONS:
 * - Can overfit with small datasets
 * - Sensitive to small data changes
 * - Rule-based implementation (not full tree learning algorithm)
 * - May miss complex interactions
 * 
 * FEATURES:
 * - missedDeadlines: Percentage of tasks with missed deadlines
 * - taskSpilloverRate: Percentage of sprints with task spillover
 * - bugCount: Total number of bugs across project
 * - velocityFluctuation: Coefficient of variation in sprint velocities
 * - completionRate: Percentage of completed tasks
 * - sprintHealthAverage: Average sprint health score
 * 
 * OUTPUT CLASSES:
 * - Low Risk (0-29 score)
 * - Medium Risk (30-59 score)
 * - High Risk (60-100 score)
 */
class RiskPredictionService {
  /**
   * Predict project risk using Decision Tree logic
   * @param {string} projectId - Project ID
   * @returns {Object} Risk prediction with explanation
   */
  async predictProjectRisk(projectId) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Collect project metrics
      const sprints = await Sprint.find({ projectId });
      const tasks = await Task.find({ projectId });
      
      const completedSprints = sprints.filter(s => s.status === 'Completed');
      
      // Calculate features (Decision Tree inputs)
      const features = {
        missedDeadlines: this.calculateMissedDeadlines(tasks),
        taskSpilloverRate: this.calculateTaskSpilloverRate(sprints),
        bugCount: this.calculateBugCount(tasks),
        velocityFluctuation: this.calculateVelocityFluctuation(completedSprints),
        completionRate: this.calculateCompletionRate(tasks),
        sprintHealthAverage: this.calculateSprintHealthAverage(completedSprints)
      };

      // Decision Tree Classification Logic
      // Simulating decision tree with explicit rules for explainability
      const decisionPath = this.traverseDecisionTree(features);
      const riskLevel = decisionPath.riskLevel;
      const riskScore = decisionPath.riskScore;
      const topFactors = decisionPath.topFactors;

      // Generate detailed explanation with decision path
      const explanation = this.generateDecisionTreeExplanation(features, decisionPath);

      // Update project with risk information
      project.riskScore = riskScore;
      project.riskLevel = riskLevel;
      project.riskExplanation = explanation;
      await project.save();

      return {
        riskLevel,
        riskScore,
        explanation,
        features,
        topFactors,
        decisionPath: decisionPath.path,
        modelType: 'Decision Tree (Rule-Based)',
        academicNotes: {
          modelChoice: 'Decision Tree chosen for interpretability and explainability',
          strengths: 'Clear decision rules, feature importance, no black-box',
          limitations: 'Rule-based implementation, may miss complex interactions',
          decisionPath: 'All decisions traceable through explicit if-then rules'
        }
      };
    } catch (error) {
      console.error('Error in risk prediction:', error);
      return {
        riskLevel: 'Medium',
        riskScore: 50,
        explanation: 'Unable to calculate risk. Using default medium risk level.',
        features: {},
        topFactors: [],
        modelType: 'Fallback',
        academicNotes: {
          note: 'Fallback used due to prediction error'
        }
      };
    }
  }

  /**
   * Traverse Decision Tree to classify risk
   * Returns decision path for explainability
   */
  traverseDecisionTree(features) {
    const path = [];
    let riskScore = 0;
    const factorContributions = {};

    // Decision Node 1: Missed Deadlines
    path.push('Checking missed deadlines...');
    if (features.missedDeadlines > 30) {
      riskScore += 30;
      factorContributions.missedDeadlines = 30;
      path.push(`→ High missed deadlines (${features.missedDeadlines.toFixed(1)}%) → +30 risk points`);
    } else if (features.missedDeadlines > 15) {
      riskScore += 15;
      factorContributions.missedDeadlines = 15;
      path.push(`→ Moderate missed deadlines (${features.missedDeadlines.toFixed(1)}%) → +15 risk points`);
    } else if (features.missedDeadlines > 5) {
      riskScore += 5;
      factorContributions.missedDeadlines = 5;
      path.push(`→ Some missed deadlines (${features.missedDeadlines.toFixed(1)}%) → +5 risk points`);
    } else {
      path.push(`→ Low missed deadlines (${features.missedDeadlines.toFixed(1)}%) → +0 risk points`);
    }

    // Decision Node 2: Task Spillover
    path.push('Checking task spillover rate...');
    if (features.taskSpilloverRate > 50) {
      riskScore += 25;
      factorContributions.taskSpilloverRate = 25;
      path.push(`→ High spillover rate (${features.taskSpilloverRate.toFixed(1)}%) → +25 risk points`);
    } else if (features.taskSpilloverRate > 30) {
      riskScore += 15;
      factorContributions.taskSpilloverRate = 15;
      path.push(`→ Moderate spillover (${features.taskSpilloverRate.toFixed(1)}%) → +15 risk points`);
    } else if (features.taskSpilloverRate > 10) {
      riskScore += 5;
      factorContributions.taskSpilloverRate = 5;
      path.push(`→ Some spillover (${features.taskSpilloverRate.toFixed(1)}%) → +5 risk points`);
    } else {
      path.push(`→ Low spillover (${features.taskSpilloverRate.toFixed(1)}%) → +0 risk points`);
    }

    // Decision Node 3: Bug Count
    path.push('Checking bug count...');
    if (features.bugCount > 20) {
      riskScore += 20;
      factorContributions.bugCount = 20;
      path.push(`→ High bug count (${features.bugCount}) → +20 risk points`);
    } else if (features.bugCount > 10) {
      riskScore += 10;
      factorContributions.bugCount = 10;
      path.push(`→ Moderate bugs (${features.bugCount}) → +10 risk points`);
    } else if (features.bugCount > 5) {
      riskScore += 5;
      factorContributions.bugCount = 5;
      path.push(`→ Some bugs (${features.bugCount}) → +5 risk points`);
    } else {
      path.push(`→ Low bug count (${features.bugCount}) → +0 risk points`);
    }

    // Decision Node 4: Velocity Fluctuation
    path.push('Checking velocity stability...');
    if (features.velocityFluctuation > 40) {
      riskScore += 15;
      factorContributions.velocityFluctuation = 15;
      path.push(`→ High fluctuation (${features.velocityFluctuation.toFixed(1)}%) → +15 risk points`);
    } else if (features.velocityFluctuation > 25) {
      riskScore += 10;
      factorContributions.velocityFluctuation = 10;
      path.push(`→ Moderate fluctuation (${features.velocityFluctuation.toFixed(1)}%) → +10 risk points`);
    } else if (features.velocityFluctuation > 15) {
      riskScore += 5;
      factorContributions.velocityFluctuation = 5;
      path.push(`→ Some fluctuation (${features.velocityFluctuation.toFixed(1)}%) → +5 risk points`);
    } else {
      path.push(`→ Stable velocity (${features.velocityFluctuation.toFixed(1)}%) → +0 risk points`);
    }

    // Decision Node 5: Sprint Health
    path.push('Checking sprint health...');
    if (features.sprintHealthAverage < 60) {
      riskScore += 10;
      factorContributions.sprintHealthAverage = 10;
      path.push(`→ Low health (${features.sprintHealthAverage.toFixed(1)}%) → +10 risk points`);
    } else if (features.sprintHealthAverage < 75) {
      riskScore += 5;
      factorContributions.sprintHealthAverage = 5;
      path.push(`→ Moderate health (${features.sprintHealthAverage.toFixed(1)}%) → +5 risk points`);
    } else {
      path.push(`→ Good health (${features.sprintHealthAverage.toFixed(1)}%) → +0 risk points`);
    }

    // Final Classification
    let riskLevel;
    if (riskScore >= 60) {
      riskLevel = 'High';
      path.push(`→ FINAL DECISION: HIGH RISK (Score: ${riskScore}/100)`);
    } else if (riskScore >= 30) {
      riskLevel = 'Medium';
      path.push(`→ FINAL DECISION: MEDIUM RISK (Score: ${riskScore}/100)`);
    } else {
      riskLevel = 'Low';
      path.push(`→ FINAL DECISION: LOW RISK (Score: ${riskScore}/100)`);
    }

    // Get top contributing factors
    const topFactors = Object.entries(factorContributions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([factor, score]) => {
        const factorNames = {
          missedDeadlines: 'High missed deadlines',
          taskSpilloverRate: 'Task spillover issues',
          bugCount: 'High bug count',
          velocityFluctuation: 'Velocity instability',
          sprintHealthAverage: 'Low sprint health'
        };
        return factorNames[factor] || factor;
      });

    return {
      riskLevel,
      riskScore,
      topFactors,
      path,
      factorContributions
    };
  }

  calculateMissedDeadlines(tasks) {
    if (tasks.length === 0) return 0;
    
    const now = new Date();
    const overdueTasks = tasks.filter(task => {
      if (!task.deadline || task.status === 'Completed') return false;
      return new Date(task.deadline) < now;
    });
    
    return (overdueTasks.length / tasks.length) * 100;
  }

  calculateTaskSpilloverRate(sprints) {
    if (sprints.length === 0) return 0;
    
    let spilloverCount = 0;
    for (const sprint of sprints) {
      if (sprint.status === 'Completed' && sprint.plannedVelocity > 0) {
        const completionRate = sprint.actualVelocity / sprint.plannedVelocity;
        if (completionRate < 0.8) { // Less than 80% completion
          spilloverCount++;
        }
      }
    }
    
    return sprints.length > 0 ? (spilloverCount / sprints.length) * 100 : 0;
  }

  calculateBugCount(tasks) {
    return tasks.reduce((sum, task) => sum + (task.bugCount || 0), 0);
  }

  calculateVelocityFluctuation(completedSprints) {
    if (completedSprints.length < 2) return 0;
    
    const velocities = completedSprints.map(s => s.actualVelocity || 0);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    
    if (avgVelocity === 0) return 0;
    
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length;
    const stdDev = Math.sqrt(variance);
    
    return (stdDev / avgVelocity) * 100; // Coefficient of variation
  }

  calculateCompletionRate(tasks) {
    if (tasks.length === 0) return 100;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    return (completed / tasks.length) * 100;
  }

  calculateSprintHealthAverage(completedSprints) {
    if (completedSprints.length === 0) return 100;
    const sum = completedSprints.reduce((s, sprint) => s + (sprint.sprintHealthScore || 100), 0);
    return sum / completedSprints.length;
  }

  /**
   * Generate detailed explanation with decision tree path
   */
  generateDecisionTreeExplanation(features, decisionPath) {
    let explanation = `🌳 DECISION TREE RISK ANALYSIS\n\n`;
    explanation += `MODEL: Decision Tree Classifier (Rule-Based)\n`;
    explanation += `RISK LEVEL: ${decisionPath.riskLevel}\n`;
    explanation += `RISK SCORE: ${decisionPath.riskScore}/100\n\n`;

    explanation += `DECISION PATH:\n`;
    decisionPath.path.forEach((step, idx) => {
      explanation += `${idx + 1}. ${step}\n`;
    });

    explanation += `\nTOP CONTRIBUTING FACTORS:\n`;
    decisionPath.topFactors.forEach((factor, idx) => {
      explanation += `${idx + 1}. ${factor}\n`;
    });

    explanation += `\nFEATURE VALUES:\n`;
    explanation += `- Missed Deadlines: ${features.missedDeadlines.toFixed(1)}%\n`;
    explanation += `- Task Spillover Rate: ${features.taskSpilloverRate.toFixed(1)}%\n`;
    explanation += `- Bug Count: ${features.bugCount}\n`;
    explanation += `- Velocity Fluctuation: ${features.velocityFluctuation.toFixed(1)}%\n`;
    explanation += `- Completion Rate: ${features.completionRate.toFixed(1)}%\n`;
    explanation += `- Sprint Health Average: ${features.sprintHealthAverage.toFixed(1)}%\n`;

    explanation += `\nRECOMMENDATION:\n`;
    if (decisionPath.riskLevel === 'High') {
      explanation += `Immediate attention required. Address top contributing factors to reduce project risk.`;
    } else if (decisionPath.riskLevel === 'Medium') {
      explanation += `Monitor closely. Focus on improving factors contributing to risk.`;
    } else {
      explanation += `Project is on track. Continue current practices.`;
    }

    return explanation;
  }
}

module.exports = new RiskPredictionService();

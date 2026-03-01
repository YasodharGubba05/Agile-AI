const Sprint = require('../../models/Sprint');
const Task = require('../../models/Task');

/**
 * AI-Driven Sprint Retrospective Service
 * Generates insights and recommendations based on sprint metrics
 */
class RetrospectiveService {
  /**
   * Generate retrospective insights for a completed sprint
   * @param {string} sprintId - Sprint ID
   * @returns {Object} Retrospective insights
   */
  async generateRetrospective(sprintId) {
    try {
      const sprint = await Sprint.findById(sprintId)
        .populate('projectId', 'name');
      
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      if (sprint.status !== 'Completed') {
        return {
          error: 'Sprint must be completed to generate retrospective'
        };
      }

      const tasks = await Task.find({ sprintId });
      const completedTasks = tasks.filter(t => t.status === 'Completed');
      const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
      const todoTasks = tasks.filter(t => t.status === 'To Do');

      // Calculate metrics
      const metrics = {
        plannedVelocity: sprint.plannedVelocity,
        actualVelocity: sprint.actualVelocity,
        velocityDifference: sprint.actualVelocity - sprint.plannedVelocity,
        velocityPercentage: sprint.plannedVelocity > 0 
          ? ((sprint.actualVelocity / sprint.plannedVelocity) * 100).toFixed(1)
          : 0,
        sprintHealthScore: sprint.sprintHealthScore,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
        averageTaskEffort: tasks.length > 0
          ? tasks.reduce((sum, t) => sum + t.estimatedEffort, 0) / tasks.length
          : 0,
        averageActualEffort: completedTasks.length > 0
          ? completedTasks.reduce((sum, t) => sum + (t.actualEffort || t.estimatedEffort), 0) / completedTasks.length
          : 0
      };

      // Generate insights
      const insights = this.generateInsights(metrics, tasks);
      const recommendations = this.generateRecommendations(metrics, insights);

      return {
        sprint: {
          id: sprint._id,
          name: sprint.name,
          projectName: sprint.projectId.name
        },
        metrics,
        insights,
        recommendations,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating retrospective:', error);
      return {
        error: 'Unable to generate retrospective',
        message: error.message
      };
    }
  }

  generateInsights(metrics, tasks) {
    const insights = [];

    // Velocity insights
    if (metrics.velocityDifference < -10) {
      insights.push({
        type: 'warning',
        title: 'Velocity Below Plan',
        message: `Sprint velocity decreased by ${Math.abs(metrics.velocityDifference)} story points (${metrics.velocityPercentage}% of planned). This indicates potential sprint overload or unexpected blockers.`
      });
    } else if (metrics.velocityDifference > 10) {
      insights.push({
        type: 'success',
        title: 'Velocity Above Plan',
        message: `Sprint velocity exceeded plan by ${metrics.velocityDifference} story points. Great work! Consider if estimates were conservative or if team capacity was underestimated.`
      });
    } else {
      insights.push({
        type: 'info',
        title: 'Velocity On Track',
        message: `Sprint velocity was close to planned (${metrics.velocityPercentage}% of planned). Good predictability!`
      });
    }

    // Completion rate insights
    if (metrics.completionRate < 70) {
      insights.push({
        type: 'warning',
        title: 'Low Completion Rate',
        message: `Only ${metrics.completionRate.toFixed(1)}% of tasks were completed. This may indicate scope creep, underestimated effort, or external blockers.`
      });
    } else if (metrics.completionRate >= 90) {
      insights.push({
        type: 'success',
        title: 'High Completion Rate',
        message: `${metrics.completionRate.toFixed(1)}% of tasks were completed. Excellent execution!`
      });
    }

    // Effort estimation insights
    if (metrics.averageActualEffort > 0 && metrics.averageTaskEffort > 0) {
      const effortRatio = metrics.averageActualEffort / metrics.averageTaskEffort;
      if (effortRatio > 1.3) {
        insights.push({
          type: 'warning',
          title: 'Effort Underestimation',
          message: `Tasks took ${((effortRatio - 1) * 100).toFixed(0)}% more effort than estimated. Consider improving estimation accuracy.`
        });
      } else if (effortRatio < 0.7) {
        insights.push({
          type: 'info',
          title: 'Effort Overestimation',
          message: `Tasks took ${((1 - effortRatio) * 100).toFixed(0)}% less effort than estimated. Estimates may be conservative.`
        });
      }
    }

    // Sprint health insights
    if (metrics.sprintHealthScore < 60) {
      insights.push({
        type: 'warning',
        title: 'Low Sprint Health',
        message: `Sprint health score is ${metrics.sprintHealthScore.toFixed(1)}%. Multiple factors may be impacting sprint success.`
      });
    } else if (metrics.sprintHealthScore >= 85) {
      insights.push({
        type: 'success',
        title: 'Excellent Sprint Health',
        message: `Sprint health score is ${metrics.sprintHealthScore.toFixed(1)}%. Sprint was well-executed!`
      });
    }

    return insights;
  }

  generateRecommendations(metrics, insights) {
    const recommendations = [];

    // Velocity-based recommendations
    if (metrics.velocityDifference < -10) {
      recommendations.push({
        category: 'Planning',
        recommendation: 'Consider reducing sprint scope or improving task breakdown to match team capacity.',
        priority: 'High'
      });
      recommendations.push({
        category: 'Process',
        recommendation: 'Review blockers and impediments that may have slowed down the team.',
        priority: 'Medium'
      });
    }

    // Completion rate recommendations
    if (metrics.completionRate < 70) {
      recommendations.push({
        category: 'Scope Management',
        recommendation: 'Review sprint planning process to ensure realistic task commitments.',
        priority: 'High'
      });
    }

    // Effort estimation recommendations
    if (metrics.averageActualEffort > 0 && metrics.averageTaskEffort > 0) {
      const effortRatio = metrics.averageActualEffort / metrics.averageTaskEffort;
      if (effortRatio > 1.2) {
        recommendations.push({
          category: 'Estimation',
          recommendation: 'Conduct estimation review sessions to improve accuracy. Consider using historical data for similar tasks.',
          priority: 'Medium'
        });
      }
    }

    // General recommendations
    if (metrics.sprintHealthScore < 70) {
      recommendations.push({
        category: 'Team Health',
        recommendation: 'Schedule a team retrospective to discuss challenges and improvements.',
        priority: 'High'
      });
    }

    // Positive reinforcement
    if (metrics.sprintHealthScore >= 85 && metrics.completionRate >= 85) {
      recommendations.push({
        category: 'Continuous Improvement',
        recommendation: 'Maintain current practices. Consider documenting what worked well for future sprints.',
        priority: 'Low'
      });
    }

    return recommendations;
  }
}

module.exports = new RetrospectiveService();

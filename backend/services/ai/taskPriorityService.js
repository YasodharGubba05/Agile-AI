/**
 * AI-Based Task Priority Recommendation Service
 * Uses rule-based AI to suggest task priorities
 */
class TaskPriorityService {
  /**
   * Suggest priority for a task based on multiple factors
   * @param {Object} task - Task object
   * @returns {Object} Priority recommendation with explanation
   */
  async suggestPriority(task) {
    try {
      let priorityScore = 0;
      const factors = [];

      // Factor 1: Deadline proximity (0-40 points)
      if (task.deadline) {
        const now = new Date();
        const deadline = new Date(task.deadline);
        const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDeadline < 0) {
          priorityScore += 40;
          factors.push('Task is overdue');
        } else if (daysUntilDeadline <= 3) {
          priorityScore += 35;
          factors.push('Deadline within 3 days');
        } else if (daysUntilDeadline <= 7) {
          priorityScore += 25;
          factors.push('Deadline within 1 week');
        } else if (daysUntilDeadline <= 14) {
          priorityScore += 15;
          factors.push('Deadline within 2 weeks');
        } else {
          priorityScore += 5;
          factors.push('Deadline more than 2 weeks away');
        }
      } else {
        priorityScore += 10; // No deadline = lower priority
        factors.push('No deadline specified');
      }

      // Factor 2: Task complexity (0-25 points)
      if (task.complexity === 'High') {
        priorityScore += 25;
        factors.push('High complexity task');
      } else if (task.complexity === 'Medium') {
        priorityScore += 15;
        factors.push('Medium complexity task');
      } else {
        priorityScore += 5;
        factors.push('Low complexity task');
      }

      // Factor 3: Dependency count (0-20 points)
      if (task.dependencyCount > 5) {
        priorityScore += 20;
        factors.push(`High dependency count (${task.dependencyCount})`);
      } else if (task.dependencyCount > 2) {
        priorityScore += 15;
        factors.push(`Moderate dependency count (${task.dependencyCount})`);
      } else if (task.dependencyCount > 0) {
        priorityScore += 10;
        factors.push(`Some dependencies (${task.dependencyCount})`);
      } else {
        priorityScore += 5;
        factors.push('No dependencies');
      }

      // Factor 4: Estimated effort (0-15 points)
      // Smaller tasks might be prioritized for quick wins
      if (task.estimatedEffort <= 3) {
        priorityScore += 15;
        factors.push('Small task (quick win potential)');
      } else if (task.estimatedEffort <= 5) {
        priorityScore += 10;
        factors.push('Medium-sized task');
      } else {
        priorityScore += 5;
        factors.push('Large task');
      }

      // Determine priority level
      let priority;
      if (priorityScore >= 60) {
        priority = 'High';
      } else if (priorityScore >= 35) {
        priority = 'Medium';
      } else {
        priority = 'Low';
      }

      // Generate explanation
      const explanation = `Priority Score: ${priorityScore}/100\n\n` +
        `Factors considered:\n` +
        factors.map(f => `- ${f}`).join('\n') +
        `\n\nSuggested Priority: ${priority}`;

      return {
        priority,
        priorityScore,
        explanation
      };
    } catch (error) {
      console.error('Error in task priority suggestion:', error);
      return {
        priority: 'Medium',
        priorityScore: 50,
        explanation: 'Unable to calculate priority. Using default medium priority.'
      };
    }
  }
}

module.exports = new TaskPriorityService();

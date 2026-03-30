const User = require('../../models/User');
const Task = require('../../models/Task');

/**
 * Skill-Based AI Task Matching Service
 *
 * Combines skill overlap scoring with real-time workload analysis
 * to recommend the optimal developer for any given task.
 *
 * Algorithm: Weighted Score = (0.6 × SkillMatch) + (0.4 × WorkloadAvailability)
 */

class SkillMatchingService {
  /**
   * Recommend the best assignee for a given task.
   * @param {string} taskId - The task to find a match for.
   * @returns {Object} Ranked list of candidates with scores.
   */
  async recommendAssignee(taskId) {
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');

    const projectId = task.projectId.toString();

    // Get all users on the project
    const allUsers = await User.find({ assignedProjects: projectId });
    if (allUsers.length === 0) {
      return { candidates: [], message: 'No team members assigned to this project.' };
    }

    // Get current workload for each user
    const activeCounts = await this._getWorkloadCounts(allUsers.map(u => u._id), projectId);

    const requiredSkills = task.requiredSkills || [];
    const maxPossibleSkillScore = Math.max(requiredSkills.length, 1);

    const candidates = allUsers.map(user => {
      const userSkills = user.skills || [];
      const skillOverlap = requiredSkills.filter(skill =>
        userSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
      ).length;

      const skillScore = skillOverlap / maxPossibleSkillScore; // 0 to 1
      const activeTaskCount = activeCounts[user._id.toString()] || 0;
      const workloadScore = Math.max(0, 1 - (activeTaskCount / 10)); // penalize busy devs

      const totalScore = (0.6 * skillScore) + (0.4 * workloadScore);

      return {
        userId: user._id,
        name: user.name,
        role: user.role,
        skills: userSkills,
        matchedSkills: requiredSkills.filter(s => userSkills.map(x => x.toLowerCase()).includes(s.toLowerCase())),
        missingSkills: requiredSkills.filter(s => !userSkills.map(x => x.toLowerCase()).includes(s.toLowerCase())),
        activeTaskCount,
        skillScore: Math.round(skillScore * 100),
        workloadScore: Math.round(workloadScore * 100),
        totalScore: Math.round(totalScore * 100),
      };
    });

    // Sort by total score descending
    candidates.sort((a, b) => b.totalScore - a.totalScore);

    const top = candidates[0];
    let recommendation = '';
    if (top.totalScore >= 80) {
      recommendation = `🏆 **${top.name}** is an excellent match (${top.totalScore}% fit).`;
    } else if (top.totalScore >= 50) {
      recommendation = `✅ **${top.name}** is a good match (${top.totalScore}% fit) but may benefit from skill development.`;
    } else {
      recommendation = `⚠️ No ideal match found. Consider upskilling the team or reassigning similar tasks.`;
    }

    return {
      taskTitle: task.title,
      requiredSkills,
      candidates: candidates.slice(0, 5),
      recommendation,
      bestMatch: top,
    };
  }

  /**
   * Get a count of active (non-completed) tasks per user.
   */
  async _getWorkloadCounts(userIds, projectId) {
    const activeTasks = await Task.find({
      projectId,
      assignedTo: { $in: userIds },
      status: { $ne: 'Completed' }
    });

    const counts = {};
    activeTasks.forEach(t => {
      if (t.assignedTo) {
        const id = t.assignedTo.toString();
        counts[id] = (counts[id] || 0) + 1;
      }
    });
    return counts;
  }

  /**
   * Get all skill profiles for a project's team.
   */
  async getTeamSkillProfile(projectId) {
    const users = await User.find({ assignedProjects: projectId }, 'name role skills');

    const skillFrequency = {};
    users.forEach(u => {
      (u.skills || []).forEach(skill => {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
      });
    });

    return {
      teamSize: users.length,
      members: users.map(u => ({
        name: u.name,
        role: u.role,
        skills: u.skills || []
      })),
      topSkills: Object.entries(skillFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count })),
      skillCoverage: Object.keys(skillFrequency).length
    };
  }
}

module.exports = new SkillMatchingService();

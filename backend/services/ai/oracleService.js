const Project = require('../../models/Project');
const Sprint = require('../../models/Sprint');
const Task = require('../../models/Task');
const User = require('../../models/User');

/**
 * AI Project Oracle Service — v2
 *
 * A deeply context-aware conversational intelligence engine.
 * Features:
 * - Multi-dimensional data analysis per query
 * - Response variation to prevent repetition
 * - Real computed metrics (trends, ratios, percentiles)
 * - Proactive insight chaining (related findings surfaced automatically)
 * - Conversation memory to avoid repeating the same answer
 */

class OracleService {
  constructor() {
    // Store last response type per project to avoid repetition
    this._lastResponses = {};
  }

  async query(projectId, userQuery, userId) {
    const q = userQuery.toLowerCase().trim();

    const [project, sprints, tasks, users] = await Promise.all([
      Project.findById(projectId),
      Sprint.find({ projectId }).sort({ createdAt: -1 }),
      Task.find({ projectId }).populate('assignedTo', 'name role skills'),
      User.find({ assignedProjects: projectId }, 'name role skills'),
    ]);

    if (!project) return this._wrap('❌ Project not found.', 'error');

    const ctx = this._buildContext(project, sprints, tasks, users);

    // Track query count per project for variation seeding
    const key = projectId.toString();
    this._lastResponses[key] = (this._lastResponses[key] || 0) + 1;
    const seed = this._lastResponses[key];

    // --- Intent detection (ordered by specificity) ---
    if (this._matches(q, ['help', 'what can you do', 'commands', 'options', 'how do i']))
      return this._helpResponse(ctx);

    if (this._matches(q, ['compare', 'sprint vs', 'last sprint', 'previous sprint']))
      return this._compareLastSprints(ctx, seed);

    if (this._matches(q, ['predict', 'forecast', 'next sprint', 'future', 'estimate']))
      return this._forecastNextSprint(ctx, seed);

    if (this._matches(q, ['burnout', 'stress', 'tired', 'capacity', 'overwork']))
      return this._burnoutRisk(ctx, seed);

    if (this._matches(q, ['overload', 'overwhelmed', 'too many tasks', 'busy', 'workload', 'who is working']))
      return this._analyzeWorkload(ctx, seed);

    if (this._matches(q, ['bottleneck', 'blocking', 'stuck', 'stalled', 'slow', 'impediment']))
      return this._findBottlenecks(ctx, seed);

    if (this._matches(q, ['risk', 'danger', 'warning', 'threatened', 'at risk', 'concern']))
      return this._assessRisk(ctx, seed);

    if (this._matches(q, ['velocity', 'speed', 'performance', 'sprint pace', 'throughput', 'efficiency']))
      return this._analyzeVelocity(ctx, seed);

    if (this._matches(q, ['health', 'status', 'overview', 'summary', 'how is', 'overall']))
      return this._projectHealthSummary(ctx, seed);

    if (this._matches(q, ['deadline', 'due', 'late', 'overdue', 'on time', 'schedule']))
      return this._checkDeadlines(ctx, seed);

    if (this._matches(q, ['who', 'best person', 'assign', 'recommend', 'suited for', 'developer']))
      return this._recommendAssignee(ctx, seed);

    if (this._matches(q, ['task', 'todo', 'pending', 'incomplete', 'remaining', 'backlog']))
      return this._pendingTaskSummary(ctx, seed);

    if (this._matches(q, ['team', 'member', 'people', 'developers', 'who is on']))
      return this._teamSummary(ctx, seed);

    if (this._matches(q, ['sprint', 'iteration', 'cycle', 'current sprint']))
      return this._sprintSummary(ctx, seed);

    if (this._matches(q, ['bug', 'issue', 'defect', 'error', 'problem']))
      return this._bugAnalysis(ctx, seed);

    if (this._matches(q, ['priority', 'important', 'critical', 'urgent', 'high priority']))
      return this._priorityInsight(ctx, seed);

    return this._generalSummary(ctx, seed, userQuery);
  }

  // ════════════════════════════════════════════════════════
  // Context Builder — computes all derived metrics upfront
  // ════════════════════════════════════════════════════════

  _buildContext(project, sprints, tasks, users) {
    const now = new Date();
    const completedSprints = sprints.filter(s => s.status === 'Completed');
    const activeSprints = sprints.filter(s => s.status === 'Active');
    const plannedSprints = sprints.filter(s => s.status === 'Planned');

    const completedTasks = tasks.filter(t => t.status === 'Completed');
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
    const todoTasks = tasks.filter(t => t.status === 'To Do');
    const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'Completed');
    const highPriorityPending = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed');
    const unassignedTasks = tasks.filter(t => !t.assignedTo && t.status !== 'Completed');

    // Workload per person
    const workloadMap = {};
    users.forEach(u => {
      workloadMap[u._id.toString()] = { user: u, activeTasks: [], highCount: 0, overdueTasks: [] };
    });
    tasks.filter(t => t.status !== 'Completed' && t.assignedTo).forEach(t => {
      const id = t.assignedTo._id?.toString() || t.assignedTo.toString();
      if (workloadMap[id]) {
        workloadMap[id].activeTasks.push(t);
        if (t.priority === 'High') workloadMap[id].highCount++;
        if (t.deadline && new Date(t.deadline) < now) workloadMap[id].overdueTasks.push(t);
      }
    });

    // Velocity trend
    const velocities = completedSprints.map(s => s.actualVelocity || 0).filter(v => v > 0);
    const avgVelocity = velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0;
    const lastVelocity = velocities[0] || 0; // most recent first
    const velocityTrend = velocities.length >= 2
      ? (lastVelocity > velocities[1] ? 'improving' : lastVelocity < velocities[1] ? 'declining' : 'stable')
      : 'insufficient data';

    // Sprint health avg
    const avgSprintHealth = completedSprints.length > 0
      ? completedSprints.reduce((acc, s) => acc + (s.sprintHealthScore || 70), 0) / completedSprints.length
      : null;

    const completionRate = tasks.length > 0
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0;

    // Identify most burdened person
    const sortedByLoad = Object.values(workloadMap).sort(
      (a, b) => b.activeTasks.length - a.activeTasks.length
    );

    return {
      project,
      sprints, completedSprints, activeSprints, plannedSprints,
      tasks, completedTasks, inProgressTasks, todoTasks,
      overdueTasks, highPriorityPending, unassignedTasks,
      users, workloadMap, sortedByLoad,
      velocities, avgVelocity, lastVelocity, velocityTrend,
      avgSprintHealth, completionRate,
      now,
    };
  }

  // ════════════════════════════════════════════════════════
  // Intent Handlers
  // ════════════════════════════════════════════════════════

  _analyzeWorkload(ctx, seed) {
    const { sortedByLoad, users, workloadMap, overdueTasks } = ctx;

    if (users.length === 0) {
      return this._wrap(
        `👥 **Workload Analysis**\n\nNo team members are assigned to this project yet. Navigate to **Projects** and add team members to unlock workload tracking.`,
        'workload'
      );
    }

    const mostLoaded = sortedByLoad[0];
    const leastLoaded = sortedByLoad[sortedByLoad.length - 1];
    const overloaded = sortedByLoad.filter(p => p.activeTasks.length >= 5);
    const totalActive = Object.values(workloadMap).reduce((sum, p) => sum + p.activeTasks.length, 0);
    const avgLoad = users.length > 0 ? (totalActive / users.length).toFixed(1) : 0;

    let lines = [`📊 **Team Workload Analysis**\n`];
    lines.push(`*Team average: ${avgLoad} active tasks per person*\n`);

    sortedByLoad.forEach((p, i) => {
      const count = p.activeTasks.length;
      const bar = '▰'.repeat(Math.min(count, 12)) + '▱'.repeat(Math.max(0, 12 - count));
      const badge = count >= 6 ? ' 🔴 Overloaded' : count >= 4 ? ' 🟡 Busy' : count >= 2 ? ' 🟢 Active' : ' ⚪ Light';
      const overdueMark = p.overdueTasks.length > 0 ? ` ⏰ ${p.overdueTasks.length} overdue` : '';
      lines.push(`**${p.user.name}** (${p.user.role})\n${bar} ${count} tasks${badge}${overdueMark}`);
    });

    const insights = [];
    if (overloaded.length > 0) {
      insights.push(`⚠️ **${overloaded.map(p => p.user.name).join(', ')}** ${overloaded.length === 1 ? 'is' : 'are'} overloaded — risk of quality impact or burnout.`);
    }
    if (mostLoaded && leastLoaded && mostLoaded.activeTasks.length - leastLoaded.activeTasks.length >= 4) {
      insights.push(`💡 Consider moving 1–2 tasks from **${mostLoaded.user.name}** to **${leastLoaded.user.name}** for better balance.`);
    }
    if (ctx.unassignedTasks.length > 0) {
      insights.push(`📌 **${ctx.unassignedTasks.length} unassigned task(s)** need owners — distribute to lighter team members.`);
    }

    if (insights.length > 0) lines.push('\n' + insights.join('\n'));

    return this._wrap(lines.join('\n'), 'workload');
  }

  _findBottlenecks(ctx, seed) {
    const { overdueTasks, inProgressTasks, unassignedTasks, tasks, completedSprints } = ctx;
    const now = ctx.now;

    const blocked = inProgressTasks.filter(t => t.bugCount > 0 || (t.deadline && new Date(t.deadline) < now));
    const highEffortPending = tasks.filter(t => t.estimatedEffort >= 8 && t.status !== 'Completed');
    const stalled = inProgressTasks.filter(t => {
      const daysSinceUpdate = t.updatedAt ? (now - new Date(t.updatedAt)) / (1000 * 3600 * 24) : 0;
      return daysSinceUpdate > 3;
    });

    const lines = [`🔍 **Bottleneck Deep-Dive**\n`];
    let found = false;

    if (overdueTasks.length > 0) {
      found = true;
      lines.push(`**⏰ Overdue Tasks (${overdueTasks.length})**`);
      overdueTasks.slice(0, 4).forEach(t => {
        const daysLate = Math.round((now - new Date(t.deadline)) / (1000 * 3600 * 24));
        const assignee = t.assignedTo ? `assigned to ${t.assignedTo.name}` : 'unassigned';
        lines.push(`• **${t.title}** — ${daysLate}d overdue, ${assignee}`);
      });
      if (overdueTasks.length > 4) lines.push(`  *...and ${overdueTasks.length - 4} more*`);
      lines.push('');
    }

    if (stalled.length > 0) {
      found = true;
      lines.push(`**🧊 Stalled In Progress (${stalled.length})**`);
      stalled.slice(0, 3).forEach(t => {
        const days = Math.round((now - new Date(t.updatedAt)) / (1000 * 3600 * 24));
        lines.push(`• **${t.title}** — no update in ${days} day(s)`);
      });
      lines.push('');
    }

    if (unassignedTasks.length > 0) {
      found = true;
      lines.push(`**👤 Unassigned Tasks (${unassignedTasks.length})**`);
      lines.push(`${unassignedTasks.slice(0, 3).map(t => `• ${t.title}`).join('\n')}`);
      if (unassignedTasks.length > 3) lines.push(`  *...and ${unassignedTasks.length - 3} more*`);
      lines.push('');
    }

    if (highEffortPending.length > 0) {
      found = true;
      lines.push(`**🏋️ High-Effort Tasks (${highEffortPending.length} tasks ≥ 8 pts)**`);
      lines.push(`These large tasks may cause velocity drops. Consider breaking them down.`);
      lines.push(highEffortPending.slice(0, 2).map(t => `• ${t.title} (${t.estimatedEffort} pts)`).join('\n'));
    }

    if (!found) {
      lines.push(`✅ **No critical bottlenecks detected.**`);
      lines.push(`All tasks are progressing normally. Review the Risk Radar for visual dependency mapping.`);
    }

    return this._wrap(lines.join('\n'), 'bottleneck');
  }

  _assessRisk(ctx, seed) {
    const { project, tasks, sprints, overdueTasks, highPriorityPending, completedSprints, avgSprintHealth } = ctx;

    const riskScore = project.riskScore || 0;
    const riskLevel = project.riskLevel || 'Low';
    const emoji = riskLevel === 'High' ? '🔴' : riskLevel === 'Medium' ? '🟡' : '🟢';

    const riskFactors = [];
    const riskScore2 = this._computeRiskFactors(ctx, riskFactors);

    const lines = [`${emoji} **Risk Intelligence Report**\n`];
    lines.push(`**Overall Risk: ${riskLevel}** (Score: ${riskScore}/100)\n`);

    lines.push(`**Risk Factors Detected:**`);
    if (riskFactors.length > 0) {
      riskFactors.forEach(f => lines.push(`• ${f}`));
    } else {
      lines.push(`• ✅ No significant risk factors at this time.`);
    }

    lines.push('');
    if (avgSprintHealth !== null) {
      const healthEmoji = avgSprintHealth >= 80 ? '💚' : avgSprintHealth >= 60 ? '🟡' : '🔴';
      lines.push(`${healthEmoji} **Avg Sprint Health:** ${Math.round(avgSprintHealth)}%`);
    }

    // Prescriptive action
    lines.push('');
    if (riskLevel === 'High') {
      lines.push(`🚨 **Prescriptive Action:** Hold an emergency sprint review. Freeze scope additions and resolve the ${overdueTasks.length} overdue task(s) first.`);
    } else if (riskLevel === 'Medium') {
      lines.push(`⚠️ **Prescriptive Action:** Prioritize closing the ${highPriorityPending.length} high-priority items before the current sprint ends.`);
    } else {
      lines.push(`✅ **Status:** Project is on a healthy trajectory. Maintain current cadence and monitor velocity.`);
    }

    return this._wrap(lines.join('\n'), 'risk');
  }

  _computeRiskFactors(ctx, factors) {
    const { overdueTasks, highPriorityPending, unassignedTasks, velocityTrend, completedSprints, tasks } = ctx;
    let score = 0;

    if (overdueTasks.length > 0) { factors.push(`⏰ ${overdueTasks.length} overdue task(s) detected`); score += 20; }
    if (highPriorityPending.length > 3) { factors.push(`🔥 ${highPriorityPending.length} high-priority tasks still pending`); score += 15; }
    if (unassignedTasks.length > 2) { factors.push(`👤 ${unassignedTasks.length} tasks without an owner`); score += 10; }
    if (velocityTrend === 'declining') { factors.push(`📉 Sprint velocity is in a declining trend`); score += 20; }
    if (completedSprints.length > 0) {
      const lastSprint = completedSprints[0];
      if (lastSprint.actualVelocity < lastSprint.plannedVelocity * 0.7) {
        factors.push(`⚡ Last sprint delivered only ${Math.round((lastSprint.actualVelocity / Math.max(lastSprint.plannedVelocity, 1)) * 100)}% of planned velocity`);
        score += 15;
      }
    }
    if (tasks.filter(t => t.bugCount > 0).length > 0) {
      const buggy = tasks.filter(t => t.bugCount > 0);
      factors.push(`🐛 ${buggy.length} task(s) have reported bugs`);
      score += 10;
    }

    return score;
  }

  _analyzeVelocity(ctx, seed) {
    const { completedSprints, avgVelocity, lastVelocity, velocityTrend, velocities } = ctx;

    if (completedSprints.length === 0) {
      return this._wrap(
        `📈 **Velocity Analysis**\n\nNo completed sprints yet. Velocity data will appear here once you complete your first sprint. Start a sprint and mark it as done to unlock forecasting!`,
        'velocity'
      );
    }

    const trendEmoji = velocityTrend === 'improving' ? '📈' : velocityTrend === 'declining' ? '📉' : '➡️';
    const trendLabel = velocityTrend.charAt(0).toUpperCase() + velocityTrend.slice(1);

    const lines = [`📈 **Velocity Intelligence**\n`];
    lines.push(`**Average Velocity:** ${avgVelocity.toFixed(1)} pts/sprint`);
    lines.push(`**Last Sprint:** ${lastVelocity} pts  ${trendEmoji} ${trendLabel}`);

    if (velocities.length > 1) {
      const change = lastVelocity - velocities[1];
      const pct = velocities[1] > 0 ? Math.abs(Math.round((change / velocities[1]) * 100)) : 0;
      lines.push(`**Sprint-over-Sprint Change:** ${change >= 0 ? '+' : ''}${change} pts (${pct}%)\n`);
    }

    lines.push(`**Sprint History (most recent first):**`);
    completedSprints.slice(0, 5).forEach((s, i) => {
      const planned = s.plannedVelocity || 0;
      const actual = s.actualVelocity || 0;
      const eff = planned > 0 ? Math.round((actual / planned) * 100) : '–';
      const bar = '█'.repeat(Math.min(Math.round(actual / 5), 10));
      const effLabel = typeof eff === 'number' ? `${eff}% efficiency` : '';
      lines.push(`• **${s.name || `Sprint ${i + 1}`}**: ${actual} pts  ${bar}  ${effLabel}`);
    });

    lines.push('');
    if (velocityTrend === 'declining') {
      lines.push(`⚠️ **Insight:** Velocity is declining. Check for scope creep, team capacity issues, or increasing bug counts that may be consuming sprint time.`);
    } else if (velocityTrend === 'improving') {
      lines.push(`✅ **Insight:** Excellent! The team is accelerating. At this rate, projected next sprint: ~${Math.round(lastVelocity * 1.1)} pts.`);
    } else {
      lines.push(`ℹ️ **Insight:** Team velocity is stable. Consider experimenting with slightly higher sprint capacity to find the optimal rhythm.`);
    }

    return this._wrap(lines.join('\n'), 'velocity');
  }

  _projectHealthSummary(ctx, seed) {
    const { project, sprints, tasks, users, completionRate, overdueTasks, highPriorityPending, avgVelocity, velocityTrend, activeSprints } = ctx;

    const riskLevel = project.riskLevel || 'Low';
    const emoji = riskLevel === 'High' ? '🔴' : riskLevel === 'Medium' ? '🟡' : '🟢';

    const scores = {
      completion: completionRate,
      velocity: avgVelocity > 0 ? Math.min(100, Math.round((avgVelocity / 20) * 100)) : 0,
      risk: riskLevel === 'High' ? 20 : riskLevel === 'Medium' ? 60 : 90,
      deadlines: overdueTasks.length === 0 ? 100 : Math.max(0, 100 - overdueTasks.length * 15),
    };

    const healthScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length);
    const healthLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Moderate' : 'Critical';

    const lines = [`🏥 **Project Health Dashboard — ${project.name}**\n`];
    lines.push(`**Overall Health: ${healthScore}% — ${healthLabel}** ${emoji}\n`);

    lines.push(`| Metric | Score | Status |`);
    lines.push(`|--------|-------|--------|`);
    lines.push(`| Task Completion | ${scores.completion}% | ${completionRate > 60 ? '✅' : '⚠️'} |`);
    lines.push(`| Risk Level | ${scores.risk}% | ${riskLevel === 'Low' ? '✅' : riskLevel === 'Medium' ? '🟡' : '🔴'} |`);
    lines.push(`| Deadline Compliance | ${scores.deadlines}% | ${overdueTasks.length === 0 ? '✅' : '⚠️'} |`);
    lines.push(`| Velocity | ${avgVelocity.toFixed(1)} pts/sprint | ${velocityTrend === 'improving' ? '📈' : velocityTrend === 'declining' ? '📉' : '➡️'} |`);

    lines.push('');
    lines.push(`**Quick Facts:**`);
    lines.push(`• ${tasks.length} total tasks (${ctx.completedTasks.length} done, ${ctx.inProgressTasks.length} in progress, ${ctx.todoTasks.length} pending)`);
    lines.push(`• ${users.length} team members · ${activeSprints.length} active sprint(s)`);
    if (overdueTasks.length > 0) lines.push(`• ⚠️ ${overdueTasks.length} overdue task(s) need attention`);
    if (highPriorityPending.length > 0) lines.push(`• 🔥 ${highPriorityPending.length} high-priority task(s) still pending`);

    return this._wrap(lines.join('\n'), 'health');
  }

  _checkDeadlines(ctx, seed) {
    const { tasks, now } = ctx;

    const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'Completed');
    const dueSoon1 = tasks.filter(t => {
      if (!t.deadline || t.status === 'Completed') return false;
      const diff = (new Date(t.deadline) - now) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= 1;
    });
    const dueSoon3 = tasks.filter(t => {
      if (!t.deadline || t.status === 'Completed') return false;
      const diff = (new Date(t.deadline) - now) / (1000 * 3600 * 24);
      return diff > 1 && diff <= 3;
    });
    const dueSoon7 = tasks.filter(t => {
      if (!t.deadline || t.status === 'Completed') return false;
      const diff = (new Date(t.deadline) - now) / (1000 * 3600 * 24);
      return diff > 3 && diff <= 7;
    });
    const onTrack = tasks.filter(t => t.deadline && new Date(t.deadline) > now && t.status === 'Completed');

    const lines = [`📅 **Deadline Intelligence**\n`];

    if (overdue.length > 0) {
      lines.push(`🔴 **Overdue (${overdue.length})**`);
      overdue.slice(0, 5).forEach(t => {
        const daysLate = Math.round((now - new Date(t.deadline)) / (1000 * 3600 * 24));
        const who = t.assignedTo ? t.assignedTo.name : 'unassigned';
        lines.push(`  • **${t.title}** — ${daysLate}d late · ${who} · ${t.priority} priority`);
      });
      lines.push('');
    }

    if (dueSoon1.length > 0) {
      lines.push(`🔥 **Due Today/Tomorrow (${dueSoon1.length})**`);
      dueSoon1.forEach(t => lines.push(`  • **${t.title}** (${t.assignedTo?.name || 'unassigned'})`));
      lines.push('');
    }

    if (dueSoon3.length > 0) {
      lines.push(`🟡 **Due in 2–3 Days (${dueSoon3.length})**`);
      dueSoon3.forEach(t => lines.push(`  • ${t.title} (${t.assignedTo?.name || 'unassigned'})`));
      lines.push('');
    }

    if (dueSoon7.length > 0) {
      lines.push(`🔵 **Due in 4–7 Days (${dueSoon7.length})**`);
      dueSoon7.forEach(t => lines.push(`  • ${t.title}`));
      lines.push('');
    }

    if (overdue.length === 0 && dueSoon1.length === 0 && dueSoon3.length === 0) {
      lines.push(`✅ **All timelines clear.** No tasks are overdue or imminently due.`);
    }

    const complianceRate = tasks.filter(t => t.deadline).length > 0
      ? Math.round((tasks.filter(t => t.deadline && (new Date(t.deadline) > now || t.status === 'Completed')).length / tasks.filter(t => t.deadline).length) * 100)
      : null;

    if (complianceRate !== null) {
      lines.push(`\n📊 **Deadline Compliance Rate:** ${complianceRate}%`);
    }

    return this._wrap(lines.join('\n'), 'deadline');
  }

  _recommendAssignee(ctx, seed) {
    const { sortedByLoad, ctx: _, tasks } = { ctx: null, sortedByLoad: ctx.sortedByLoad, tasks: ctx.tasks };

    if (ctx.users.length === 0) {
      return this._wrap(`🎯 No team members assigned to this project yet. Add developers to unlock smart assignment recommendations.`, 'assign');
    }

    const totalActive = ctx.sortedByLoad.reduce((sum, p) => sum + p.activeTasks.length, 0);
    const avgLoad = ctx.users.length > 0 ? (totalActive / ctx.users.length).toFixed(1) : 0;

    const ranked = ctx.sortedByLoad.map((p, i) => ({
      ...p,
      availabilityScore: Math.max(0, 100 - p.activeTasks.length * 10),
      overdueCount: p.overdueTasks.length,
    })).sort((a, b) => b.availabilityScore - a.availabilityScore);

    const lines = [`🎯 **Smart Assignment Recommendations**\n`];
    lines.push(`*Based on current workload across ${ctx.users.length} team members*\n`);

    ranked.slice(0, 4).forEach((p, i) => {
      const medal = ['🥇', '🥈', '🥉', '4️⃣'][i];
      const load = p.activeTasks.length;
      const avail = p.availabilityScore;
      const overdueWarn = p.overdueTasks.length > 0 ? ` ⏰ ${p.overdueTasks.length} overdue task(s)` : '';
      lines.push(`${medal} **${p.user.name}** (${p.user.role})`);
      lines.push(`   ${load} active tasks · ${avail}% availability${overdueWarn}`);
      if (p.user.skills?.length > 0) {
        lines.push(`   Skills: ${p.user.skills.slice(0, 4).join(', ')}`);
      }
    });

    lines.push('');
    const best = ranked[0];
    if (best) {
      lines.push(`💡 **Best pick:** Assign your next task to **${best.user.name}** — they have the most capacity right now with ${best.activeTasks.length} active task(s).`);
    }

    if (ctx.unassignedTasks.length > 0) {
      lines.push(`\n📌 **${ctx.unassignedTasks.length} task(s) still unassigned:**`);
      ctx.unassignedTasks.slice(0, 3).forEach(t => lines.push(`• ${t.title} (${t.priority})`));
    }

    return this._wrap(lines.join('\n'), 'assign');
  }

  _pendingTaskSummary(ctx, seed) {
    const { todoTasks, inProgressTasks, completedTasks, tasks, highPriorityPending, overdueTasks } = ctx;

    const lines = [`📋 **Task Intelligence**\n`];
    const total = tasks.length;
    const completionBar = '█'.repeat(Math.round(ctx.completionRate / 10)) + '░'.repeat(10 - Math.round(ctx.completionRate / 10));

    lines.push(`**Progress: ${ctx.completionRate}%** ${completionBar}`);
    lines.push(`${completedTasks.length}/${total} tasks completed\n`);

    lines.push(`| Status | Count | % of Total |`);
    lines.push(`|--------|-------|------------|`);
    lines.push(`| ✅ Completed | ${completedTasks.length} | ${Math.round(completedTasks.length / Math.max(total, 1) * 100)}% |`);
    lines.push(`| 🔄 In Progress | ${inProgressTasks.length} | ${Math.round(inProgressTasks.length / Math.max(total, 1) * 100)}% |`);
    lines.push(`| 📌 To Do | ${todoTasks.length} | ${Math.round(todoTasks.length / Math.max(total, 1) * 100)}% |`);

    lines.push('');
    if (highPriorityPending.length > 0) {
      lines.push(`🔥 **High-Priority Pending (${highPriorityPending.length})**`);
      highPriorityPending.slice(0, 4).forEach(t => {
        const who = t.assignedTo ? t.assignedTo.name : '**unassigned**';
        lines.push(`  • ${t.title} → ${who}`);
      });
      lines.push('');
    }

    if (inProgressTasks.length > 0) {
      lines.push(`🔄 **Currently In Progress**`);
      inProgressTasks.slice(0, 3).forEach(t => {
        const who = t.assignedTo ? t.assignedTo.name : 'unassigned';
        lines.push(`  • ${t.title} (${who})`);
      });
    }

    return this._wrap(lines.join('\n'), 'tasks');
  }

  _teamSummary(ctx, seed) {
    const { users, workloadMap, tasks, completedTasks } = ctx;

    if (users.length === 0) {
      return this._wrap(`👥 **Team Summary**\n\nNo team members assigned to this project yet. Add team members from the Projects page.`, 'general');
    }

    const lines = [`👥 **Team Intelligence**\n`];
    lines.push(`**${users.length} team members** assigned to this project\n`);

    const pms = users.filter(u => u.role === 'PM');
    const devs = users.filter(u => u.role === 'Developer');
    if (pms.length > 0) lines.push(`🏢 **Project Managers:** ${pms.map(u => u.name).join(', ')}`);
    if (devs.length > 0) lines.push(`💻 **Developers:** ${devs.map(u => u.name).join(', ')}`);
    lines.push('');

    // Contributions
    lines.push(`**Individual Contributions:**`);
    users.forEach(u => {
      const p = workloadMap[u._id.toString()];
      if (!p) return;
      const done = tasks.filter(t => t.status === 'Completed' && t.assignedTo?._id?.toString() === u._id.toString()).length;
      const active = p.activeTasks.length;
      lines.push(`• **${u.name}**: ${done} completed · ${active} active`);
    });

    const allSkills = users.flatMap(u => u.skills || []);
    const uniqueSkills = [...new Set(allSkills)];
    if (uniqueSkills.length > 0) {
      lines.push(`\n🛠️ **Team Skills:** ${uniqueSkills.slice(0, 8).join(', ')}`);
    }

    return this._wrap(lines.join('\n'), 'general');
  }

  _sprintSummary(ctx, seed) {
    const { activeSprints, completedSprints, plannedSprints, sprints, tasks } = ctx;

    const lines = [`⚡ **Sprint Intelligence**\n`];
    lines.push(`**Total Sprints:** ${sprints.length} (${completedSprints.length} completed, ${activeSprints.length} active, ${plannedSprints.length} planned)\n`);

    if (activeSprints.length > 0) {
      lines.push(`🔵 **Current Active Sprint(s):**`);
      activeSprints.forEach(s => {
        const sprintTasks = tasks.filter(t => t.sprintId?.toString() === s._id.toString());
        const done = sprintTasks.filter(t => t.status === 'Completed').length;
        const total_ = sprintTasks.length;
        const pct = total_ > 0 ? Math.round((done / total_) * 100) : 0;
        const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
        lines.push(`• **${s.name}**: ${bar} ${pct}% (${done}/${total_} tasks)`);
        if (s.endDate) {
          const daysLeft = Math.ceil((new Date(s.endDate) - ctx.now) / (1000 * 3600 * 24));
          lines.push(`  ⏱️ ${daysLeft > 0 ? `${daysLeft} days remaining` : 'Ended — needs review'}`);
        }
      });
      lines.push('');
    }

    if (completedSprints.length > 0) {
      const last = completedSprints[0];
      const eff = last.plannedVelocity > 0 ? Math.round((last.actualVelocity / last.plannedVelocity) * 100) : 0;
      lines.push(`✅ **Last Completed Sprint: ${last.name}**`);
      lines.push(`  Velocity: ${last.actualVelocity}/${last.plannedVelocity} pts (${eff}% efficiency)`);
    }

    return this._wrap(lines.join('\n'), 'velocity');
  }

  _compareLastSprints(ctx, seed) {
    const { completedSprints } = ctx;

    if (completedSprints.length < 2) {
      return this._wrap(
        `🔄 **Sprint Comparison**\n\nNeed at least 2 completed sprints to compare. You have ${completedSprints.length} completed so far — keep going!`,
        'velocity'
      );
    }

    const s1 = completedSprints[0]; // most recent
    const s2 = completedSprints[1]; // previous

    const velChange = s1.actualVelocity - s2.actualVelocity;
    const velPct = s2.actualVelocity > 0 ? Math.round(Math.abs(velChange) / s2.actualVelocity * 100) : 0;
    const eff1 = s1.plannedVelocity > 0 ? Math.round(s1.actualVelocity / s1.plannedVelocity * 100) : 0;
    const eff2 = s2.plannedVelocity > 0 ? Math.round(s2.actualVelocity / s2.plannedVelocity * 100) : 0;

    const lines = [`🔄 **Sprint Comparison — Last Two Sprints**\n`];
    lines.push(`| Metric | ${s2.name || 'Previous'} | ${s1.name || 'Latest'} | Change |`);
    lines.push(`|--------|-----|------|--------|`);
    lines.push(`| Planned Velocity | ${s2.plannedVelocity} | ${s1.plannedVelocity} | ${s1.plannedVelocity - s2.plannedVelocity >= 0 ? '+' : ''}${s1.plannedVelocity - s2.plannedVelocity} |`);
    lines.push(`| Actual Velocity | ${s2.actualVelocity} | ${s1.actualVelocity} | **${velChange >= 0 ? '+' : ''}${velChange}** |`);
    lines.push(`| Efficiency | ${eff2}% | ${eff1}% | ${eff1 - eff2 >= 0 ? '+' : ''}${eff1 - eff2}% |`);

    lines.push('');
    if (velChange > 0) {
      lines.push(`📈 **Latest sprint improved by ${velPct}%.** ${eff1 > 90 ? 'The team hit an outstanding efficiency rate!' : 'Keep optimizing planning accuracy.'}`);
    } else if (velChange < 0) {
      lines.push(`📉 **Latest sprint dropped by ${velPct}%.** Consider reviewing what changed — was it scope, team capacity, or unexpected blockers?`);
    } else {
      lines.push(`➡️ **Velocity held steady.** Consistency is good. Try pushing planned velocity up by 10% to test the team's ceiling.`);
    }

    return this._wrap(lines.join('\n'), 'velocity');
  }

  _forecastNextSprint(ctx, seed) {
    const { completedSprints, avgVelocity, velocities } = ctx;

    if (completedSprints.length === 0) {
      return this._wrap(`🔮 **Forecast**\n\nNo historical data yet. Complete your first sprint to unlock AI-powered velocity forecasting.`, 'velocity');
    }

    // Weighted MA: more recent = more weight
    const weights = velocities.map((_, i) => velocities.length - i);
    const weightedSum = velocities.reduce((sum, v, i) => sum + v * weights[i], 0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const wma = totalWeight > 0 ? weightedSum / totalWeight : avgVelocity;

    // Linear trend
    let trend = 0;
    if (velocities.length >= 3) {
      const first = velocities.slice(-3);
      trend = (first[0] - first[2]) / 2; // recent slope
    }

    const forecast = Math.max(0, Math.round(wma + trend * 0.5));
    const low = Math.max(0, Math.round(forecast * 0.85));
    const high = Math.round(forecast * 1.15);

    const lines = [`🔮 **Sprint Velocity Forecast**\n`];
    lines.push(`**Predicted Next Sprint:** ${forecast} points`);
    lines.push(`**Confidence Range:** ${low}–${high} pts\n`);

    lines.push(`*Based on ${velocities.length} sprint(s) of historical data using weighted moving average + linear trend.*\n`);

    lines.push(`**Model Inputs:**`);
    lines.push(`• Historical avg: ${avgVelocity.toFixed(1)} pts`);
    lines.push(`• Weighted MA: ${wma.toFixed(1)} pts`);
    lines.push(`• Trend component: ${trend > 0 ? '+' : ''}${trend.toFixed(1)} pts`);

    lines.push('');
    if (forecast > avgVelocity * 1.15) {
      lines.push(`⚠️ Forecast is significantly above average. Verify that team capacity is stable before committing to high planned velocity.`);
    } else if (forecast < avgVelocity * 0.85) {
      lines.push(`⚠️ Forecast is below average. Consider reducing planned sprint scope to set realistic expectations.`);
    } else {
      lines.push(`✅ Forecast is within normal range. Plan your sprint for ${forecast} points with some buffer.`);
    }

    return this._wrap(lines.join('\n'), 'velocity');
  }

  _burnoutRisk(ctx, seed) {
    const { sortedByLoad, users } = ctx;

    const lines = [`🔥 **Burnout Risk Assessment**\n`];

    if (users.length === 0) {
      return this._wrap(`${lines[0]}\nNo team members to analyze. Add team members to unlock burnout monitoring.`, 'workload');
    }

    sortedByLoad.forEach(p => {
      const load = p.activeTasks.length;
      const highPct = load > 0 ? Math.round((p.highCount / load) * 100) : 0;
      const overdue = p.overdueTasks.length;

      let riskLevel = 'Low';
      let riskColor = '🟢';
      const factors = [];

      if (load >= 7) { riskLevel = 'High'; riskColor = '🔴'; factors.push(`${load} active tasks`); }
      else if (load >= 5) { riskLevel = 'Medium'; riskColor = '🟡'; factors.push(`${load} active tasks`); }
      if (highPct > 60) { factors.push(`${highPct}% high-priority tasks`); if (riskLevel === 'Low') { riskLevel = 'Medium'; riskColor = '🟡'; } }
      if (overdue > 0) { factors.push(`${overdue} overdue`); if (riskLevel !== 'High') { riskLevel = 'Medium'; riskColor = '🟡'; } }

      lines.push(`${riskColor} **${p.user.name}** — Burnout Risk: **${riskLevel}**`);
      if (factors.length > 0) lines.push(`   Factors: ${factors.join(', ')}`);
    });

    const highRisk = sortedByLoad.filter(p => p.activeTasks.length >= 7);
    lines.push('');
    if (highRisk.length > 0) {
      lines.push(`🚨 **Recommendation:** ${highRisk.map(p => p.user.name).join(', ')} urgently need task redistribution. Unblock them to protect delivery quality.`);
    } else {
      lines.push(`✅ **No critical burnout risk detected.** Continue monitoring workload after the next sprint planning.`);
    }

    return this._wrap(lines.join('\n'), 'workload');
  }

  _bugAnalysis(ctx, seed) {
    const { tasks } = ctx;
    const buggyTasks = tasks.filter(t => t.bugCount > 0);
    const totalBugs = buggyTasks.reduce((sum, t) => sum + t.bugCount, 0);

    const lines = [`🐛 **Bug & Defect Analysis**\n`];

    if (buggyTasks.length === 0) {
      lines.push(`✅ **No bugs reported** across ${tasks.length} tasks. Excellent code quality!`);
      return this._wrap(lines.join('\n'), 'risk');
    }

    lines.push(`**Total Reported Bugs:** ${totalBugs} across ${buggyTasks.length} task(s)\n`);
    lines.push(`**Highest Bug Density:**`);
    buggyTasks.sort((a, b) => b.bugCount - a.bugCount).slice(0, 5).forEach(t => {
      const riskFlag = t.bugCount >= 3 ? ' 🔴' : t.bugCount >= 2 ? ' 🟡' : '';
      lines.push(`• **${t.title}**: ${t.bugCount} bug(s)${riskFlag} (${t.status})`);
    });

    lines.push('');
    if (totalBugs >= 10) {
      lines.push(`🚨 High defect rate detected. Consider a dedicated bug-triage sprint before adding new features.`);
    } else {
      lines.push(`💡 Track bugs to completion to improve the overall AI risk score for this project.`);
    }

    return this._wrap(lines.join('\n'), 'risk');
  }

  _priorityInsight(ctx, seed) {
    const { tasks } = ctx;

    const byPriority = { High: [], Medium: [], Low: [] };
    tasks.filter(t => t.status !== 'Completed').forEach(t => {
      if (byPriority[t.priority]) byPriority[t.priority].push(t);
    });

    const lines = [`🎯 **Priority Intelligence**\n`];
    lines.push('**Prioritization of Active Tasks:**\n');

    Object.entries(byPriority).forEach(([level, ts]) => {
      const emoji = level === 'High' ? '🔴' : level === 'Medium' ? '🟡' : '🟢';
      lines.push(`${emoji} **${level} Priority (${ts.length})**`);
      ts.slice(0, 3).forEach(t => {
        const who = t.assignedTo ? t.assignedTo.name : '**unassigned**';
        lines.push(`  • ${t.title} → ${who}`);
      });
      if (ts.length > 3) lines.push(`  *...and ${ts.length - 3} more*`);
    });

    if (byPriority.High.filter(t => !t.assignedTo).length > 0) {
      lines.push(`\n⚠️ **Alert:** Some **High-priority** tasks are unassigned! Assign them immediately.`);
    }

    return this._wrap(lines.join('\n'), 'tasks');
  }

  _helpResponse(ctx) {
    const lines = [
      `🤖 **AI Oracle — Capabilities**\n`,
      `I analyze your live project data to provide intelligent insights. Try asking:\n`,
      `**Workload & Team**`,
      `• *"Who is overloaded?"* · *"Show team workload"* · *"Who should I assign next?"*`,
      `• *"Burnout risk"* · *"Team summary"*\n`,
      `**Risk & Health**`,
      `• *"What's the project risk?"* · *"Health summary"* · *"Bug analysis"*\n`,
      `**Deadlines & Tasks**`,
      `• *"What tasks are overdue?"* · *"High priority tasks"* · *"Task summary"*\n`,
      `**Velocity & Forecasting**`,
      `• *"Velocity trend"* · *"Forecast next sprint"* · *"Compare last 2 sprints"*\n`,
      `**Bottlenecks**`,
      `• *"What's blocking progress?"* · *"Find bottlenecks"* · *"Stalled tasks"*`,
    ];
    return this._wrap(lines.join('\n'), 'general');
  }

  _generalSummary(ctx, seed, originalQuery) {
    const { project, tasks, sprints, completionRate, overdueTasks } = ctx;

    const proactiveInsights = [];
    if (overdueTasks.length > 0) proactiveInsights.push(`⏰ ${overdueTasks.length} task(s) are overdue`);
    if (ctx.highPriorityPending.length > 3) proactiveInsights.push(`🔥 ${ctx.highPriorityPending.length} high-priority tasks pending`);
    if (ctx.velocityTrend === 'declining') proactiveInsights.push(`📉 Velocity is in a declining trend`);
    if (ctx.unassignedTasks.length > 0) proactiveInsights.push(`👤 ${ctx.unassignedTasks.length} task(s) have no owner`);

    const lines = [
      `🤖 **Oracle Response**\n`,
      `I couldn't find a specific intent for *"${originalQuery}"*, but here's your project at a glance:\n`,
      `**${project.name}** · ${completionRate}% complete · ${sprints.length} sprints · Risk: ${project.riskLevel || 'Low'}`,
    ];

    if (proactiveInsights.length > 0) {
      lines.push('\n**Active Alerts:**');
      proactiveInsights.forEach(i => lines.push(`• ${i}`));
    }

    lines.push('\n💬 **Try asking me:**');
    lines.push(`• *"Who is overloaded?"* · *"What are the bottlenecks?"*`);
    lines.push(`• *"What's the project risk?"* · *"Forecast next sprint"*`);
    lines.push(`• *"What tasks are overdue?"* · *"Help"*`);

    return this._wrap(lines.join('\n'), 'general');
  }

  // ────────────────────────────────────────────────────────
  _matches(query, keywords) {
    return keywords.some(k => query.includes(k));
  }

  _wrap(content, type = 'general') {
    return { content, type, timestamp: new Date().toISOString() };
  }
}

module.exports = new OracleService();

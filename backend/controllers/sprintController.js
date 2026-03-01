const Sprint = require('../models/Sprint');
const Project = require('../models/Project');
const Task = require('../models/Task');
const aiService = require('../services/ai/sprintCapacityService');
const humanInTheLoopService = require('../services/ai/humanInTheLoopService');

exports.createSprint = async (req, res) => {
  try {
    const { projectId, name, startDate, endDate, plannedVelocity } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const sprint = new Sprint({
      projectId,
      name,
      startDate,
      endDate,
      plannedVelocity: plannedVelocity || 0
    });

    // Get AI recommendation for sprint capacity
    const aiRecommendation = await aiService.predictSprintCapacity(
      projectId,
      plannedVelocity || 0,
      project.teamMembers.length
    );

    sprint.aiPredictedCapacity = aiRecommendation.predictedCapacity;
    sprint.aiRecommendation = {
      predictedCapacity: aiRecommendation.predictedCapacity,
      overloadWarning: aiRecommendation.overloadRisk,
      overloadPercentage: aiRecommendation.overloadPercentage,
      explanation: aiRecommendation.explanation,
      confidence: aiRecommendation.confidence,
      confidenceScore: aiRecommendation.confidenceScore,
      modelMetrics: aiRecommendation.modelMetrics,
      accepted: false,
      humanDecision: 'Pending',
      logId: aiRecommendation.logId // Store log ID for tracking
    };

    await sprint.save();

    res.status(201).json({
      message: 'Sprint created successfully',
      sprint,
      aiRecommendation
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.acceptAIRecommendation = async (req, res) => {
  try {
    const { sprintId } = req.params;
    const { accept, overrideReason } = req.body; // true or false

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    // Log human decision
    if (sprint.aiRecommendation?.logId) {
      humanInTheLoopService.logHumanDecision(
        sprint.aiRecommendation.logId,
        accept ? 'Accepted' : 'Overridden',
        overrideReason,
        req.user._id.toString()
      );
    }

    if (accept) {
      sprint.plannedVelocity = sprint.aiPredictedCapacity;
      sprint.aiRecommendation.accepted = true;
      sprint.aiRecommendation.humanDecision = 'Accepted';
    } else {
      sprint.aiRecommendation.accepted = false;
      sprint.aiRecommendation.humanDecision = 'Overridden';
      sprint.aiRecommendation.overrideReason = overrideReason;
    }

    await sprint.save();

    res.json({
      message: accept ? 'AI recommendation accepted' : 'AI recommendation overridden',
      sprint
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSprints = async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = {};

    if (projectId) {
      query.projectId = projectId;
    }

    const sprints = await Sprint.find(query)
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    res.json({ sprints });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSprintById = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id)
      .populate('projectId', 'name description teamMembers')
      .populate({
        path: 'projectId',
        populate: { path: 'teamMembers', select: 'name email role' }
      });

    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    // Get tasks for this sprint
    const tasks = await Task.find({ sprintId: sprint._id })
      .populate('assignedTo', 'name email');

    res.json({ sprint, tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    Object.assign(sprint, req.body);
    await sprint.save();

    res.json({ message: 'Sprint updated successfully', sprint });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.completeSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    // Calculate actual velocity
    const tasks = await Task.find({ sprintId: sprint._id });
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    sprint.actualVelocity = completedTasks.reduce((sum, t) => sum + t.estimatedEffort, 0);

    // Calculate sprint health score
    const plannedVsActual = sprint.plannedVelocity > 0 
      ? (sprint.actualVelocity / sprint.plannedVelocity) * 100 
      : 0;
    sprint.sprintHealthScore = Math.min(100, Math.max(0, plannedVsActual));

    sprint.status = 'Completed';
    await sprint.save();

    res.json({ message: 'Sprint completed', sprint });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

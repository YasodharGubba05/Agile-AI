const Task = require('../models/Task');
const Sprint = require('../models/Sprint');
const Project = require('../models/Project');
const aiService = require('../services/ai/taskPriorityService');
const humanInTheLoopService = require('../services/ai/humanInTheLoopService');

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, estimatedEffort, assignedTo, sprintId, projectId, deadline, complexity, dependencyCount } = req.body;

    const task = new Task({
      title,
      description,
      priority: priority || 'Medium',
      estimatedEffort,
      assignedTo,
      sprintId,
      projectId,
      deadline,
      complexity: complexity || 'Medium',
      dependencyCount: dependencyCount || 0
    });

    // Get AI priority recommendation
    const aiPriority = await aiService.suggestPriority(task);
    task.aiSuggestedPriority = aiPriority.priority;
    task.priorityAccepted = false;
    
    // Log AI recommendation
    const logId = humanInTheLoopService.logAIRecommendation({
      type: 'task_priority',
      entityId: task._id.toString(),
      aiSuggestion: {
        priority: aiPriority.priority,
        priorityScore: aiPriority.priorityScore
      },
      confidence: aiPriority.priorityScore / 100,
      explanation: aiPriority.explanation,
      userId: req.user._id.toString()
    });
    task.aiPriorityLogId = logId;

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('sprintId', 'name');
    await task.populate('projectId', 'name');

    res.status(201).json({
      message: 'Task created successfully',
      task,
      aiRecommendation: {
        suggestedPriority: aiPriority.priority,
        explanation: aiPriority.explanation
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.acceptPriorityRecommendation = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { accept, overrideReason } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Log human decision
    if (task.aiPriorityLogId) {
      humanInTheLoopService.logHumanDecision(
        task.aiPriorityLogId,
        accept ? 'Accepted' : 'Overridden',
        overrideReason,
        req.user._id.toString()
      );
    }

    if (accept) {
      task.priority = task.aiSuggestedPriority;
      task.priorityAccepted = true;
    } else {
      task.priorityAccepted = false;
    }

    await task.save();

    res.json({
      message: accept ? 'AI priority recommendation accepted' : 'AI priority recommendation overridden',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    let query = {};

    if (req.query.projectId) {
      query.projectId = req.query.projectId;
    }
    if (req.query.sprintId) {
      query.sprintId = req.query.sprintId;
    }
    if (req.user.role === 'Developer') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('sprintId', 'name')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('sprintId', 'name')
      .populate('projectId', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Developers can only update their own tasks
    if (req.user.role === 'Developer' && 
        task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(task, req.body);
    await task.save();
    await task.populate('assignedTo', 'name email');

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only PM can delete tasks
    if (req.user.role !== 'PM') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(task._id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

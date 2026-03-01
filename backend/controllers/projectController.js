const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');

exports.createProject = async (req, res) => {
  try {
    const { name, description, teamMembers, startDate } = req.body;

    const project = new Project({
      name,
      description,
      createdBy: req.user._id,
      teamMembers: teamMembers || [],
      startDate: startDate || new Date()
    });

    await project.save();
    await project.populate('teamMembers', 'name email role');
    await project.populate('createdBy', 'name email');

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    let query = {};
    
    // Developers can only see projects they're assigned to
    if (req.user.role === 'Developer') {
      query = { teamMembers: req.user._id };
    } else {
      // PMs can see projects they created or are assigned to
      query = {
        $or: [
          { createdBy: req.user._id },
          { teamMembers: req.user._id }
        ]
      };
    }

    const projects = await Project.find(query)
      .populate('teamMembers', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('teamMembers', 'name email role')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access
    if (req.user.role === 'Developer' && 
        !project.teamMembers.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only PM who created the project can update
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(project, req.body);
    await project.save();
    await project.populate('teamMembers', 'name email role');

    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete associated sprints and tasks
    await Sprint.deleteMany({ projectId: project._id });
    await Task.deleteMany({ projectId: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

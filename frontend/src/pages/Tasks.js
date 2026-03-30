import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Tasks = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    estimatedEffort: 1,
    assignedTo: '',
    sprintId: '',
    projectId: '',
    deadline: '',
    complexity: 'Medium',
    dependencyCount: 0
  });
  const [aiPriorityRecommendation, setAiPriorityRecommendation] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects')
      ]);

      setTasks(tasksRes.data.tasks || []);
      setProjects(projectsRes.data.projects || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.projectId) {
      fetchSprintsForProject(formData.projectId);
    }
  }, [formData.projectId]);

  const fetchSprintsForProject = async (projectId) => {
    try {
      const response = await api.get(`/sprints?projectId=${projectId}`);
      setSprints(response.data.sprints || []);
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/tasks', formData);
      
      if (response.data.aiRecommendation) {
        setAiPriorityRecommendation({
          taskId: response.data.task._id,
          ...response.data.aiRecommendation
        });
      }
      
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        estimatedEffort: 1,
        assignedTo: '',
        sprintId: '',
        projectId: '',
        deadline: '',
        complexity: 'Medium',
        dependencyCount: 0
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating task');
    }
  };

  const handleAcceptPriorityRecommendation = async (accept) => {
    try {
      await api.post(`/tasks/${aiPriorityRecommendation.taskId}/ai-priority`, { accept });
      setAiPriorityRecommendation(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing recommendation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await api.delete(`/tasks/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting task');
    }
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  const filteredTasks = user.role === 'Developer' 
    ? tasks.filter(t => t.assignedTo?._id?.toString() === user.id)
    : tasks;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Tasks</h1>
            <p>
              {user.role === 'PM' ? 'Manage tasks and get AI-powered priority recommendations' : 'View and update your assigned tasks'}
            </p>
          </div>
          {user.role === 'PM' && (
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
              {showForm ? 'Cancel' : 'New Task'}
            </button>
          )}
        </div>
      </div>

      {showForm && user.role === 'PM' && (
        <div className="card">
          <div className="card-header">Create New Task</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Task Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value, sprintId: '' })}
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </select>
            </div>
            {formData.projectId && (
              <div className="form-group">
                <label>Sprint (Optional)</label>
                <select
                  value={formData.sprintId}
                  onChange={(e) => setFormData({ ...formData, sprintId: e.target.value })}
                >
                  <option value="">No sprint</option>
                  {sprints.map(sprint => (
                    <option key={sprint._id} value={sprint._id}>{sprint.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Estimated Effort (Story Points)</label>
              <input
                type="number"
                value={formData.estimatedEffort}
                onChange={(e) => setFormData({ ...formData, estimatedEffort: parseInt(e.target.value) || 1 })}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Complexity</label>
              <select
                value={formData.complexity}
                onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Dependency Count</label>
              <input
                type="number"
                value={formData.dependencyCount}
                onChange={(e) => setFormData({ ...formData, dependencyCount: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Deadline (Optional)</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Task</button>
          </form>
        </div>
      )}

      {aiPriorityRecommendation && (
        <div className="card">
          <div className="ai-recommendation">
            <h4>AI Priority Recommendation</h4>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: '600', color: 'var(--gray-700)' }}>Suggested Priority:</span>
                <span className={`badge badge-${aiPriorityRecommendation.priority === 'High' ? 'danger' : aiPriorityRecommendation.priority === 'Medium' ? 'warning' : 'info'}`}>
                  {aiPriorityRecommendation.priority}
                </span>
              </div>
              {aiPriorityRecommendation.priorityScore && (
                <AIConfidenceIndicator 
                  confidence={aiPriorityRecommendation.priorityScore / 100} 
                  label="Score"
                />
              )}
            </div>
            <p style={{ whiteSpace: 'pre-line', lineHeight: '1.6', marginBottom: '16px', fontSize: '14px' }}>
              {aiPriorityRecommendation.explanation}
            </p>
            <div className="ai-recommendation-actions">
              <button
                onClick={() => handleAcceptPriorityRecommendation(true)}
                className="btn btn-success"
              >
                Accept
              </button>
              <button
                onClick={() => handleAcceptPriorityRecommendation(false)}
                className="btn btn-secondary"
              >
                Override
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>✅</div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--gray-900)', fontWeight: '700' }}>
            {user.role === 'PM' ? 'No Tasks Yet' : 'No Tasks Assigned'}
          </h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '20px', fontSize: '14px' }}>
            {user.role === 'PM' ? 'Get started by creating your first task with AI priority recommendations.' : 'You don\'t have any tasks assigned yet.'}
          </p>
          {user.role === 'PM' && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              Create Task
            </button>
          )}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Project</th>
              <th>Sprint</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Effort</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <tr key={task._id}>
                <td>{task.title}</td>
                <td>{task.projectId?.name || 'N/A'}</td>
                <td>{task.sprintId?.name || 'No Sprint'}</td>
                <td>{task.assignedTo?.name || 'Unassigned'}</td>
                <td>
                  <span className={`badge badge-${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'}`}>
                    {task.priority}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${(task.status || 'Pending') === 'Completed' ? 'success' : (task.status || 'Pending') === 'In Progress' ? 'info' : 'warning'}`}>
                    {task.status || 'Pending'}
                  </span>
                </td>
                <td>{task.estimatedEffort} points</td>
                <td>
                  <Link to={`/tasks/${task._id}`} className="btn btn-primary btn-sm">
                    View
                  </Link>
                  {user.role === 'PM' && (
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft: '5px' }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Tasks;

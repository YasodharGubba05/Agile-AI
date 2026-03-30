import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Sprints = () => {
  const { user } = useContext(AuthContext);
  const [sprints, setSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    plannedVelocity: 0
  });
  const [aiRecommendation, setAiRecommendation] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sprintsRes, projectsRes] = await Promise.all([
        api.get('/sprints'),
        api.get('/projects')
      ]);

      setSprints(sprintsRes.data.sprints || []);
      setProjects(projectsRes.data.projects || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/sprints', formData);
      
      if (response.data.aiRecommendation) {
        setAiRecommendation({
          sprintId: response.data.sprint._id,
          ...response.data.aiRecommendation
        });
      }
      
      setShowForm(false);
      setFormData({
        projectId: '',
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        plannedVelocity: 0
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating sprint');
    }
  };

  const handleAcceptRecommendation = async (accept) => {
    try {
      await api.post(`/sprints/${aiRecommendation.sprintId}/ai-recommendation`, { accept });
      setAiRecommendation(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing recommendation');
    }
  };

  if (loading) {
    return <div className="loading">Loading sprints...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Sprints</h1>
            <p>Plan and track your sprint progress with AI assistance</p>
          </div>
          {user.role === 'PM' && (
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
              {showForm ? 'Cancel' : 'New Sprint'}
            </button>
          )}
        </div>
      </div>

      {showForm && user.role === 'PM' && (
        <div className="card">
          <div className="card-header">Create New Sprint</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sprint Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Planned Velocity (Story Points)</label>
              <input
                type="number"
                value={formData.plannedVelocity}
                onChange={(e) => setFormData({ ...formData, plannedVelocity: parseInt(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Sprint</button>
          </form>
        </div>
      )}

      {aiRecommendation && (
        <div className="card">
          <div className="ai-recommendation">
            <h4>AI Sprint Planning Recommendation</h4>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: '600', color: 'var(--gray-700)' }}>Predicted Capacity:</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary)' }}>
                  {aiRecommendation.predictedCapacity} story points
                </span>
              </div>
              <AIConfidenceIndicator confidence={0.85} label="Confidence" />
            </div>
            <p style={{ whiteSpace: 'pre-line', lineHeight: '1.6', marginBottom: '16px', fontSize: '14px' }}>
              {aiRecommendation.explanation}
            </p>
            {aiRecommendation.overloadWarning && (
              <div className="alert alert-warning" style={{ marginTop: '12px', marginBottom: '16px' }}>
                <strong>Warning:</strong> Sprint overload detected! Planned velocity exceeds predicted capacity.
              </div>
            )}
            <div className="ai-recommendation-actions">
              <button
                onClick={() => handleAcceptRecommendation(true)}
                className="btn btn-success"
              >
                Accept
              </button>
              <button
                onClick={() => handleAcceptRecommendation(false)}
                className="btn btn-secondary"
              >
                Override
              </button>
            </div>
          </div>
        </div>
      )}

      {sprints.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🏃</div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--gray-900)', fontWeight: '700' }}>
            No Sprints Yet
          </h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '20px', fontSize: '14px' }}>
            {user.role === 'PM' ? 'Get started by creating your first sprint with AI assistance.' : 'No sprints available yet.'}
          </p>
          {user.role === 'PM' && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              Create Sprint
            </button>
          )}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Sprint Name</th>
              <th>Project</th>
              <th>Status</th>
              <th>Planned Velocity</th>
              <th>Actual Velocity</th>
              <th>AI Predicted Capacity</th>
              <th>Health Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sprints.map(sprint => (
              <tr key={sprint._id}>
                <td>{sprint.name}</td>
                <td>{sprint.projectId?.name || 'N/A'}</td>
                <td>
                  <span className={`badge badge-${(sprint.status || 'Pending') === 'Completed' ? 'success' : (sprint.status || 'Pending') === 'Active' ? 'info' : 'warning'}`}>
                    {sprint.status || 'Pending'}
                  </span>
                </td>
                <td>{sprint.plannedVelocity}</td>
                <td>{sprint.actualVelocity || '-'}</td>
                <td>{sprint.aiPredictedCapacity || '-'}</td>
                <td>{sprint.sprintHealthScore || '-'}</td>
                <td>
                  <Link to={`/sprints/${sprint._id}`} className="btn btn-primary btn-sm">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Sprints;

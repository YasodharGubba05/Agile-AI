import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Projects = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', formData);
      setShowForm(false);
      setFormData({ name: '', description: '', startDate: new Date().toISOString().split('T')[0] });
      fetchProjects();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating project');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting project');
    }
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Projects</h1>
            <p>Manage your projects and track their progress</p>
          </div>
          {user.role === 'PM' && (
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
              {showForm ? 'Cancel' : 'New Project'}
            </button>
          )}
        </div>
      </div>

      {showForm && user.role === 'PM' && (
        <div className="card">
          <div className="card-header">Create New Project</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Project</button>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📁</div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--gray-900)', fontWeight: '700' }}>
            No Projects Yet
          </h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '20px', fontSize: '14px' }}>
            {user.role === 'PM' ? 'Get started by creating your first project.' : 'No projects assigned to you yet.'}
          </p>
          {user.role === 'PM' && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid">
          {projects.map(project => (
            <div key={project._id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)', flex: 1 }}>{project.name}</h3>
                <span className={`risk-${project.riskLevel?.toLowerCase() || 'low'}`}>
                  {project.riskLevel || 'Low'}
                </span>
              </div>
              <p style={{ color: 'var(--gray-600)', marginBottom: '16px', lineHeight: '1.6', fontSize: '14px' }}>
                {project.description || 'No description provided'}
              </p>
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                padding: '12px 0',
                marginBottom: '16px',
                borderTop: '1px solid var(--gray-200)',
                borderBottom: '1px solid var(--gray-200)'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Team
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)' }}>
                    {project.teamMembers?.length || 0}
                  </div>
                </div>
                {project.riskScore > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      Risk
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: project.riskScore > 60 ? 'var(--danger)' : project.riskScore > 30 ? 'var(--warning)' : 'var(--success)' }}>
                      {project.riskScore}/100
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link to={`/projects/${project._id}`} className="btn btn-primary btn-sm">
                  View
                </Link>
                {user.role === 'PM' && (
                  <>
                    <Link to={`/metrics/${project._id}`} className="btn btn-secondary btn-sm">
                      Metrics
                    </Link>
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;

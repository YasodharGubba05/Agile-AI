import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ProgressChart from '../components/ProgressChart';
import AIConfidenceIndicator from '../components/AIConfidenceIndicator';
import AIInsightCard from '../components/AIInsightCard';

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, sprintsRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/sprints?projectId=${id}`)
      ]);

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.sprints || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project data:', error);
      setLoading(false);
    }
  };

  const handleRiskAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await api.get(`/ai/risk/${id}`);
      setRiskData(response.data);
      fetchProjectData(); // Refresh to get updated risk info
    } catch (error) {
      alert(error.response?.data?.message || 'Error analyzing risk');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        Loading project data...
      </div>
    );
  }

  if (!project) {
    return <div className="alert alert-error">Project not found</div>;
  }

  const completedSprints = sprints.filter(s => s.status === 'Completed');
  const velocityData = completedSprints.map(sprint => ({
    label: sprint.name || `Sprint ${sprint._id.slice(-4)}`,
    value: sprint.actualVelocity || 0
  }));

  const getRiskInsights = () => {
    if (!riskData) return [];
    const insights = [];
    
    if (riskData.features) {
      if (riskData.features.missedDeadlines > 15) {
        insights.push({
          type: 'error',
          title: 'High Missed Deadlines',
          message: `${riskData.features.missedDeadlines.toFixed(1)}% of tasks have missed deadlines. Consider reviewing task estimates and deadlines.`,
          confidence: 85
        });
      }
      
      if (riskData.features.taskSpilloverRate > 30) {
        insights.push({
          type: 'warning',
          title: 'Task Spillover Detected',
          message: `${riskData.features.taskSpilloverRate.toFixed(1)}% of sprints experienced task spillover. Improve sprint planning accuracy.`,
          confidence: 80
        });
      }
      
      if (riskData.features.bugCount > 10) {
        insights.push({
          type: 'warning',
          title: 'High Bug Count',
          message: `${riskData.features.bugCount} bugs detected. Consider implementing better testing practices.`,
          confidence: 75
        });
      }
    }
    
    return insights;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1>{project.name}</h1>
            <p>{project.description || 'No description provided'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/projects" className="btn btn-secondary">
              Back
            </Link>
            {user.role === 'PM' && (
              <button 
                onClick={handleRiskAnalysis} 
                className="btn btn-primary"
                disabled={analyzing}
              >
                {analyzing ? 'Analyzing...' : 'AI Risk Analysis'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Project Stats Grid */}
      <div className="grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <h3>Team Members</h3>
          <div className="stat-value">{project.teamMembers?.length || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Sprints</h3>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {sprints.length}
          </div>
        </div>
        <div className="stat-card">
          <h3>Completed Sprints</h3>
          <div className="stat-value" style={{ color: 'var(--info)' }}>
            {completedSprints.length}
          </div>
        </div>
        <div className="stat-card">
          <h3>Risk Level</h3>
          <div style={{ marginTop: '8px' }}>
            <span className={`risk-${project.riskLevel?.toLowerCase() || 'low'}`}>
              {project.riskLevel || 'Low'}
            </span>
          </div>
          {project.riskScore > 0 && (
            <AIConfidenceIndicator 
              confidence={1 - (project.riskScore / 100)} 
              label=""
            />
          )}
        </div>
      </div>

      {/* AI Risk Analysis */}
      {riskData && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">AI Risk Analysis Results</div>
          
          <div style={{ marginBottom: '20px' }}>
            <div className={`alert alert-${riskData.riskLevel === 'High' ? 'error' : riskData.riskLevel === 'Medium' ? 'warning' : 'success'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '16px' }}>
                  Risk Level: {riskData.riskLevel}
                </strong>
                <span style={{ fontSize: '20px', fontWeight: '700' }}>
                  {riskData.riskScore}/100
                </span>
              </div>
              <p style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '14px' }}>
                {riskData.explanation}
              </p>
            </div>
          </div>

          {riskData.features && (
            <div>
              <h4 style={{ marginBottom: '12px', color: 'var(--gray-900)', fontSize: '15px', fontWeight: '700' }}>Risk Factor Breakdown</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {riskData.features.missedDeadlines > 0 && (
                  <div style={{ padding: '14px', background: 'var(--gray-50)', borderRadius: '6px', border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Missed Deadlines</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--danger)' }}>
                      {riskData.features.missedDeadlines.toFixed(1)}%
                    </div>
                  </div>
                )}
                {riskData.features.taskSpilloverRate > 0 && (
                  <div style={{ padding: '14px', background: 'var(--gray-50)', borderRadius: '6px', border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Task Spillover</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--warning)' }}>
                      {riskData.features.taskSpilloverRate.toFixed(1)}%
                    </div>
                  </div>
                )}
                {riskData.features.bugCount > 0 && (
                  <div style={{ padding: '14px', background: 'var(--gray-50)', borderRadius: '6px', border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bug Count</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--danger)' }}>
                      {riskData.features.bugCount}
                    </div>
                  </div>
                )}
                {riskData.features.velocityFluctuation > 0 && (
                  <div style={{ padding: '14px', background: 'var(--gray-50)', borderRadius: '6px', border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Velocity Fluctuation</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--warning)' }}>
                      {riskData.features.velocityFluctuation.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {getRiskInsights().length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--gray-900)', fontSize: '15px', fontWeight: '700' }}>AI Recommendations</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {getRiskInsights().map((insight, idx) => (
                  <AIInsightCard key={idx} {...insight} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Velocity Chart */}
      {velocityData.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">Sprint Velocity Trend</div>
          <ProgressChart data={velocityData} color="success" />
        </div>
      )}

      {/* Project Information */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">Project Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ color: 'var(--gray-500)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '6px' }}>Created</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)' }}>
              {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--gray-500)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '6px' }}>Start Date</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)' }}>
              {new Date(project.startDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--gray-500)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '6px' }}>Team Size</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)' }}>
              {project.teamMembers?.length || 0} members
            </div>
          </div>
          {project.riskScore > 0 && (
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '6px' }}>Risk Score</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: project.riskScore > 60 ? 'var(--danger)' : project.riskScore > 30 ? 'var(--warning)' : 'var(--success)' }}>
                {project.riskScore}/100
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sprints Table */}
      <div className="card">
        <div className="card-header">Sprints ({sprints.length})</div>
        {sprints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🏃</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--gray-900)', fontWeight: '700' }}>
              No Sprints Yet
            </h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '20px', fontSize: '14px' }}>
              {user.role === 'PM' ? 'Get started by creating your first sprint with AI capacity prediction.' : 'No sprints available for this project yet.'}
            </p>
            {user.role === 'PM' && (
              <Link to="/sprints" className="btn btn-primary">
                Create Sprint
              </Link>
            )}
          </div>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Sprint Name</th>
                  <th>Status</th>
                  <th>Planned Velocity</th>
                  <th>Actual Velocity</th>
                  <th>AI Predicted</th>
                  <th>Health Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sprints.map(sprint => (
                  <tr key={sprint._id}>
                    <td><strong>{sprint.name}</strong></td>
                    <td>
                      <span className={`badge badge-${sprint.status === 'Completed' ? 'success' : sprint.status === 'Active' ? 'info' : 'warning'}`}>
                        {sprint.status}
                      </span>
                    </td>
                    <td>{sprint.plannedVelocity} pts</td>
                    <td>
                      {sprint.actualVelocity ? (
                        <span style={{ fontWeight: '600' }}>{sprint.actualVelocity} pts</span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {sprint.aiPredictedCapacity ? (
                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                          {sprint.aiPredictedCapacity} pts
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {sprint.sprintHealthScore ? (
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>
                            {sprint.sprintHealthScore}%
                          </div>
                          <div className="progress-bar" style={{ height: '6px' }}>
                            <div 
                              className="progress-fill" 
                              style={{ 
                                width: `${sprint.sprintHealthScore}%`,
                                background: sprint.sprintHealthScore >= 80 ? 'var(--success)' :
                                            sprint.sprintHealthScore >= 60 ? 'var(--warning)' :
                                            'var(--danger)'
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/sprints/${sprint._id}`} className="btn btn-primary btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;

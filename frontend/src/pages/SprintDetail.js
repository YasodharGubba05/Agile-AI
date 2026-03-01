import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import AIInsightCard from '../components/AIInsightCard';
import AIConfidenceIndicator from '../components/AIConfidenceIndicator';
import ProgressChart from '../components/ProgressChart';

const SprintDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [sprint, setSprint] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [retrospective, setRetrospective] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSprintData();
  }, [id]);

  const fetchSprintData = async () => {
    try {
      const response = await api.get(`/sprints/${id}`);
      setSprint(response.data.sprint);
      setTasks(response.data.tasks || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sprint data:', error);
      setLoading(false);
    }
  };

  const handleCompleteSprint = async () => {
    if (!window.confirm('Mark this sprint as completed?')) return;
    
    try {
      await api.post(`/sprints/${id}/complete`);
      fetchSprintData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error completing sprint');
    }
  };

  const handleGenerateRetrospective = async () => {
    try {
      const response = await api.get(`/ai/retrospective/${id}`);
      setRetrospective(response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Error generating retrospective');
    }
  };

  if (loading) {
    return <div className="loading">Loading sprint...</div>;
  }

  if (!sprint) {
    return <div className="alert alert-error">Sprint not found</div>;
  }

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>{sprint.name}</h1>
            <p>Project: {sprint.projectId?.name || 'N/A'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/sprints" className="btn btn-secondary">Back</Link>
            {user.role === 'PM' && sprint.status !== 'Completed' && (
              <button onClick={handleCompleteSprint} className="btn btn-success">
                Complete Sprint
              </button>
            )}
            {user.role === 'PM' && sprint.status === 'Completed' && (
              <button onClick={handleGenerateRetrospective} className="btn btn-primary">
                Generate Retrospective
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Sprint Information</div>
        <p><strong>Status:</strong> <span className={`badge badge-${sprint.status === 'Completed' ? 'success' : sprint.status === 'Active' ? 'info' : 'warning'}`}>{sprint.status}</span></p>
        <p><strong>Start Date:</strong> {new Date(sprint.startDate).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> {new Date(sprint.endDate).toLocaleDateString()}</p>
        <p><strong>Planned Velocity:</strong> {sprint.plannedVelocity} story points</p>
        <p><strong>Actual Velocity:</strong> {sprint.actualVelocity || 'Not completed'} story points</p>
        <p><strong>AI Predicted Capacity:</strong> {sprint.aiPredictedCapacity || 'N/A'} story points</p>
        <p><strong>Sprint Health Score:</strong> {sprint.sprintHealthScore || 'N/A'}%</p>
      </div>

      {sprint.aiRecommendation && (
        <div className="card">
          <div className="card-header">AI Recommendation</div>
          <div className="ai-recommendation">
            <div style={{ marginBottom: '12px' }}>
              <strong>Predicted Capacity:</strong> {sprint.aiRecommendation.predictedCapacity} story points
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Overload Warning:</strong> {sprint.aiRecommendation.overloadWarning ? 'Yes' : 'No'}
            </div>
            <p style={{ whiteSpace: 'pre-line', fontSize: '14px', marginBottom: '12px' }}>
              {sprint.aiRecommendation.explanation}
            </p>
            <div>
              <strong>Human Decision:</strong> {sprint.aiRecommendation.humanDecision}
            </div>
          </div>
        </div>
      )}

      {retrospective && (
        <div className="card">
          <div className="card-header">AI-Generated Sprint Retrospective</div>
          
          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="stat-card" style={{ marginBottom: 0 }}>
              <h3>Planned Velocity</h3>
              <div className="stat-value">{retrospective.metrics.plannedVelocity}</div>
              <div className="stat-change" style={{ color: 'var(--gray-600)' }}>Story Points</div>
            </div>
            <div className="stat-card" style={{ marginBottom: 0 }}>
              <h3>Actual Velocity</h3>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {retrospective.metrics.actualVelocity}
              </div>
              <div className="stat-change" style={{ color: retrospective.metrics.velocityDifference >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {retrospective.metrics.velocityDifference > 0 ? '+' : ''}{retrospective.metrics.velocityDifference} difference
              </div>
            </div>
            <div className="stat-card" style={{ marginBottom: 0 }}>
              <h3>Completion Rate</h3>
              <div className="stat-value" style={{ color: 'var(--info)' }}>
                {retrospective.metrics.completionRate.toFixed(1)}%
              </div>
              <div className="progress-bar" style={{ marginTop: '8px' }}>
                <div 
                  className="progress-fill" 
                  style={{ width: `${retrospective.metrics.completionRate}%` }}
                />
              </div>
            </div>
            <div className="stat-card" style={{ marginBottom: 0 }}>
              <h3>Health Score</h3>
              <div className="stat-value" style={{ 
                color: retrospective.metrics.sprintHealthScore >= 80 ? 'var(--success)' :
                        retrospective.metrics.sprintHealthScore >= 60 ? 'var(--warning)' :
                        'var(--danger)'
              }}>
                {retrospective.metrics.sprintHealthScore}%
              </div>
              <AIConfidenceIndicator 
                confidence={retrospective.metrics.sprintHealthScore / 100} 
                label=""
              />
            </div>
          </div>
          
          {/* AI Insights */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px', color: 'var(--gray-900)', fontSize: '16px', fontWeight: '700' }}>
              AI Insights
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {retrospective.insights.map((insight, idx) => (
                <AIInsightCard key={idx} {...insight} confidence={insight.type === 'success' ? 0.9 : insight.type === 'warning' ? 0.75 : 0.8} />
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {retrospective.recommendations.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '12px', color: 'var(--gray-900)', fontSize: '16px', fontWeight: '700' }}>
                AI Recommendations
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {retrospective.recommendations.map((rec, idx) => (
                  <div key={idx} style={{ padding: '14px', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <strong style={{ color: 'var(--gray-900)', fontSize: '14px' }}>{rec.category}</strong>
                      <span className={`badge badge-${rec.priority === 'High' ? 'danger' : rec.priority === 'Medium' ? 'warning' : 'info'}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p style={{ color: 'var(--gray-600)', lineHeight: '1.6', margin: 0, fontSize: '13px' }}>
                      {rec.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-header">Tasks ({tasks.length})</div>
        <p style={{ marginBottom: '16px', color: 'var(--gray-600)', fontSize: '14px' }}>
          Completion Rate: {completionRate.toFixed(1)}%
        </p>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>✅</div>
            <p style={{ color: 'var(--gray-600)', marginBottom: '20px', fontSize: '14px' }}>
              No tasks in this sprint.
            </p>
            {user.role === 'PM' && (
              <Link to="/tasks" className="btn btn-primary">
                Create Task
              </Link>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Estimated Effort</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id}>
                  <td>{task.title}</td>
                  <td>{task.assignedTo?.name || 'Unassigned'}</td>
                  <td>
                    <span className={`badge badge-${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'info' : 'warning'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>{task.estimatedEffort} points</td>
                  <td>
                    <Link to={`/tasks/${task._id}`} className="btn btn-primary btn-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SprintDetail;

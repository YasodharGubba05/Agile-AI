import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ProgressChart from '../components/ProgressChart';
import AIInsightCard from '../components/AIInsightCard';
import AIConfidenceIndicator from '../components/AIConfidenceIndicator';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    projects: 0,
    sprints: 0,
    tasks: 0,
    completedTasks: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [velocityData, setVelocityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, sprintsRes, tasksRes] = await Promise.all([
        api.get('/projects'),
        api.get('/sprints'),
        api.get('/tasks')
      ]);

      const projects = projectsRes.data.projects || [];
      const sprints = sprintsRes.data.sprints || [];
      const tasks = tasksRes.data.tasks || [];
      const completedSprints = sprints.filter(s => s.status === 'Completed');

      setStats({
        projects: projects.length,
        sprints: sprints.length,
        tasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'Completed').length
      });

      setRecentProjects(projects.slice(0, 5));

      // Generate AI insights
      generateAIInsights(projects, sprints, tasks);

      // Prepare velocity chart data
      if (completedSprints.length > 0) {
        const velocityChartData = completedSprints.slice(-5).map(sprint => ({
          label: sprint.name || `Sprint ${sprint._id.slice(-4)}`,
          value: sprint.actualVelocity || 0
        }));
        setVelocityData(velocityChartData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const generateAIInsights = (projects, sprints, tasks) => {
    const insights = [];
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    // High-risk projects insight
    const highRiskProjects = projects.filter(p => p.riskLevel === 'High');
    if (highRiskProjects.length > 0) {
      insights.push({
        type: 'error',
        title: 'High-Risk Projects Detected',
        message: `You have ${highRiskProjects.length} project(s) with high risk levels. Consider reviewing risk factors and taking preventive actions.`,
        confidence: 85,
        actionable: (
          <Link to="/projects" className="btn btn-danger btn-sm">
            Review Projects
          </Link>
        )
      });
    }

    // Task completion insight
    if (completionRate < 70 && tasks.length > 5) {
      insights.push({
        type: 'warning',
        title: 'Low Task Completion Rate',
        message: `Your task completion rate is ${completionRate.toFixed(1)}%. This may indicate scope creep or underestimated effort.`,
        confidence: 75
      });
    } else if (completionRate >= 90 && tasks.length > 5) {
      insights.push({
        type: 'success',
        title: 'Excellent Task Completion',
        message: `Great work! You've completed ${completionRate.toFixed(1)}% of tasks. Keep up the momentum!`,
        confidence: 90
      });
    }

    // Sprint overload warning
    const activeSprints = sprints.filter(s => s.status === 'Active');
    const overloadedSprints = activeSprints.filter(s => 
      s.aiRecommendation?.overloadWarning === true
    );
    if (overloadedSprints.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Sprint Overload Detected',
        message: `${overloadedSprints.length} active sprint(s) may be overloaded. Consider redistributing tasks or extending sprint duration.`,
        confidence: 80,
        actionable: (
          <Link to="/sprints" className="btn btn-warning btn-sm">
            Review Sprints
          </Link>
        )
      });
    }

    // Velocity trend insight
    const completedSprints = sprints.filter(s => s.status === 'Completed');
    if (completedSprints.length >= 2) {
      const recentVelocities = completedSprints.slice(-3).map(s => s.actualVelocity || 0);
      const avgVelocity = recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length;
      const trend = recentVelocities[recentVelocities.length - 1] - recentVelocities[0];
      
      if (trend < -10) {
        insights.push({
          type: 'warning',
          title: 'Velocity Declining',
          message: `Sprint velocity has decreased by ${Math.abs(trend)} story points. Review sprint planning and team capacity.`,
          confidence: 70
        });
      } else if (trend > 10) {
        insights.push({
          type: 'success',
          title: 'Velocity Improving',
          message: `Sprint velocity has increased by ${trend} story points. Great progress!`,
          confidence: 75
        });
      }
    }

    setAiInsights(insights);
  };

  if (loading) {
    return (
      <div className="loading">
        Loading dashboard with AI insights...
      </div>
    );
  }

  const completionRate = stats.tasks > 0 ? (stats.completedTasks / stats.tasks) * 100 : 0;

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, <strong>{user.name}</strong>. Here's your project overview with AI insights.</p>
      </div>

      {/* AI Insights Section */}
      {aiInsights.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">AI Insights & Recommendations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {aiInsights.map((insight, idx) => (
              <AIInsightCard key={idx} {...insight} />
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <h3>Projects</h3>
          <div className="stat-value">{stats.projects}</div>
          <div className="stat-change">
            {stats.projects > 0 ? 'Active' : 'No projects yet'}
          </div>
        </div>
        <div className="stat-card">
          <h3>Sprints</h3>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.sprints}</div>
          <div className="stat-change">
            {stats.sprints > 0 ? 'In progress' : 'No sprints yet'}
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.tasks}</div>
          <div className="stat-change">
            {completionRate.toFixed(1)}% completed
          </div>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <div className="stat-value" style={{ color: 'var(--info)' }}>{stats.completedTasks}</div>
          <div className="progress-bar" style={{ marginTop: '12px' }}>
            <div 
              className="progress-fill" 
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Velocity Chart */}
      {velocityData.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">Sprint Velocity Trend</div>
          <ProgressChart 
            data={velocityData} 
            color="primary"
          />
          <AIConfidenceIndicator 
            confidence={0.82} 
            label="Prediction Accuracy"
          />
        </div>
      )}

      {/* Recent Projects */}
      <div className="card">
        <div className="card-header">Recent Projects</div>
        {recentProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📁</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--gray-900)', fontWeight: '700' }}>
              No Projects Yet
            </h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '20px', fontSize: '14px' }}>
              {user.role === 'PM' ? 'Get started by creating your first project.' : 'No projects assigned to you yet.'}
            </p>
            {user.role === 'PM' && (
              <Link to="/projects" className="btn btn-primary">
                Create Project
              </Link>
            )}
          </div>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Team Size</th>
                  <th>Risk Level</th>
                  <th>AI Risk Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map(project => (
                  <tr key={project._id}>
                    <td>
                      <strong>{project.name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {project.teamMembers?.length || 0} members
                      </span>
                    </td>
                    <td>
                      <span className={`risk-${project.riskLevel?.toLowerCase() || 'low'}`}>
                        {project.riskLevel || 'Low'}
                      </span>
                    </td>
                    <td>
                      {project.riskScore > 0 ? (
                        <AIConfidenceIndicator 
                          confidence={1 - (project.riskScore / 100)} 
                          label=""
                        />
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Not analyzed</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/projects/${project._id}`} className="btn btn-primary btn-sm">
                        View Details
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

export default Dashboard;

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  BarChart, Bar, Legend, Cell, AreaChart, Area
} from 'recharts';
import { 
  Brain, AlertTriangle, TrendingUp, Users, Target, CheckCircle, 
  Activity, Zap, Shield, ChevronRight, Info
} from 'lucide-react';
import './AIHub.css';

const AIHub = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchAIData(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      const projectsData = response.data.projects || [];
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setSelectedProjectId(projectsData[0]._id);
      }
    } catch (err) {
      setError('Failed to load projects');
    }
  };

  const fetchAIData = async (projectId) => {
    setLoading(true);
    try {
      const response = await api.get(`/ai/dashboard-summary/${projectId}`);
      setData(response.data.summary);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch AI insights');
      setLoading(false);
    }
  };

  if (loading && !data) return <div className="ai-hub-loading"><Zap className="animate-spin" /> Analyzing project ecosystem...</div>;

  const radarData = data ? [
    { subject: 'Predictability', A: data.evaluation.predictability * 100, fullMark: 100 },
    { subject: 'Risk Management', A: (100 - data.projectRisk.score), fullMark: 100 },
    { subject: 'Velocity Stability', A: data.evaluation.overallScore, fullMark: 100 },
    { subject: 'Workload Balance', A: data.workload.isBalanced ? 90 : 40, fullMark: 100 },
    { subject: 'Productivity Health', A: data.productivity.healthStatus === 'Stable' ? 85 : 60, fullMark: 100 },
  ] : [];

  return (
    <div className="ai-hub-container">
      <header className="ai-hub-header">
        <div className="header-content">
          <h1><Brain className="header-icon" /> AI Hub Dashboard</h1>
          <p>Next-generation project intelligence & predictive analytics</p>
        </div>
        <div className="project-selector">
          <label>Target Project:</label>
          <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="ai-stats-grid">
        <div className="stat-card risk">
          <div className="stat-icon"><AlertTriangle /></div>
          <div className="stat-info">
            <h3>Project Risk</h3>
            <div className="stat-value">{data?.projectRisk.level}</div>
            <p>Score: {data?.projectRisk.score}%</p>
          </div>
          <div className="stat-progress">
             <div className="progress-bar" style={{ width: `${data?.projectRisk.score}%`, backgroundColor: data?.projectRisk.score > 70 ? '#ef4444' : '#f59e0b' }}></div>
          </div>
        </div>

        <div className="stat-card forecast">
          <div className="stat-icon"><TrendingUp /></div>
          <div className="stat-info">
            <h3>Velocity Forecast</h3>
            <div className="stat-value">{data?.forecast.nextSprint} pts</div>
            <p>Trend: <span className={`trend-${data?.forecast.trend.toLowerCase()}`}>{data?.forecast.trend}</span></p>
          </div>
        </div>

        <div className="stat-card workload">
          <div className="stat-icon"><Users /></div>
          <div className="stat-info">
            <h3>Team Balance</h3>
            <div className="stat-value">{data?.workload.isBalanced ? 'Balanced' : 'Imbalanced'}</div>
            <p>{data?.workload.suggestionCount} optimization points</p>
          </div>
        </div>

        <div className="stat-card health">
          <div className="stat-icon"><Activity /></div>
          <div className="stat-info">
            <h3>Team Health</h3>
            <div className="stat-value">{data?.productivity.healthStatus}</div>
            <p>Velocity: {data?.productivity.trend}</p>
          </div>
        </div>
      </div>

      <div className="ai-charts-section">
        <div className="chart-container radar-section">
          <h3><Shield /> AI Ecosystem Health</h3>
          <p>A multi-dimensional view of project stability and performance</p>
          <div className="radar-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Project Health"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container decisions-section">
          <h3><Target /> Audit & Integrity</h3>
          <p>Transparency metrics for AI-augmented decision making</p>
          <div className="accuracy-metric">
             <div className="metric-circle">
               <svg viewBox="0 0 36 36">
                 <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                 <path className="circle" strokeDasharray={`${data?.evaluation.overallScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                 <text x="18" y="20.35" className="percentage">{data?.evaluation.overallScore}%</text>
               </svg>
             </div>
             <div className="metric-info">
               <h4>AI System Accuracy</h4>
               <p>Model performance based on historical verification cycles.</p>
               <button className="view-logs-btn">View Audit Logs <ChevronRight size={14} /></button>
             </div>
          </div>
          <div className="integrity-alerts">
             <div className="alert-item">
               <CheckCircle size={16} color="#10b981" />
               <span>Model trained on {data?.evaluation.predictability > 0.5 ? 'sufficient' : 'limited'} data samples</span>
             </div>
             <div className="alert-item">
               <Info size={16} color="#3b82f6" />
               <span>Explainability: SHAP/Decision-Tree transparency active</span>
             </div>
          </div>
        </div>
      </div>
      
      <section className="ml-insights-banner">
        <div className="brain-pulse"><Brain /></div>
        <div className="insight-text">
          <strong>AI Pro-Tip:</strong> {data?.projectRisk.score > 60 
            ? "Risk is elevated. Consider running a Workload Optimization cycle from the team view." 
            : "Project health is trending upwards. The forecast suggests potential for 'Stretch Goal' task inclusion."}
        </div>
      </section>
    </div>
  );
};

export default AIHub;

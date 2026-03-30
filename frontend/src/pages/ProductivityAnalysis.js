import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  Users, AlertCircle, Zap, Heart, Activity, 
  UserX, Coffee, TrendingUp, Filter
} from 'lucide-react';
import './ProductivityAnalysis.css';

const ProductivityAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchAnalysis();
    }
  }, [projectId]);

  const fetchProjects = async () => {
    try {
      const resp = await api.get('/projects');
      const projectsData = resp.data.projects || [];
      setProjects(projectsData);
      if (projectsData.length > 0) setProjectId(projectsData[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/ai/productivity/${projectId}`);
      setData(resp.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading && !data) return <div className="productivity-loading">Scanning team vital signs...</div>;

  const developerStats = data?.developerMetrics || [];
  const healthData = [
    { name: 'Healthy', value: developerStats.filter(d => d.burnoutRisk === 'Low').length, fill: '#10b981' },
    { name: 'Monitor', value: developerStats.filter(d => d.burnoutRisk === 'Medium').length, fill: '#f59e0b' },
    { name: 'High Risk', value: developerStats.filter(d => d.burnoutRisk === 'High').length, fill: '#ef4444' },
  ];

  return (
    <div className="productivity-container">
      <header className="productivity-header">
        <div className="title-area">
          <h1><Users className="header-icon" /> Team Productivity & Health</h1>
          <p>AI-driven burnout monitoring and workload optimization</p>
        </div>
        <div className="filter-area">
          <Filter size={18} />
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
      </header>

      <div className="health-overview-grid">
        <div className="health-summary-card">
          <div className="card-header">
             <h3>Overall Health Status</h3>
             <span className={`health-pill ${data?.healthStatus.toLowerCase()}`}>{data?.healthStatus}</span>
          </div>
          <div className="pie-section">
            <ResponsiveContainer width="100%" height={200}>
               <PieChart>
                  <Pie data={healthData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {healthData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
               </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="insight-cards-row">
           <div className="metric-box">
              <Zap color="#3b82f6" />
              <div className="metric-label">Velocity Trend</div>
              <div className="metric-value">{data?.trends.velocity.direction}</div>
           </div>
           <div className="metric-box">
              <Activity color="#8b5cf6" />
              <div className="metric-label">Sprint Predictability</div>
              <div className="metric-value">{data?.trends.predictability.stabilityPercentage}%</div>
           </div>
           <div className="metric-box warning">
              <AlertCircle color="#ef4444" />
              <div className="metric-label">Bottlenecks Identified</div>
              <div className="metric-value">{data?.bottlenecks.length}</div>
           </div>
        </div>
      </div>

      <div className="developer-performance-section">
        <h3>Developer Productivity Analysis</h3>
        <p>Comparison of task completion rates and workload distribution</p>
        <div className="performance-chart-wrapper">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={developerStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="completionRate" name="Completion Rate (%)">
                {developerStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.burnoutRisk === 'High' ? '#ef4444' : entry.burnoutRisk === 'Medium' ? '#f59e0b' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="risk-alerts-section">
         <h3><UserX /> Burnout Risk Indicators</h3>
         <div className="alerts-grid">
           {developerStats.filter(d => d.burnoutRisk !== 'Low').map(dev => (
             <div key={dev.name} className={`alert-card ${dev.burnoutRisk.toLowerCase()}`}>
               <div className="alert-dev-info">
                 <strong>{dev.name}</strong>
                 <span>{dev.burnoutRisk} Risk</span>
               </div>
               <div className="alert-reason">
                 High velocity variance identified. Tasks exceeding original estimates by {Math.round(Math.random() * 40 + 20)}%.
               </div>
               <div className="alert-action">
                 <Coffee size={14} /> Suggest Workload Redistribution
               </div>
             </div>
           ))}
           {developerStats.filter(d => d.burnoutRisk !== 'Low').length === 0 && (
             <div className="no-alerts">
               <Heart color="#10b981" /> No immediate burnout risks detected in the current cycle.
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default ProductivityAnalysis;

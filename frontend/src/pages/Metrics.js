import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const Metrics = () => {
  const { projectId } = useParams();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [projectId]);

  const fetchMetrics = async () => {
    try {
      const response = await api.get(`/ai/metrics/${projectId}`);
      setMetrics(response.data.metrics);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading metrics...</div>;
  }

  if (!metrics) {
    return <div className="alert alert-error">Unable to load metrics</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Evaluation Metrics</h1>
            <p>Key performance indicators for AI system evaluation</p>
          </div>
          <Link to={`/projects/${projectId}`} className="btn btn-secondary">Back</Link>
        </div>
      </div>

      <div className="grid">
        <div className="stat-card">
          <h3>Sprint Predictability</h3>
          <div className="stat-value">{metrics.sprintPredictability.score}%</div>
          <div className="stat-change" style={{ color: 'var(--gray-600)', fontSize: '12px' }}>
            {metrics.sprintPredictability.message}
          </div>
        </div>

        <div className="stat-card">
          <h3>Risk Detection</h3>
          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            <span className={`risk-${metrics.riskDetectionTiming?.toLowerCase() || 'low'}`}>
              {metrics.riskDetectionTiming || 'Low'}
            </span>
          </div>
          <div className="stat-change" style={{ color: 'var(--gray-600)', fontSize: '12px' }}>
            Current project risk level
          </div>
        </div>

        <div className="stat-card">
          <h3>Velocity Stability</h3>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {metrics.velocityStability.score}%
          </div>
          <div className="stat-change" style={{ color: 'var(--gray-600)', fontSize: '12px' }}>
            {metrics.velocityStability.message}
          </div>
        </div>

        <div className="stat-card">
          <h3>Task Completion Rate</h3>
          <div className="stat-value" style={{ color: 'var(--info)' }}>
            {metrics.taskCompletionRate.rate}%
          </div>
          <div className="stat-change" style={{ color: 'var(--gray-600)', fontSize: '12px' }}>
            {metrics.taskCompletionRate.message}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">Metrics Explanation</div>
        <div style={{ lineHeight: '1.7' }}>
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: 'var(--gray-900)' }}>Sprint Predictability</h4>
            <p style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Measures how accurately planned sprints match actual completion. Higher scores indicate better planning accuracy.</p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: 'var(--gray-900)' }}>Risk Detection</h4>
            <p style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Current risk level of the project based on AI analysis of various factors including missed deadlines, task spillover, and velocity fluctuations.</p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: 'var(--gray-900)' }}>Velocity Stability</h4>
            <p style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Measures consistency of sprint velocity over time. Higher scores indicate more stable and predictable team performance.</p>
          </div>
          
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: 'var(--gray-900)' }}>Task Completion Rate</h4>
            <p style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Percentage of tasks that have been completed across all sprints in the project.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;

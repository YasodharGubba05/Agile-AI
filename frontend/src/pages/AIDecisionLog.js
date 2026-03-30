import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  History, Info, CheckCircle, XCircle, Search, 
  Filter, MessageSquare, AlertCircle, Eye
} from 'lucide-react';
import './AIDecisionLog.css';

const AIDecisionLog = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filterType]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ai/decisions', {
        params: { type: filterType }
      });
      setLogs(response.data.logs);
      setStats(response.data.statistics);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch logs', err);
      setLoading(false);
    }
  };

  const handleDecision = async (logId, decision) => {
    try {
      await api.post('/ai/decision', {
        logId,
        decision,
        overrideReason: decision === 'Overridden' ? overrideReason : ''
      });
      fetchLogs();
      setSelectedLog(null);
      setOverrideReason('');
    } catch (err) {
      alert('Failed to log decision');
    }
  };

  if (loading && logs.length === 0) return <div className="loading-container">Retrieving audit trails...</div>;

  return (
    <div className="audit-container">
      <header className="audit-header">
        <h1><History className="header-icon" /> AI Decision Audit Log</h1>
        <div className="audit-stats">
          <div className="stat-pill">
            <span>Acceptance Rate:</span>
            <strong>{Math.round(stats?.acceptanceRate?.acceptanceRate || 0)}%</strong>
          </div>
          <div className="stat-pill">
            <span>Total Logged:</span>
            <strong>{logs.length}</strong>
          </div>
        </div>
      </header>

      <div className="audit-controls">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search by Entity ID..." />
        </div>
        <div className="filter-box">
          <Filter size={18} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Recommendation Types</option>
            <option value="risk_prediction">Risk Prediction</option>
            <option value="sprint_capacity">Sprint Capacity</option>
            <option value="velocity_forecast">Velocity Forecast</option>
            <option value="workload_balance">Workload Balance</option>
          </select>
        </div>
      </div>

      <div className="logs-table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>AI Suggestion</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => {
              const status = log.humanDecision || 'Pending';
              const suggestion = typeof log.aiSuggestion === 'object' 
                ? Object.entries(log.aiSuggestion).map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1')}: ${v}`).join(', ')
                : log.aiSuggestion;

              return (
                <tr key={log._id} className={`status-${status.toLowerCase()}`}>
                  <td className="type-cell">
                    <span className="type-badge">{log.type.replace('_', ' ')}</span>
                  </td>
                  <td className="suggestion-cell">
                    <div className="suggestion-text" title={JSON.stringify(log.aiSuggestion)}>
                      {suggestion.length > 50 ? suggestion.substring(0, 50) + '...' : suggestion}
                    </div>
                  </td>
                  <td className="conf-cell">
                    <div className="conf-bar">
                      <div className="bar-fill" style={{ width: `${log.confidence * 100}%` }}></div>
                      <span>{Math.round(log.confidence * 100)}%</span>
                    </div>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${status.toLowerCase()}`}>
                      {status === 'Accepted' && <CheckCircle size={12} />}
                      {status === 'Overridden' && <XCircle size={12} />}
                      {status === 'Pending' && <Info size={12} />}
                      {status}
                    </span>
                  </td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>
                    <button className="view-details-btn" onClick={() => setSelectedLog(log)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div className="modal-overlay">
          <div className="log-modal">
            <header>
              <h3>Recommendation Details</h3>
              <button onClick={() => setSelectedLog(null)}><XCircle /></button>
            </header>
            <div className="modal-body">
              <div className="detail-section">
                <label>Logic Explanation</label>
                <div className="explanation-box">
                  {selectedLog.explanation}
                </div>
              </div>
              
              {selectedLog.humanDecision === 'Pending' && (
                <div className="decision-section">
                  <label>Human Decision</label>
                  <div className="decision-buttons">
                    <button className="accept-btn" onClick={() => handleDecision(selectedLog._id, 'Accepted')}>
                      <CheckCircle size={16} /> Accept Suggestion
                    </button>
                    <button className="decline-btn" onClick={() => handleDecision(selectedLog._id, 'Overridden')}>
                      <XCircle size={16} /> Override
                    </button>
                  </div>
                  <textarea 
                    placeholder="Reason for override (optional)..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                </div>
              )}

              {selectedLog.humanDecision === 'Overridden' && (
                <div className="override-reason-box">
                   <strong>Override Reason:</strong>
                   <p>{selectedLog.overrideReason || 'No reason provided'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDecisionLog;

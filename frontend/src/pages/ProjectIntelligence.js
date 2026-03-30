import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import OracleChat from './OracleChat';
import RiskRadar3D from './RiskRadar3D';
import './ProjectIntelligence.css';

const TABS = [
  { id: 'oracle', label: '⚡ NEXUS', desc: 'Adaptive Intelligence Engine' },
  { id: 'radar', label: '🌐 Risk Radar', desc: '3D Dependency Risk Map' },
  { id: 'skills', label: '🎯 Skill Matcher', desc: 'Optimal Task Assignment' },
  { id: 'retro', label: '📝 Retrospective', desc: 'Auto-Generated Sprint Reports' },
];

const SkillMatchPanel = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [teamProfile, setTeamProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [tasksRes, profileRes] = await Promise.all([
          api.get(`/tasks?projectId=${projectId}`),
          api.get(`/ai/team-skills/${projectId}`)
        ]);
        const td = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data.tasks || []);
        setTasks(td.filter(t => t.status !== 'Completed'));
        setTeamProfile(profileRes.data);
      } catch (e) {
        console.error('Failed to load skill data', e);
      }
    };
    load();
  }, [projectId]);

  const handleMatch = async (taskId) => {
    setLoading(true);
    setMatchResult(null);
    setSelectedTask(taskId);
    try {
      const res = await api.get(`/ai/skill-match/${taskId}`);
      setMatchResult(res.data);
    } catch (e) {
      setMatchResult({ error: 'Failed to compute match. Ensure team members have skills configured.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skill-panel">
      <div className="skill-left">
        <div className="skill-section-title">📋 Select a Task to Match</div>
        <div className="task-list">
          {tasks.length === 0 ? (
            <div className="empty-state">No active tasks found</div>
          ) : tasks.map(task => (
            <div
              key={task._id}
              className={`task-item ${selectedTask === task._id ? 'selected' : ''}`}
              onClick={() => handleMatch(task._id)}
            >
              <div className="task-item-title">{task.title}</div>
              <div className="task-item-meta">
                <span className={`priority-dot priority-${task.priority?.toLowerCase()}`} />
                {task.priority} · {task.estimatedEffort || 1} pts
                {task.requiredSkills?.length > 0 && (
                  <span className="skill-tags">
                    {task.requiredSkills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {teamProfile && (
          <div className="team-profile-box">
            <div className="skill-section-title">👥 Team Skill Profile</div>
            <div className="profile-stats">
              <span><strong>{teamProfile.teamSize}</strong> Members</span>
              <span><strong>{teamProfile.skillCoverage}</strong> Skills</span>
            </div>
            <div className="top-skills">
              {(teamProfile.topSkills || []).slice(0, 6).map(s => (
                <span key={s.skill} className="skill-tag-sm">
                  {s.skill} <em>{s.count}</em>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="skill-right">
        {loading && <div className="match-loading">🔍 Finding best match...</div>}

        {matchResult?.error && (
          <div className="match-error">{matchResult.error}</div>
        )}

        {matchResult && !matchResult.error && (
          <div className="match-result fade-in">
            <div className="match-task-title">{matchResult.taskTitle}</div>

            {matchResult.requiredSkills?.length > 0 && (
              <div className="required-skills">
                <strong>Required Skills:</strong>
                {matchResult.requiredSkills.map(s => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
              </div>
            )}

            <div className="recommendation-box">
              <div className="rec-text">{matchResult.recommendation}</div>
            </div>

            <div className="candidates-list">
              {(matchResult.candidates || []).map((c, i) => (
                <div key={c.userId} className={`candidate ${i === 0 ? 'top' : ''}`}>
                  <div className="candidate-header">
                    <span className="candidate-rank">{i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉'}</span>
                    <span className="candidate-name">{c.name}</span>
                    <span className="candidate-role">{c.role}</span>
                    <div className="candidate-score-bar">
                      <div className="score-fill" style={{ width: `${c.totalScore}%` }} />
                    </div>
                    <span className="score-num">{c.totalScore}%</span>
                  </div>
                  <div className="candidate-details">
                    <span>Skill Match: <strong style={{ color: '#48bb78' }}>{c.skillScore}%</strong></span>
                    <span>Availability: <strong style={{ color: '#63b3ed' }}>{c.workloadScore}%</strong></span>
                    <span>Active Tasks: <strong>{c.activeTaskCount}</strong></span>
                  </div>
                  {c.matchedSkills?.length > 0 && (
                    <div className="matched-skills">
                      ✅ {c.matchedSkills.join(', ')}
                    </div>
                  )}
                  {c.missingSkills?.length > 0 && (
                    <div className="missing-skills">
                      ⚠️ Missing: {c.missingSkills.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!matchResult && !loading && (
          <div className="match-placeholder">
            <div className="placeholder-icon">🎯</div>
            <h3>Select a task</h3>
            <p>Choose any active task to see AI-powered developer recommendations based on skills and workload.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const RetrospectivePanel = ({ projectId }) => {
  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [retro, setRetro] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/sprints?projectId=${projectId}`);
        const data = Array.isArray(res.data) ? res.data : (res.data.sprints || []);
        setSprints(data);
      } catch (e) { console.error('Failed to load sprints', e); }
    };
    load();
  }, [projectId]);

  const handleGenerate = async (sprintId) => {
    setLoading(true);
    setRetro(null);
    setSelectedSprint(sprintId);
    try {
      const res = await api.get(`/ai/retrospective/${sprintId}`);
      setRetro(res.data);
    } catch (e) {
      setRetro({ error: 'Failed to generate retrospective. Complete a sprint first.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="retro-panel">
      <div className="retro-left">
        <div className="skill-section-title">⚡ Select Sprint</div>
        <div className="task-list">
          {sprints.length === 0 ? (
            <div className="empty-state">No sprints found</div>
          ) : sprints.map(sprint => (
            <div
              key={sprint._id}
              className={`task-item ${selectedSprint === sprint._id ? 'selected' : ''}`}
              onClick={() => handleGenerate(sprint._id)}
            >
              <div className="task-item-title">{sprint.name}</div>
              <div className="task-item-meta">
                <span className={`status-pill ${sprint.status?.toLowerCase().replace(' ', '-')}`}>
                  {sprint.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="retro-right">
        {loading && <div className="match-loading">📝 Generating AI retrospective...</div>}
        {retro?.error && <div className="match-error">{retro.error}</div>}

        {retro && !retro.error && (
          <div className="retro-report fade-in">
            <div className="retro-report-header">
              <h3>📊 Sprint Retrospective</h3>
              <span className="retro-score">Health: {retro.overallHealth || 0}%</span>
            </div>

            {retro.summary && (
              <div className="retro-section">
                <h4>📌 Summary</h4>
                <p>{retro.summary}</p>
              </div>
            )}

            {retro.insights?.length > 0 && (
              <div className="retro-section">
                <h4>💡 Insights</h4>
                {retro.insights.map((ins, i) => (
                  <div key={i} className="retro-item insight">{ins}</div>
                ))}
              </div>
            )}

            {retro.recommendations?.length > 0 && (
              <div className="retro-section">
                <h4>🎯 Recommendations</h4>
                {retro.recommendations.map((rec, i) => (
                  <div key={i} className="retro-item recommendation">{rec}</div>
                ))}
              </div>
            )}

            {retro.velocity && (
              <div className="retro-section">
                <h4>📈 Velocity</h4>
                <div className="velocity-row">
                  <span>Planned: <strong>{retro.velocity.planned}</strong></span>
                  <span>Actual: <strong style={{ color: retro.velocity.actual >= retro.velocity.planned ? '#48bb78' : '#fc4c4c' }}>{retro.velocity.actual}</strong></span>
                  <span>Efficiency: <strong>{retro.velocity.efficiency}%</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        {!retro && !loading && (
          <div className="match-placeholder">
            <div className="placeholder-icon">📝</div>
            <h3>Select a sprint</h3>
            <p>The AI will automatically analyze velocity, task completion, and team performance to generate professional retrospective reports.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectIntelligence = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('oracle');
  const [project, setProject] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/projects/${projectId}`);
        setProject(res.data.project || res.data);
      } catch (e) { console.error('Failed to load project', e); }
    };
    if (projectId) load();
  }, [projectId]);

  return (
    <div className="intel-container fade-in">
      <div className="intel-header">
        <div>
          <h1>🧠 Project Intelligence</h1>
          <p>{project?.name || 'Loading...'} · AI-powered insights and analysis</p>
        </div>
        <Link to={`/projects/${projectId}`} className="btn btn-secondary">← Back</Link>
      </div>

      <div className="intel-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`intel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-label">{tab.label}</span>
            <span className="tab-desc">{tab.desc}</span>
          </button>
        ))}
      </div>

      <div className="intel-content">
        {activeTab === 'oracle' && <OracleChat projectId={projectId} projectName={project?.name} />}
        {activeTab === 'radar' && <RiskRadar3D projectId={projectId} />}
        {activeTab === 'skills' && <SkillMatchPanel projectId={projectId} />}
        {activeTab === 'retro' && <RetrospectivePanel projectId={projectId} />}
      </div>
    </div>
  );
};

export default ProjectIntelligence;

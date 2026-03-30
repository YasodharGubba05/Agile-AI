import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './RiskRadar3D.css';

/**
 * 3D Dependency Risk Radar
 *
 * An SVG force-directed graph that visualizes tasks as nodes in a risk landscape.
 * - Node size = estimated effort
 * - Node color = risk (priority + overdue status)
 * - Edges = dependency links
 * - Hover = task details tooltip
 */

const RISK_COLORS = {
  critical: '#fc4c4c',   // overdue + high priority
  high:     '#f6993f',   // high priority
  medium:   '#f6c90e',   // medium priority
  low:      '#48bb78',   // low priority / completed
  done:     '#2d3748',   // completed
};

const NODE_RADIUS_BASE = 24;

function getRiskColor(task) {
  if (task.status === 'Completed') return RISK_COLORS.done;
  const overdue = task.deadline && new Date(task.deadline) < new Date();
  if (overdue && task.priority === 'High') return RISK_COLORS.critical;
  if (task.priority === 'High') return RISK_COLORS.high;
  if (task.priority === 'Medium') return RISK_COLORS.medium;
  return RISK_COLORS.low;
}

function getRiskLabel(task) {
  if (task.status === 'Completed') return 'Done';
  const overdue = task.deadline && new Date(task.deadline) < new Date();
  if (overdue && task.priority === 'High') return '🔴 Critical';
  if (task.priority === 'High') return '🟠 High Risk';
  if (task.priority === 'Medium') return '🟡 Medium';
  return '🟢 Low Risk';
}

// Simple force-directed layout
function computeLayout(tasks, width, height) {
  const n = tasks.length;
  if (n === 0) return [];

  const positions = tasks.map((_, i) => {
    const angle = (2 * Math.PI * i) / n;
    const radius = Math.min(width, height) * 0.35;
    return {
      x: width / 2 + radius * Math.cos(angle),
      y: height / 2 + radius * Math.sin(angle),
    };
  });

  // Simulate a few iterations of force-directed
  for (let iter = 0; iter < 100; iter++) {
    for (let i = 0; i < n; i++) {
      let fx = 0, fy = 0;
      // Repulsion
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 4000 / (dist * dist);
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }
      // Gravity to center
      fx += (width / 2 - positions[i].x) * 0.01;
      fy += (height / 2 - positions[i].y) * 0.01;

      positions[i].x += fx * 0.1;
      positions[i].y += fy * 0.1;

      // Clamp to canvas
      const r = NODE_RADIUS_BASE + (tasks[i].estimatedEffort || 3) * 2;
      positions[i].x = Math.max(r + 10, Math.min(width - r - 10, positions[i].x));
      positions[i].y = Math.max(r + 10, Math.min(height - r - 10, positions[i].y));
    }
  }

  return positions;
}

const RiskRadar3D = ({ projectId }) => {
  const svgRef = useRef(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTask, setHoveredTask] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 900, height: 550 });

  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current) {
        const { width } = svgRef.current.getBoundingClientRect();
        setDimensions({ width: width || 900, height: 550 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get(`/tasks?projectId=${projectId}`);
        const data = Array.isArray(res.data) ? res.data : (res.data.tasks || []);
        setTasks(data);
      } catch (e) {
        console.error('Failed to load tasks for risk radar', e);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchTasks();
  }, [projectId]);

  const { width, height } = dimensions;
  const positions = computeLayout(tasks, width, height);

  const taskMap = {};
  tasks.forEach((t, i) => { taskMap[t._id] = i; });

  const handleMouseMove = (e, task) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({ x: e.clientX - rect.left + 14, y: e.clientY - rect.top - 10 });
    }
    setHoveredTask(task);
  };

  if (loading) {
    return <div className="radar-loading">Mapping dependencies...</div>;
  }

  if (tasks.length === 0) {
    return <div className="radar-empty">No tasks found. Add tasks to this project to visualize the risk radar.</div>;
  }

  return (
    <div className="radar-wrapper">
      <div className="radar-header">
        <h3>🌐 3D Dependency Risk Map</h3>
        <div className="radar-legend">
          {Object.entries(RISK_COLORS).map(([k, c]) => (
            <span key={k} className="legend-item">
              <span className="legend-dot" style={{ background: c }} />
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </span>
          ))}
        </div>
      </div>

      <div className="radar-canvas" style={{ position: 'relative' }}>
        <svg ref={svgRef} width="100%" height={height} className="radar-svg">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="bgGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(20,30,60,0.6)" />
              <stop offset="100%" stopColor="rgba(5,8,20,0.9)" />
            </radialGradient>
          </defs>

          <rect width="100%" height={height} fill="url(#bgGrad)" rx="16" />

          {/* Grid rings */}
          {[0.15, 0.28, 0.42].map((r, i) => (
            <ellipse
              key={i}
              cx={width / 2} cy={height / 2}
              rx={width * r} ry={height * r * 0.7}
              fill="none"
              stroke="rgba(99,179,237,0.06)"
              strokeWidth="1"
              strokeDasharray="5 8"
            />
          ))}

          {/* Dependency edges */}
          {tasks.map((task, i) => {
            const deps = task.dependencies || [];
            return deps.map(depId => {
              const j = taskMap[depId?.toString?.()];
              if (j === undefined || !positions[i] || !positions[j]) return null;
              return (
                <line
                  key={`${task._id}-${depId}`}
                  x1={positions[i].x} y1={positions[i].y}
                  x2={positions[j].x} y2={positions[j].y}
                  stroke="rgba(99,179,237,0.25)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              );
            });
          })}

          {/* Task nodes */}
          {tasks.map((task, i) => {
            if (!positions[i]) return null;
            const { x, y } = positions[i];
            const r = NODE_RADIUS_BASE + Math.min((task.estimatedEffort || 3) * 1.5, 18);
            const color = getRiskColor(task);
            const isHovered = hoveredTask?._id === task._id;

            return (
              <g key={task._id}
                onMouseMove={(e) => handleMouseMove(e, task)}
                onMouseLeave={() => setHoveredTask(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow ring */}
                <circle
                  cx={x} cy={y} r={isHovered ? r + 10 : r + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  opacity={isHovered ? 0.6 : 0.2}
                  style={{ transition: 'all 0.2s' }}
                  filter="url(#glow)"
                />
                {/* Main node */}
                <circle
                  cx={x} cy={y} r={isHovered ? r + 3 : r}
                  fill={color}
                  fillOpacity={task.status === 'Completed' ? 0.3 : 0.85}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                  style={{ transition: 'all 0.2s' }}
                  filter={task.priority === 'High' ? 'url(#glow)' : undefined}
                />
                {/* Label */}
                <text
                  x={x} y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={isHovered ? '11' : '10'}
                  fontWeight="600"
                  style={{ transition: 'all 0.2s', pointerEvents: 'none', userSelect: 'none' }}
                >
                  {task.title?.substring(0, 6) || '?'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredTask && (
          <div
            className="radar-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="tooltip-title">{hoveredTask.title}</div>
            <div className="tooltip-row"><span>Status</span><span>{hoveredTask.status}</span></div>
            <div className="tooltip-row"><span>Priority</span><span>{hoveredTask.priority}</span></div>
            <div className="tooltip-row"><span>Effort</span><span>{hoveredTask.estimatedEffort || 0} pts</span></div>
            {hoveredTask.deadline && (
              <div className="tooltip-row">
                <span>Deadline</span>
                <span style={{ color: new Date(hoveredTask.deadline) < new Date() && hoveredTask.status !== 'Completed' ? '#fc4c4c' : '#48bb78' }}>
                  {new Date(hoveredTask.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="tooltip-risk">{getRiskLabel(hoveredTask)}</div>
            {hoveredTask.dependencies?.length > 0 && (
              <div className="tooltip-row"><span>Deps</span><span>{hoveredTask.dependencies.length}</span></div>
            )}
          </div>
        )}
      </div>

      <div className="radar-stats">
        <div className="rstat">
          <span className="rstat-val" style={{ color: '#fc4c4c' }}>
            {tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'Completed').length}
          </span>
          <span>Overdue</span>
        </div>
        <div className="rstat">
          <span className="rstat-val" style={{ color: '#f6993f' }}>
            {tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length}
          </span>
          <span>High Risk</span>
        </div>
        <div className="rstat">
          <span className="rstat-val" style={{ color: '#63b3ed' }}>
            {tasks.filter(t => t.status === 'In Progress').length}
          </span>
          <span>In Progress</span>
        </div>
        <div className="rstat">
          <span className="rstat-val" style={{ color: '#48bb78' }}>
            {tasks.filter(t => t.status === 'Completed').length}
          </span>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
};

export default RiskRadar3D;

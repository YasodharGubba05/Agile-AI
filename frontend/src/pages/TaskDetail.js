import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const TaskDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data.task);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching task:', error);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await api.put(`/tasks/${id}`, { status: newStatus });
      fetchTask();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating task');
    } finally {
      setUpdating(false);
    }
  };

  const handleAcceptPriorityRecommendation = async (accept) => {
    try {
      await api.post(`/tasks/${id}/ai-priority`, { accept });
      fetchTask();
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing recommendation');
    }
  };

  if (loading) {
    return <div className="loading">Loading task...</div>;
  }

  if (!task) {
    return <div className="alert alert-error">Task not found</div>;
  }

  const canUpdate = user.role === 'PM' || 
    (user.role === 'Developer' && task.assignedTo?._id?.toString() === user.id);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>{task.title}</h1>
            <p>Project: {task.projectId?.name || 'N/A'} | Sprint: {task.sprintId?.name || 'No Sprint'}</p>
          </div>
          <Link to="/tasks" className="btn btn-secondary">Back</Link>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Task Details</div>
        <p><strong>Description:</strong> {task.description || 'No description'}</p>
        <p><strong>Status:</strong> <span className={`badge badge-${task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'info' : 'warning'}`}>{task.status}</span></p>
        <p><strong>Priority:</strong> <span className={`badge badge-${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'}`}>{task.priority}</span></p>
        <p><strong>Assigned To:</strong> {task.assignedTo?.name || 'Unassigned'}</p>
        <p><strong>Estimated Effort:</strong> {task.estimatedEffort} story points</p>
        <p><strong>Actual Effort:</strong> {task.actualEffort || 'Not logged'} story points</p>
        {task.deadline && (
          <p><strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}</p>
        )}
        <p><strong>Complexity:</strong> {task.complexity}</p>
        <p><strong>Dependencies:</strong> {task.dependencyCount || 0}</p>
        {task.bugCount > 0 && (
          <p><strong>Bug Count:</strong> {task.bugCount}</p>
        )}
      </div>

      {task.aiSuggestedPriority && !task.priorityAccepted && (
        <div className="card">
          <div className="ai-recommendation">
            <h4>AI Priority Recommendation</h4>
            <p style={{ marginBottom: '12px', fontSize: '14px' }}>
              Suggested Priority: <strong>{task.aiSuggestedPriority}</strong>
            </p>
            <div className="ai-recommendation-actions">
              <button
                onClick={() => handleAcceptPriorityRecommendation(true)}
                className="btn btn-success"
              >
                Accept
              </button>
              <button
                onClick={() => handleAcceptPriorityRecommendation(false)}
                className="btn btn-secondary"
              >
                Override
              </button>
            </div>
          </div>
        </div>
      )}

      {canUpdate && (
        <div className="card">
          <div className="card-header">Update Task</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {task.status !== 'To Do' && (
              <button
                onClick={() => handleStatusUpdate('To Do')}
                className="btn btn-secondary"
                disabled={updating}
              >
                Mark as To Do
              </button>
            )}
            {task.status !== 'In Progress' && (
              <button
                onClick={() => handleStatusUpdate('In Progress')}
                className="btn btn-info"
                disabled={updating}
              >
                Mark as In Progress
              </button>
            )}
            {task.status !== 'Completed' && (
              <button
                onClick={() => handleStatusUpdate('Completed')}
                className="btn btn-success"
                disabled={updating}
              >
                Mark as Completed
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;

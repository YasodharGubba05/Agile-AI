import React from 'react';
import './AIConfidenceIndicator.css';

const AIConfidenceIndicator = ({ confidence, label = 'AI Confidence' }) => {
  const confidencePercentage = Math.round(confidence * 100);
  const getConfidenceColor = () => {
    if (confidencePercentage >= 80) return 'high';
    if (confidencePercentage >= 60) return 'medium';
    return 'low';
  };

  return (
    <div className="ai-confidence-indicator">
      <div className="confidence-header">
        <span className="confidence-label">{label}</span>
        <span className={`confidence-value confidence-${getConfidenceColor()}`}>
          {confidencePercentage}%
        </span>
      </div>
      <div className="confidence-bar-container">
        <div 
          className={`confidence-bar-fill confidence-${getConfidenceColor()}`}
          style={{ width: `${confidencePercentage}%` }}
        />
      </div>
    </div>
  );
};

export default AIConfidenceIndicator;

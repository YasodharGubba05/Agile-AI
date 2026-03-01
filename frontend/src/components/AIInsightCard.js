import React from 'react';
import './AIInsightCard.css';

const AIInsightCard = ({ type, title, message, icon, confidence, actionable }) => {
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '💡';
    }
  };

  return (
    <div className={`ai-insight-card insight-${type}`}>
      <div className="insight-header">
        <span className="insight-icon">{getIcon()}</span>
        <div className="insight-title-group">
          <h4 className="insight-title">{title}</h4>
          {confidence && (
            <span className="insight-confidence">{confidence}% confidence</span>
          )}
        </div>
      </div>
      <p className="insight-message">{message}</p>
      {actionable && (
        <div className="insight-actions">
          {actionable}
        </div>
      )}
    </div>
  );
};

export default AIInsightCard;

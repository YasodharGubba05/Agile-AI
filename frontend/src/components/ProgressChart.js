import React from 'react';
import './ProgressChart.css';

const ProgressChart = ({ data, title, color = 'primary' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="progress-chart">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="chart-bars">
        {data.map((item, index) => (
          <div key={index} className="chart-bar-item">
            <div className="bar-label">{item.label}</div>
            <div className="bar-container">
              <div 
                className={`bar-fill bar-${color}`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              >
                <span className="bar-value">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressChart;

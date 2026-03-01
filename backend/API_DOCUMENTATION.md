# AgileAI AI API Documentation

## Overview

AgileAI provides AI-powered decision support for Agile project management. All AI recommendations require human approval (human-in-the-loop).

## Base URL

```
http://localhost:5001/api/ai
```

All endpoints require authentication (JWT token in Authorization header).

---

## 1. Sprint Capacity Prediction

**Endpoint:** `POST /api/ai/sprint-capacity`

**Model:** Linear Regression

**Purpose:** Predict sprint capacity to avoid overload

**Request Body:**
```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "plannedVelocity": 55,
  "teamSize": 5
}
```

**Response:**
```json
{
  "message": "Sprint capacity prediction completed",
  "predictedCapacity": 42,
  "plannedCapacity": 55,
  "overloadRisk": true,
  "overloadPercentage": 31,
  "confidence": "High",
  "confidenceScore": 0.85,
  "modelMetrics": {
    "rSquared": 0.78,
    "meanAbsoluteError": 3.2,
    "trainingSamples": 10
  },
  "featureImportance": {
    "teamSize": "30%",
    "numberOfTasks": "20%",
    "averageStoryPoints": "20%",
    "historicalVelocity": "30%"
  },
  "explanation": "🤖 AI Sprint Capacity Prediction\n\nMODEL: Linear Regression\n...",
  "modelType": "Linear Regression",
  "academicNotes": {
    "modelChoice": "Linear Regression chosen for interpretability",
    "strengths": "Fast, interpretable, works with limited data",
    "limitations": "Assumes linear relationships, sensitive to outliers"
  },
  "logId": "507f1f77bcf86cd799439012"
}
```

**Academic Justification:**
- Linear Regression chosen for interpretability
- Provides clear coefficients and feature importance
- Works well with small datasets
- Easy to explain to stakeholders

---

## 2. Project Risk Prediction

**Endpoint:** `GET /api/ai/project-risk/:projectId`

**Model:** Decision Tree Classifier (Rule-Based)

**Purpose:** Detect early warning signs of project failure

**Response:**
```json
{
  "message": "Risk prediction completed",
  "riskLevel": "High",
  "riskScore": 78,
  "explanation": "🌳 DECISION TREE RISK ANALYSIS\n\n...",
  "features": {
    "missedDeadlines": 25.5,
    "taskSpilloverRate": 45.0,
    "bugCount": 15,
    "velocityFluctuation": 32.1,
    "completionRate": 65.0,
    "sprintHealthAverage": 58.5
  },
  "topFactors": [
    "High missed deadlines",
    "Task spillover issues",
    "Velocity instability"
  ],
  "decisionPath": [
    "Checking missed deadlines...",
    "→ High missed deadlines (25.5%) → +15 risk points",
    "..."
  ],
  "modelType": "Decision Tree (Rule-Based)",
  "academicNotes": {
    "modelChoice": "Decision Tree chosen for interpretability",
    "strengths": "Clear decision rules, feature importance",
    "limitations": "Rule-based implementation"
  },
  "logId": "507f1f77bcf86cd799439013"
}
```

**Academic Justification:**
- Decision Tree chosen for explainability
- Provides clear decision paths
- Shows which factors contribute most to risk
- No black-box predictions

---

## 3. Task Priority Recommendation

**Endpoint:** `POST /api/tasks` (automatically includes AI recommendation)

**Model:** Rule-Based AI

**Purpose:** Suggest optimal task priorities

**Response (included in task creation):**
```json
{
  "task": { ... },
  "aiRecommendation": {
    "suggestedPriority": "High",
    "explanation": "Priority Score: 75/100\n\nFactors considered:\n- Deadline within 3 days\n- High complexity task\n...",
    "priorityScore": 75
  }
}
```

**Academic Justification:**
- Rule-based system for complete transparency
- No ML needed - clear scoring logic
- Easy to understand and modify

---

## 4. Sprint Retrospective Generation

**Endpoint:** `GET /api/ai/retrospective/:sprintId`

**Model:** Statistical + Template-Based

**Purpose:** Generate data-backed sprint insights

**Response:**
```json
{
  "message": "Retrospective generated successfully",
  "sprint": {
    "id": "...",
    "name": "Sprint 1",
    "projectName": "Project Alpha"
  },
  "metrics": {
    "plannedVelocity": 40,
    "actualVelocity": 32,
    "velocityDifference": -8,
    "completionRate": 75.5,
    "sprintHealthScore": 68
  },
  "insights": [
    {
      "type": "warning",
      "title": "Velocity Below Plan",
      "message": "Sprint velocity decreased by 8 story points..."
    }
  ],
  "recommendations": [
    {
      "category": "Planning",
      "recommendation": "Consider reducing sprint scope...",
      "priority": "High"
    }
  ],
  "generatedAt": "2024-01-15T10:30:00Z",
  "logId": "507f1f77bcf86cd799439014"
}
```

---

## 5. Team Productivity Analysis

**Endpoint:** `GET /api/ai/productivity/:projectId`

**Model:** Trend Analysis (Moving Averages)

**Purpose:** Identify productivity dips and burnout indicators

**Response:**
```json
{
  "message": "Productivity analysis completed",
  "productivityTrend": "Declining",
  "warning": true,
  "recommendation": "⚠️ Burnout indicators detected. Consider reducing workload...",
  "trends": {
    "velocity": {
      "direction": "Declining",
      "slope": -2.5,
      "change": "-2.5"
    },
    "completion": {
      "direction": "Stable",
      "slope": 0.3,
      "change": "+0.3"
    },
    "health": {
      "direction": "Declining",
      "slope": -1.8,
      "change": "-1.8"
    }
  },
  "dataPoints": 5,
  "modelType": "Trend Analysis (Moving Averages)",
  "academicNotes": {
    "modelChoice": "Trend analysis chosen for simplicity",
    "method": "Linear regression on moving averages",
    "strengths": "Simple, interpretable, reveals patterns"
  }
}
```

---

## 6. Evaluation Metrics

**Endpoint:** `GET /api/ai/metrics/:projectId`

**Purpose:** Get key performance indicators for AI system

**Response:**
```json
{
  "metrics": {
    "sprintPredictability": {
      "score": 78,
      "message": "Based on 5 sprints, 78% predictability",
      "averageDeviation": 0.22,
      "predictabilityPercentage": 78
    },
    "riskDetectionTiming": {
      "riskLevel": "Medium",
      "riskScore": 45,
      "earlyDetectionScore": 75,
      "detectedEarly": true
    },
    "velocityStability": {
      "score": 82,
      "message": "Velocity stability: 82%",
      "coefficientOfVariation": 18
    },
    "taskCompletionRate": {
      "rate": 85,
      "message": "42/50 tasks completed (85%)"
    },
    "overallScore": 80
  }
}
```

---

## 7. Human-in-the-Loop: Log Decision

**Endpoint:** `POST /api/ai/decision`

**Purpose:** Log human decision on AI recommendation

**Request Body:**
```json
{
  "logId": "507f1f77bcf86cd799439012",
  "decision": "Accepted",
  "overrideReason": null
}
```

**Or for override:**
```json
{
  "logId": "507f1f77bcf86cd799439012",
  "decision": "Overridden",
  "overrideReason": "Team capacity increased this sprint"
}
```

**Response:**
```json
{
  "message": "Human decision logged successfully",
  "logEntry": {
    "id": "...",
    "timestamp": "2024-01-15T10:00:00Z",
    "type": "sprint_capacity",
    "humanDecision": "Accepted",
    "decisionTimestamp": "2024-01-15T10:05:00Z"
  }
}
```

---

## 8. Human-in-the-Loop: Get Decision Logs

**Endpoint:** `GET /api/ai/decisions`

**Query Parameters:**
- `type` (optional): Filter by type (`sprint_capacity`, `risk_prediction`, `task_priority`, `retrospective`)
- `entityId` (optional): Filter by entity ID
- `decision` (optional): Filter by decision (`Accepted`, `Overridden`)

**Response:**
```json
{
  "logs": [
    {
      "id": "...",
      "timestamp": "2024-01-15T10:00:00Z",
      "type": "sprint_capacity",
      "aiSuggestion": { ... },
      "humanDecision": "Accepted",
      "decisionTimestamp": "2024-01-15T10:05:00Z"
    }
  ],
  "statistics": {
    "acceptanceRate": {
      "total": 25,
      "accepted": 18,
      "overridden": 7,
      "acceptanceRate": 72,
      "overrideRate": 28
    },
    "overrideAnalysis": {
      "totalOverrides": 7,
      "reasonsBreakdown": {
        "Team capacity increased": 3,
        "Different priorities": 2,
        "Other": 2
      },
      "mostCommonReason": "Team capacity increased"
    }
  }
}
```

---

## Error Responses

All endpoints may return:

**400 Bad Request:**
```json
{
  "message": "Missing required fields: projectId, plannedVelocity, teamSize"
}
```

**401 Unauthorized:**
```json
{
  "message": "No token, authorization denied"
}
```

**403 Forbidden:**
```json
{
  "message": "Access denied. Project Manager role required."
}
```

**500 Internal Server Error:**
```json
{
  "message": "Server error",
  "error": "Error details..."
}
```

---

## Authentication

All endpoints require JWT authentication:

```
Authorization: Bearer <token>
```

Most endpoints require PM (Project Manager) role.

---

## Human-in-the-Loop Enforcement

**CRITICAL:** All AI recommendations require explicit human approval:

1. AI generates recommendation → Returns `logId`
2. Human reviews recommendation
3. Human accepts or overrides → Call `/api/ai/decision` with `logId`
4. System logs decision for audit trail

**No AI action is auto-applied without human approval.**

---

## Model Documentation

### Linear Regression (Sprint Capacity)
- **Library:** ml-regression
- **Features:** teamSize, numberOfTasks, averageStoryPoints, historicalVelocity
- **Target:** actualVelocity
- **Explainability:** Feature weights shown, R² provided

### Decision Tree (Risk Prediction)
- **Implementation:** Rule-based (explicit if-then rules)
- **Features:** missedDeadlines, taskSpilloverRate, bugCount, velocityFluctuation, etc.
- **Output:** Low/Medium/High risk
- **Explainability:** Full decision path provided

### Rule-Based (Task Priority)
- **Implementation:** Scoring algorithm
- **Features:** Deadline proximity, complexity, dependencies, effort
- **Output:** High/Medium/Low priority
- **Explainability:** Score breakdown provided

### Trend Analysis (Productivity)
- **Method:** Moving averages + linear regression
- **Features:** Velocity, completion rate, sprint health over time
- **Output:** Improving/Stable/Declining trend
- **Explainability:** Trend direction and slope provided

---

## Academic Notes

All models include:
- **Model choice justification**
- **Strengths and limitations**
- **Explainability features**
- **Performance metrics**

This ensures transparency and supports academic evaluation.

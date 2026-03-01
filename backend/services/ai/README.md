# AI Services Documentation

## Overview

This directory contains all AI/ML services for AgileAI. All services follow the principles of:
- **Explainability**: Every prediction includes explanation
- **Interpretability**: Models are simple and understandable
- **Human-in-the-Loop**: No auto-application of AI decisions
- **Academic Rigor**: Models include justification and limitations

---

## Services

### 1. sprintCapacityService.js

**Model:** Linear Regression  
**Purpose:** Predict sprint capacity to avoid overload

**Key Features:**
- Uses historical sprint data
- Generates synthetic data if insufficient real data
- Provides confidence scores
- Includes model metrics (R², MAE)
- Feature importance breakdown

**Academic Notes:**
- Chosen for interpretability
- Fast training and prediction
- Works with limited data
- Assumes linear relationships

---

### 2. riskPredictionService.js

**Model:** Decision Tree Classifier (Rule-Based)  
**Purpose:** Detect project risks early

**Key Features:**
- Explicit decision tree rules
- Full decision path explanation
- Top contributing factors
- Feature importance

**Academic Notes:**
- Chosen for explainability
- Clear if-then rules
- No black-box predictions
- Rule-based implementation (not full tree learning)

---

### 3. taskPriorityService.js

**Model:** Rule-Based AI  
**Purpose:** Suggest task priorities

**Key Features:**
- Scoring algorithm
- Multiple factors considered
- Clear score breakdown
- No ML needed

**Academic Notes:**
- Complete transparency
- Easy to understand and modify
- No assumptions about data

---

### 4. retrospectiveService.js

**Model:** Statistical + Template-Based  
**Purpose:** Generate sprint insights

**Key Features:**
- Compares planned vs actual
- Statistical analysis
- Template-based insights
- Actionable recommendations

**Academic Notes:**
- No ML needed
- Statistical methods sufficient
- Clear and interpretable

---

### 5. productivityService.js

**Model:** Trend Analysis (Moving Averages)  
**Purpose:** Detect productivity trends and burnout

**Key Features:**
- Moving averages for smoothing
- Slope analysis for trends
- Burnout detection
- Trend direction indicators

**Academic Notes:**
- Simple and interpretable
- Fast computation
- Works with time-series data
- Assumes linear trends

---

### 6. humanInTheLoopService.js

**Purpose:** Log AI recommendations and human decisions

**Key Features:**
- Tracks all AI recommendations
- Logs human accept/override decisions
- Calculates acceptance rates
- Analyzes override reasons

**Academic Notes:**
- Critical for explainable AI
- Enables audit trail
- Supports research on human-AI collaboration

---

### 7. evaluationMetricsService.js

**Purpose:** Calculate KPIs for AI system evaluation

**Key Features:**
- Sprint predictability
- Risk detection timing
- Velocity stability
- Task completion rates

**Academic Notes:**
- Essential for system evaluation
- Provides quantitative metrics
- Enables comparison with baselines

---

## Model Selection Criteria

All models were chosen based on:

1. **Interpretability** > Accuracy
2. **Explainability** > Performance
3. **Simplicity** > Complexity
4. **Transparency** > Black-box

---

## Data Requirements

### Minimum Data Requirements:

- **Sprint Capacity:** 3+ completed sprints (or synthetic data)
- **Risk Prediction:** 1+ sprint with tasks
- **Task Priority:** No minimum (rule-based)
- **Retrospective:** 1 completed sprint
- **Productivity:** 3+ completed sprints

---

## Synthetic Data Generation

When insufficient real data exists:
- `sprintCapacityService` generates synthetic training data
- Based on team size and realistic patterns
- Clearly marked as synthetic
- Used only for training, not evaluation

---

## Human-in-the-Loop Flow

1. **AI generates recommendation** → Logged with `logId`
2. **Human reviews** → Sees explanation and confidence
3. **Human decides** → Accept or Override
4. **Decision logged** → Stored for analysis
5. **No auto-application** → All changes require human approval

---

## Performance Metrics

All models provide:
- **Confidence scores** (High/Medium/Low)
- **Model fit metrics** (R², MAE where applicable)
- **Feature importance** (where applicable)
- **Explanation** (plain English)

---

## Academic Evaluation Support

Each service includes:
- **Model choice justification**
- **Strengths and limitations**
- **Explainability features**
- **Performance metrics**
- **Academic notes in responses**

This ensures the system is suitable for academic evaluation and research.

---

## Future Enhancements

Potential improvements (not implemented):
- Full Decision Tree learning algorithm
- Multi-feature Linear Regression
- Time-series forecasting
- Ensemble methods (with explanation)

All enhancements must maintain explainability and human-in-the-loop principles.

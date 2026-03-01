# AgileAI Backend

Backend server for AgileAI - AI-assisted Agile Project Management Platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/agileai
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   NODE_ENV=development
   ```

3. Start MongoDB (if running locally)

4. Run the server:
   ```bash
   npm run dev
   ```

## API Documentation

See main README.md for API endpoint documentation.

## AI Services

- `services/ai/sprintCapacityService.js` - Linear Regression for sprint capacity prediction
- `services/ai/riskPredictionService.js` - Decision Tree for risk assessment
- `services/ai/taskPriorityService.js` - Rule-based task priority recommendation
- `services/ai/retrospectiveService.js` - Sprint retrospective generation
- `services/ai/productivityService.js` - Team productivity and burnout analysis
- `services/ai/humanInTheLoopService.js` - Human decision logging
- `services/ai/evaluationMetricsService.js` - Evaluation metrics calculation
- `services/ai/riskPredictionService.js` - Decision Tree for risk assessment
- `services/ai/taskPriorityService.js` - Rule-based task priority recommendation
- `services/ai/retrospectiveService.js` - Sprint retrospective generation

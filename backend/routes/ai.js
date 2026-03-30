const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { auth, requirePM } = require('../middleware/auth');

/**
 * AI API Routes
 * 
 * All routes require authentication
 * Most routes require PM role
 */

// Sprint Capacity Prediction (Linear Regression)
router.post('/sprint-capacity', auth, requirePM, aiController.predictSprintCapacity);

// Project Risk Prediction (Decision Tree)
router.get('/risk/:projectId', auth, requirePM, aiController.predictProjectRisk);

// Sprint Retrospective Generation
router.get('/retrospective/:sprintId', auth, requirePM, aiController.generateRetrospective);

// Team Productivity Analysis
router.get('/productivity/:projectId', auth, requirePM, aiController.analyzeProductivity);

// Velocity Forecasting
router.get('/forecast/:projectId', auth, requirePM, aiController.forecastVelocity);

// Workload Balancing
router.get('/workload/:projectId', auth, requirePM, aiController.getWorkloadBalance);

// Dashboard Summary
router.get('/dashboard-summary/:projectId', auth, requirePM, aiController.getDashboardSummary);

// Evaluation Metrics
router.get('/metrics/:projectId', auth, requirePM, aiController.getEvaluationMetrics);

// Human-in-the-Loop: Log human decision
router.post('/decision', auth, aiController.logHumanDecision);

// Human-in-the-Loop: Get decision logs
router.get('/decisions', auth, requirePM, aiController.getDecisionLogs);

// AI Project Oracle — natural language project queries
router.post('/oracle/:projectId', auth, aiController.queryOracle);

// Skill-Based Task Matching — recommend best developer for a task
router.get('/skill-match/:taskId', auth, requirePM, aiController.getSkillMatch);

// Team Skill Profile — get skill landscape for entire team
router.get('/team-skills/:projectId', auth, requirePM, aiController.getTeamSkillProfile);

module.exports = router;

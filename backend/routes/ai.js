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

// Evaluation Metrics
router.get('/metrics/:projectId', auth, requirePM, aiController.getEvaluationMetrics);

// Human-in-the-Loop: Log human decision
router.post('/decision', auth, aiController.logHumanDecision);

// Human-in-the-Loop: Get decision logs
router.get('/decisions', auth, requirePM, aiController.getDecisionLogs);

module.exports = router;

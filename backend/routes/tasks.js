const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { auth, requirePM } = require('../middleware/auth');

router.post('/', auth, requirePM, taskController.createTask);
router.get('/', auth, taskController.getTasks);
router.get('/:id', auth, taskController.getTaskById);
router.put('/:id', auth, taskController.updateTask);
router.delete('/:id', auth, requirePM, taskController.deleteTask);
router.post('/:taskId/ai-priority', auth, taskController.acceptPriorityRecommendation);

module.exports = router;

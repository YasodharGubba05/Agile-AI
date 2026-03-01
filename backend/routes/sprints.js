const express = require('express');
const router = express.Router();
const sprintController = require('../controllers/sprintController');
const { auth, requirePM } = require('../middleware/auth');

router.post('/', auth, requirePM, sprintController.createSprint);
router.get('/', auth, sprintController.getSprints);
router.get('/:id', auth, sprintController.getSprintById);
router.put('/:id', auth, requirePM, sprintController.updateSprint);
router.post('/:id/complete', auth, requirePM, sprintController.completeSprint);
router.post('/:sprintId/ai-recommendation', auth, requirePM, sprintController.acceptAIRecommendation);

module.exports = router;

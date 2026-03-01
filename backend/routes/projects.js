const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth, requirePM } = require('../middleware/auth');

router.post('/', auth, requirePM, projectController.createProject);
router.get('/', auth, projectController.getProjects);
router.get('/:id', auth, projectController.getProjectById);
router.put('/:id', auth, requirePM, projectController.updateProject);
router.delete('/:id', auth, requirePM, projectController.deleteProject);

module.exports = router;

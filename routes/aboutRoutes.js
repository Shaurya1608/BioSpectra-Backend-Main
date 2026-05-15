const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');
const { protect, requireElevatedSession } = require('../controllers/authController');

// Public
router.get('/', aboutController.getAllSections);

// Protected (admin only + MFA Elevation)
router.post('/', protect, requireElevatedSession, aboutController.createSection);
router.put('/:id', protect, requireElevatedSession, aboutController.updateSection);
router.delete('/:id', protect, requireElevatedSession, aboutController.deleteSection);
router.post('/bulk', protect, requireElevatedSession, aboutController.bulkCreate);

module.exports = router;

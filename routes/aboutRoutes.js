const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');
const { protect } = require('../controllers/authController');

// Public
router.get('/', aboutController.getAllSections);

// Protected (admin only)
router.post('/', protect, aboutController.createSection);
router.put('/:id', protect, aboutController.updateSection);
router.delete('/:id', protect, aboutController.deleteSection);
router.post('/bulk', protect, aboutController.bulkCreate);

module.exports = router;

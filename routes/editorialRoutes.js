const express = require('express');
const router = express.Router();
const editorialController = require('../controllers/editorialController');
const { protect, requireElevatedSession } = require('../controllers/authController');

// Public
router.get('/', editorialController.getAllMembers);

// Protected (admin only + MFA Elevation)
router.post('/', protect, requireElevatedSession, editorialController.createMember);
router.put('/:id', protect, requireElevatedSession, editorialController.updateMember);
router.delete('/:id', protect, requireElevatedSession, editorialController.deleteMember);
router.post('/bulk', protect, requireElevatedSession, editorialController.bulkCreate);

module.exports = router;

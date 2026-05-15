const express = require('express');
const router = express.Router();
const editorialController = require('../controllers/editorialController');
const { protect } = require('../controllers/authController');

// Public
router.get('/', editorialController.getAllMembers);

// Protected (admin only)
router.post('/', protect, editorialController.createMember);
router.put('/:id', protect, editorialController.updateMember);
router.delete('/:id', protect, editorialController.deleteMember);
router.post('/bulk', protect, editorialController.bulkCreate);

module.exports = router;

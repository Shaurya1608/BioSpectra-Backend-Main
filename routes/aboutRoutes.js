const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');

router.get('/', aboutController.getAllSections);
router.post('/', aboutController.createSection);
router.put('/:id', aboutController.updateSection);
router.delete('/:id', aboutController.deleteSection);
router.post('/bulk', aboutController.bulkCreate);

module.exports = router;

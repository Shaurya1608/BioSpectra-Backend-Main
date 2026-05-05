const express = require('express');
const router = express.Router();
const editorialController = require('../controllers/editorialController');

router.get('/', editorialController.getAllMembers);
router.post('/', editorialController.createMember);
router.put('/:id', editorialController.updateMember);
router.delete('/:id', editorialController.deleteMember);
router.post('/bulk', editorialController.bulkCreate);

module.exports = router;

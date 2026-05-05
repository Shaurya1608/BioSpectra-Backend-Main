const express = require('express');
const router = express.Router();
const multer = require('multer');
const contactController = require('../controllers/contactController');

// Configure multer to store files in memory as buffers
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// POST /api/contact
router.post('/', upload.single('file'), contactController.submitContactForm);

module.exports = router;

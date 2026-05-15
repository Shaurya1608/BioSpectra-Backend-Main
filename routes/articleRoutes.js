const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { upload } = require('../config/cloudinary');
const { protect, requireElevatedSession } = require('../controllers/authController');

// Public routes (anyone can read)
router.get('/tree', articleController.getJournalTree);
router.get('/latest', articleController.getLatestArticles);
router.get('/category/:categoryId', articleController.getArticlesByCategory);
router.get('/:id', articleController.getArticleById);

// Protected routes (admin only + MFA Elevation)
router.post('/upload', protect, requireElevatedSession, upload.single('file'), articleController.uploadArticle);
router.post('/init-year', protect, requireElevatedSession, articleController.initYear);
router.post('/category', protect, requireElevatedSession, articleController.createCategory);
router.put('/:id', protect, requireElevatedSession, articleController.updateArticle);
router.delete('/:id', protect, requireElevatedSession, articleController.deleteArticle);
router.delete('/category/:id', protect, requireElevatedSession, articleController.deleteCategory);
router.delete('/year/:id', protect, requireElevatedSession, articleController.deleteYear);

module.exports = router;

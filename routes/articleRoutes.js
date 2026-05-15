const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { upload } = require('../config/cloudinary');
const { protect } = require('../controllers/authController');

// Public routes (anyone can read)
router.get('/tree', articleController.getJournalTree);
router.get('/latest', articleController.getLatestArticles);
router.get('/category/:categoryId', articleController.getArticlesByCategory);
router.get('/:id', articleController.getArticleById);

// Protected routes (admin only)
router.post('/upload', protect, upload.single('file'), articleController.uploadArticle);
router.post('/init-year', protect, articleController.initYear);
router.post('/category', protect, articleController.createCategory);
router.put('/:id', protect, articleController.updateArticle);
router.delete('/:id', protect, articleController.deleteArticle);
router.delete('/category/:id', protect, articleController.deleteCategory);
router.delete('/year/:id', protect, articleController.deleteYear);

module.exports = router;

const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { upload } = require('../config/cloudinary');

router.post('/upload', upload.single('file'), articleController.uploadArticle);
router.get('/tree', articleController.getJournalTree);
router.post('/init-year', articleController.initYear);
router.post('/category', articleController.createCategory);

router.get('/latest', articleController.getLatestArticles);
router.get('/category/:categoryId', articleController.getArticlesByCategory);
router.get('/:id', articleController.getArticleById);
router.put('/:id', articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);
router.delete('/category/:id', articleController.deleteCategory);

module.exports = router;

const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { protect } = require('../controllers/authController');

// Public (read)
router.get('/years', journalController.getYears);
router.get('/years/:yearId/issues', journalController.getIssuesByYear);
router.get('/issues/:issueId/categories', journalController.getCategoriesByIssue);
router.get('/categories/:categoryId/topics', journalController.getTopicsByCategory);
router.get('/tree', journalController.getFullJournalTree);
router.get('/issue/:year/:order', journalController.getIssueData);

// Protected (admin only)
router.post('/years', protect, journalController.createYear);
router.post('/categories', protect, journalController.createCategory);
router.post('/topics', protect, journalController.createTopic);

module.exports = router;

const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');

// Years
router.post('/years', journalController.createYear);
router.get('/years', journalController.getYears);

// Issues
router.get('/years/:yearId/issues', journalController.getIssuesByYear);

// Categories (Content)
router.post('/categories', journalController.createCategory);
router.get('/issues/:issueId/categories', journalController.getCategoriesByIssue);

// Topics
router.post('/topics', journalController.createTopic);
router.get('/categories/:categoryId/topics', journalController.getTopicsByCategory);

// Full Tree
router.get('/tree', journalController.getFullJournalTree);

// Single Issue Data (fast — only fetches the requested issue)
router.get('/issue/:year/:order', journalController.getIssueData);

module.exports = router;

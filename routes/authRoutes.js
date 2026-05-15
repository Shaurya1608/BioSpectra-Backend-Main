const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/login-mfa', authController.loginMfa);

// Protected routes (require login first)
router.get('/mfa-setup', authController.protect, authController.setupMfa);
router.post('/mfa-verify', authController.protect, authController.verifyMfaSetup);

// Session Management (Audit Log)
router.get('/sessions', authController.protect, authController.getSessions);
router.delete('/sessions/:sessionId', authController.protect, authController.terminateSession);
router.post('/logout', authController.protect, authController.logout);

module.exports = router;

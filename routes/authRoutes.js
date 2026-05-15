const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('../config/passport');

router.post('/login', authController.login);
router.post('/login-mfa', authController.loginMfa);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback
);

// Protected routes (require login first)
router.get('/mfa-setup', authController.protect, authController.setupMfa);
router.post('/mfa-verify', authController.protect, authController.verifyMfaSetup);

// Session Management (Audit Log)
router.get('/sessions', authController.protect, authController.getSessions);
router.delete('/sessions/:sessionId', authController.protect, authController.terminateSession);
router.post('/logout', authController.protect, authController.logout);

module.exports = router;

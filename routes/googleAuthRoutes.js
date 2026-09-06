// routes/googleAuthRoutes.js
const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Initiate Google OAuth login -> GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback -> GET /api/auth/google/callback
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      if (err || !user) {
        console.error('Google OAuth authentication failed:', err || info);
        return res.redirect(`${frontendUrl}/login?error=google_failed`);
      }
      // Successful authentication, issue complete JWT
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '1d' }
      );
      // Encode the token when placing it in the URL to avoid truncation
      const redirectUrl = `${frontendUrl}/google-callback?token=${encodeURIComponent(token)}`;
      res.redirect(redirectUrl);
    })(req, res, next);
  }
);

module.exports = router;

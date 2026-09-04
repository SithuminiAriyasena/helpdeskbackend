const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../config/db');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'missing_client_id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing_client_secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    if (!email) {
      return done(new Error('No email associated with this Google account'), null);
    }
    const googleId = profile.id;
    const displayName = profile.displayName || email.split('@')[0];

    // 1. Check if user exists by google_id
    let [rows] = [];
    try {
      [rows] = await db.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
    } catch (err) {
      // In case google_id column is not yet created, attempt safe ALTER TABLE
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        try {
          await db.query('ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL');
          await db.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL');
          [rows] = await db.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
        } catch (alterErr) {
          console.error('Migration error:', alterErr);
        }
      } else {
        throw err;
      }
    }

    let user;
    if (rows && rows.length > 0) {
      user = rows[0];
      return done(null, user);
    }

    // 2. Check if user exists by email
    const [emailRows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (emailRows.length > 0) {
      // Existing user found: link Google account to preserve user id, password, and role
      user = emailRows[0];
      try {
        await db.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
      } catch (updateErr) {
        console.error('Error linking google_id:', updateErr);
      }
      return done(null, user);
    }

    // 3. User does not exist: create new user with default role 'user'
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, google_id, role) VALUES (?, ?, ?, ?, ?)',
      [displayName, email, null, googleId, 'user']
    );
    const [newUserRows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    user = newUserRows[0];
    return done(null, user);
  } catch (err) {
    console.error('Google OAuth strategy error:', err);
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
    if (rows.length > 0) {
      done(null, rows[0]);
    } else {
      done(new Error('User not found'), null);
    }
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('../db');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT id, name, email, avatar_url FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await db.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
      if (user.rows.length) return done(null, user.rows[0]);

      const email = profile.emails[0].value;
      user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (user.rows.length) {
        await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [profile.id, user.rows[0].id]);
        return done(null, user.rows[0]);
      }

      const result = await db.query(
        `INSERT INTO users (name, email, google_id, avatar_url, role)
         VALUES ($1, $2, $3, $4, 'customer') RETURNING *`,
        [profile.displayName, email, profile.id, profile.photos[0]?.value || null]
      );
      return done(null, result.rows[0]);
    } catch (err) {
      console.error('Google OAuth error:', err);
      return done(err);
    }
  }
));

// Facebook Strategy (with email scope)
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'emails', 'photos']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await db.query('SELECT * FROM users WHERE facebook_id = $1', [profile.id]);
      if (user.rows.length) return done(null, user.rows[0]);

      let email = null;
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      } else {
        // Fallback: create a unique email based on facebook id
        email = `${profile.id}@facebook.user`;
      }

      user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (user.rows.length) {
        await db.query('UPDATE users SET facebook_id = $1 WHERE id = $2', [profile.id, user.rows[0].id]);
        return done(null, user.rows[0]);
      }

      const result = await db.query(
        `INSERT INTO users (name, email, facebook_id, avatar_url, role)
         VALUES ($1, $2, $3, $4, 'customer') RETURNING *`,
        [profile.displayName, email, profile.id, profile.photos[0]?.value || null]
      );
      return done(null, result.rows[0]);
    } catch (err) {
      console.error('Facebook OAuth error:', err);
      return done(err);
    }
  }
));

module.exports = passport;
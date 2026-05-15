const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in our db
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ]
      });

      if (user) {
        // Update googleId if not present (matched by email)
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      // If not, create a new user in our db
      // Note: By default, we might want to restrict this to specific emails 
      // or set a default role. For an Admin panel, we should be careful.
      
      // For now, let's allow it but you might want to restrict to ADMIN_EMAIL
      if (profile.emails[0].value !== process.env.ADMIN_EMAIL) {
        return done(null, false, { message: 'Unauthorized email' });
      }

      user = await User.create({
        googleId: profile.id,
        username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
        email: profile.emails[0].value,
        role: 'admin',
        isMfaEnabled: false
      });

      return done(null, user);
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }
));

// We don't really need serialize/deserialize if we use JWT, 
// but passport expects them if we use sessions.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;

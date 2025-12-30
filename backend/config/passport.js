const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
            passReqToCallback: true // Enable access to req in callback
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                // Get role from state parameter (passed via query)
                const desiredRole = req.query.state || 'customer';
                const validRoles = ['customer', 'seller'];
                const role = validRoles.includes(desiredRole) ? desiredRole : 'customer';

                // Check if user already exists
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    // User exists, return user
                    return done(null, user);
                }

                // Check if user with same email exists
                user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // Link Google account to existing user
                    user.googleId = profile.id;
                    await user.save();
                    return done(null, user);
                }

                // Create new user with selected role
                user = new User({
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    role: role, // Use role from query parameter
                    status: 'active',
                    isVerified: true // Google accounts are pre-verified
                });

                await user.save();

                // If seller, create seller profile
                if (role === 'seller') {
                    const SellerProfile = require('../models/SellerProfile');
                    await SellerProfile.create({
                        userId: user._id,
                        storeName: profile.displayName || 'My Store',
                        approvalStatus: 'pending'
                    });
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;

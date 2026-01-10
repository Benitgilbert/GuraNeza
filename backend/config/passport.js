const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const fs = require('fs');
const path = require('path');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
            passReqToCallback: true // Enable access to req in callback
        },
        async (req, accessToken, refreshToken, profile, done) => {
            const logFile = path.join(__dirname, '../auth_debug.log');
            const log = (msg) => fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);

            try {
                // Get role from state parameter (passed via query)
                let desiredRole = req.query.state || 'customer';

                log(`------------ GOOGLE AUTH DEBUG ------------`);
                log(`1. Callback Query: ${JSON.stringify(req.query)}`);
                log(`2. Raw State: ${req.query.state}`);
                log(`3. Desired Role (Initial): ${desiredRole}`);

                // Decode state if it looks encoded (simple check)
                if (desiredRole.includes('%')) {
                    try {
                        desiredRole = decodeURIComponent(desiredRole);
                        console.log('4. Decoded Role:', desiredRole);
                    } catch (e) {
                        console.log('4. Decoding Failed:', e.message);
                    }
                }

                const validRoles = ['customer', 'seller'];
                const role = validRoles.includes(desiredRole) ? desiredRole : 'customer';
                console.log('5. Final Role to Apply:', role);

                // Check if user already exists
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    console.log('6. User found by Google ID:', user._id);
                    console.log('   Current Role:', user.role);

                    // Upgrade role if user requested seller but is currently customer
                    if (role === 'seller' && user.role === 'customer') {
                        console.log('   -> Upgrading existing customer to seller...');
                        user.role = 'seller';
                        await user.save();

                        const SellerProfile = require('../models/SellerProfile');
                        const existingProfile = await SellerProfile.findOne({ userId: user._id });
                        if (!existingProfile) {
                            console.log('   -> Creating missing SellerProfile...');
                            await SellerProfile.create({
                                userId: user._id,
                                storeName: 'My Store',
                                approvalStatus: 'pending'
                            });
                        }
                    }
                    return done(null, user);
                }

                // Check if user with same email exists
                user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    console.log('7. User found by Email:', user._id);
                    console.log('   Current Role:', user.role);

                    // Link Google account to existing user
                    user.googleId = profile.id;

                    // Upgrade role if user requested seller but is currently customer
                    if (role === 'seller' && user.role === 'customer') {
                        console.log('   -> Upgrading existing customer (by email) to seller...');
                        user.role = 'seller';

                        const SellerProfile = require('../models/SellerProfile');
                        const existingProfile = await SellerProfile.findOne({ userId: user._id });
                        if (!existingProfile) {
                            console.log('   -> Creating missing SellerProfile...');
                            await SellerProfile.create({
                                userId: user._id,
                                storeName: 'My Store',
                                approvalStatus: 'pending'
                            });
                        }
                    }

                    await user.save();
                    return done(null, user);
                }

                console.log('8. Creating NEW User with role:', role);
                // Create new user with selected role
                user = new User({
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    role: role,
                    status: 'active',
                    isVerified: true // Google accounts are pre-verified
                });

                await user.save();
                console.log('   -> User created:', user._id);

                // If seller, create seller profile
                if (role === 'seller') {
                    console.log('   -> Creating SellerProfile for new user...');
                    const SellerProfile = require('../models/SellerProfile');
                    await SellerProfile.create({
                        userId: user._id,
                        storeName: profile.displayName || 'My Store',
                        approvalStatus: 'pending'
                    });
                }

                console.log('-------------------------------------------');
                return done(null, user);
            } catch (error) {
                console.error('Google Auth Error:', error);
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

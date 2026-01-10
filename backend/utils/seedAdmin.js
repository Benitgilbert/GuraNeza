const User = require('../models/User');

/**
 * Seed default admin user
 */
const seedAdmin = async () => {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({
            email: process.env.DEFAULT_ADMIN_EMAIL
        });

        if (adminExists) {
            console.log('ℹ️  Default admin user already exists');
            return;
        }

        // Create default admin
        const admin = new User({
            email: process.env.DEFAULT_ADMIN_EMAIL || 'byiringirobenit@gmail.com',
            password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123',
            role: 'admin',
            status: 'active',
            isVerified: true
        });

        await admin.save();
        console.log('✅ Default admin user created successfully');
        console.log(`📧 Email: ${admin.email}`);
        console.log('🔒 Password: (check .env file)');
    } catch (error) {
        console.error('❌ Error seeding admin user:', error.message);
    }
};

module.exports = seedAdmin;

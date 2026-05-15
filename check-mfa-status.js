const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkMfa = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ username: 'biospec@123' });
        if (!admin) {
            console.log('Admin user not found');
        } else {
            console.log(`Admin user: ${admin.username}`);
            console.log(`MFA Enabled: ${admin.isMfaEnabled}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkMfa();

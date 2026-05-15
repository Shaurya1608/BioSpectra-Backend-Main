const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const newUsername = 'biospec@123';
        const newPassword = 'biospec098@123';

        // 1. Find existing admin (assuming it's the only user or username is 'admin')
        let admin = await User.findOne({ username: 'admin' });
        
        if (admin) {
            console.log('Found existing "admin" user. Updating...');
            admin.username = newUsername;
            admin.password = newPassword;
            await admin.save();
            console.log('Admin updated successfully!');
        } else {
            // Check if it's already updated
            const exists = await User.findOne({ username: newUsername });
            if (exists) {
                console.log('Admin already updated to new credentials.');
                process.exit(0);
            }
            
            console.log('No user with username "admin" found. Creating new admin...');
            admin = new User({
                username: newUsername,
                password: newPassword
            });
            await admin.save();
            console.log('New admin created successfully!');
        }

        console.log('---------------------------');
        console.log('NEW CREDENTIALS:');
        console.log(`Username: ${newUsername}`);
        console.log(`Password: ${newPassword}`);
        console.log('---------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('Error updating admin:', error);
        process.exit(1);
    }
};

updateAdmin();

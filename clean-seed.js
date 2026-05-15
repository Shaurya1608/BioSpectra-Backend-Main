const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const cleanSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // DELETE ALL USERS FIRST to avoid any conflicts
        await User.deleteMany({});
        console.log('Cleared all existing users.');

        const username = 'biospec@123';
        const password = 'biospec098@123';

        const admin = new User({
            username,
            password
        });

        await admin.save();
        console.log('---------------------------');
        console.log('ADMIN CREATED SUCCESSFULLY');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log('---------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

cleanSeed();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const username = 'admin';
        const password = 'password123'; // User should change this immediately

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        const admin = new User({
            username,
            password
        });

        await admin.save();
        console.log('Admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: password123');
        console.log('IMPORTANT: Change your password after first login!');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();

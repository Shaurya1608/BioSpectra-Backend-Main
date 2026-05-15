const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkAllUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'username isMfaEnabled');
        console.log('--- User MFA Status ---');
        users.forEach(u => {
            console.log(`User: ${u.username}, MFA Enabled: ${u.isMfaEnabled}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAllUsers();

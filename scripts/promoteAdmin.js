require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const emailToPromote = process.argv[2] || 'biospectra2006@gmail.com';

const promote = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const user = await User.findOne({ email: emailToPromote });

    if (!user) {
      console.log(`User with email ${emailToPromote} not found.`);
      console.log('Please log in once with Google first to create the account, then run this script.');
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`Successfully promoted ${emailToPromote} to ADMIN!`);
    process.exit(0);
  } catch (err) {
    console.error('Error promoting user:', err);
    process.exit(1);
  }
};

promote();

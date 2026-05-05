const mongoose = require('mongoose');
require('dotenv').config();
const Article = require('../models/Article');
const Issue = require('../models/Issue');
const Year = require('../models/Year');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    let yearDoc = await Year.findOne({ year: 2020 });
    let issueDoc = await Issue.findOne({ year: yearDoc._id, title: 'March Issue' });
    
    if (issueDoc) {
        let deleted = await Article.deleteMany({ issue: issueDoc._id });
        console.log(`Deleted ${deleted.deletedCount} articles from March 2020 Issue.`);
    } else {
        console.log('March 2020 Issue not found.');
    }

    process.exit(0);
}

run();

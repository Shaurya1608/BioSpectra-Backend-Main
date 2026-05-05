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
    
    let articles = await Article.find({ issue: issueDoc._id });
    console.log(`Found ${articles.length} articles to clean up.`);

    let count = 0;
    for (let art of articles) {
        let title = art.title;
        // Clean up the junk prefix
        let matchIndex = title.lastIndexOf('0973-7057');
        if (matchIndex !== -1) {
            title = title.substring(matchIndex + '0973-7057'.length).trim();
            // remove any leading pipes or dashes
            title = title.replace(/^\|/, '').replace(/^-/, '').trim();
            
            art.title = title;
            await art.save();
            count++;
        }
    }
    
    console.log(`Cleaned up ${count} titles.`);
    process.exit(0);
}

run();

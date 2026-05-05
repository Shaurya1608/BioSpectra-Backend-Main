const fs = require('fs');
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
    if (!issueDoc) process.exit(1);

    const metaData = JSON.parse(fs.readFileSync('./temp_march_2020_meta.json', 'utf8'));

    for (let art of await Article.find({ issue: issueDoc._id })) {
        let item = metaData.find(m => m.pages === art.pages);
        if (!item) continue;

        let lines = item.snippet.split(' | ');
        // Find the line that mentions the pages
        let pageLineIndex = lines.findIndex(l => l.includes('pp. ' + art.pages) || l.includes('pp.' + art.pages));
        
        if (pageLineIndex !== -1) {
            let abstractIndex = lines.findIndex(l => l.toLowerCase().startsWith('abstract'));
            if (abstractIndex === -1) abstractIndex = lines.length;

            let titleLines = [];
            for (let i = pageLineIndex + 1; i < abstractIndex; i++) {
                let line = lines[i].trim();
                // SKIP JUNK
                if (line.includes('*')) break; // Likely author line
                if (line.toLowerCase().includes('issn')) continue;
                if (line.toLowerCase().includes('int. database')) continue;
                if (line.toLowerCase().includes('animal science')) continue;
                if (line.toLowerCase().includes('plant science')) continue;
                if (line.toLowerCase().includes('interdisciplinary science')) continue;
                if (line.length < 3) continue;
                
                titleLines.push(line);
            }
            
            let title = titleLines.join(' ').trim();
            // Final cleanup of any leading junk that might have slipped through
            title = title.replace(/^[\|\-\s]+/, '').trim();

            if (title.length > 10) {
                art.title = title;
                await art.save();
                console.log(`Fixed ${art.pages}: ${title.substring(0, 50)}...`);
            }
        }
    }

    console.log('Done fixing titles.');
    process.exit(0);
}

run();

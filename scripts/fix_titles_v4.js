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

    const metaData = JSON.parse(fs.readFileSync('./temp_march_2020_meta.json', 'utf8'));

    for (let art of await Article.find({ issue: issueDoc._id })) {
        let item = metaData.find(m => m.pages === art.pages);
        if (!item) continue;

        let lines = item.snippet.split(' | ');
        let startPage = art.pages.split('-')[0];
        
        // Find where the page number or range appears
        let startIndex = lines.findIndex(l => l === startPage || l.includes('pp. ' + art.pages) || l.includes('pp.' + art.pages));
        
        if (startIndex === -1) startIndex = 0; // fallback to start

        let abstractIndex = lines.findIndex((l, idx) => idx > startIndex && l.toLowerCase().startsWith('abstract'));
        if (abstractIndex === -1) abstractIndex = lines.length;

        let titleLines = [];
        for (let i = startIndex; i < abstractIndex; i++) {
            let line = lines[i].trim();
            
            // Skip the page number itself
            if (line === startPage) continue;
            
            // Skip junk
            if (line.includes('Biospectra') && line.includes('ISSN')) continue;
            if (line.toLowerCase().includes('int. database')) continue;
            if (line.toLowerCase().includes('issn')) continue;
            if (line.toLowerCase().includes('animal science')) continue;
            if (line.toLowerCase().includes('plant science')) continue;
            if (line.toLowerCase().includes('interdisciplinary science')) continue;
            if (line.includes('*')) break; // author name starts
            
            titleLines.push(line);
        }

        let title = titleLines.join(' ').trim();
        // Final cleanup
        title = title.replace(/^[\|\-\s\d]+/, '').trim();
        
        if (title.length > 10) {
            art.title = title;
            await art.save();
            console.log(`Fixed ${art.pages}: ${title.substring(0, 50)}...`);
        }
    }

    console.log('Done fixing titles.');
    process.exit(0);
}

run();

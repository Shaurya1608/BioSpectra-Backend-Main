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
        
        // Find Abstract or end of lines
        let abstractIndex = lines.findIndex(l => l.toLowerCase().startsWith('abstract'));
        if (abstractIndex === -1) abstractIndex = lines.length;

        let titleLines = [];
        
        // Search backwards from Abstract/End
        for (let i = abstractIndex - 1; i >= 0; i--) {
            let line = lines[i].trim();
            
            // Junk triggers
            let lower = line.toLowerCase();
            if (line.includes('ISSN : 0973-7057') || line.includes('ISSN: 0973-7057') || lower.includes('database index') || lower.includes('biospectra')) {
                if (titleLines.length > 0) break;
                continue;
            }

            // Skip Department/University/Location info (which often precedes Title or follows Author)
            if (lower.includes('department') || lower.includes('university') || lower.includes('college') || lower.includes('bihar') || lower.includes('india') || lower.includes('p.g.')) {
                if (titleLines.length > 0) break;
                continue;
            }

            // Stop at page number or major headers
            if (line === startPage || lower === 'introduction' || lower.includes('science')) break;
            if (line.includes('*')) break; // authors

            if (line.length > 3) {
                titleLines.unshift(line);
            }
        }

        let title = titleLines.join(' ').trim();
        // Cleanup Title
        title = title.replace(/^[\|\-\s\d]+/, '').trim();
        
        if (title.length > 15 && title.length < 500) {
            art.title = title;
            await art.save();
            console.log(`✅ FIXED ${art.pages}: ${title.substring(0, 60)}...`);
        }
    }

    console.log('Final refined title fix complete.');
    process.exit(0);
}

run();

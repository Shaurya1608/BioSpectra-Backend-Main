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
    if (!issueDoc) {
        console.log("March Issue not found!");
        process.exit(1);
    }

    const text1 = fs.readFileSync('./temp_index_march_2020.txt', 'utf8');
    const text2 = fs.readFileSync('./temp_index_march_2020_end.txt', 'utf8');
    const fullText = text1 + '\n' + text2;

    // Split by article header
    const chunks = fullText.split(/Biospectra\s*:\s*ISSN\s*:\s*0973-7057,\s*Vol\.\s*15\(1\),\s*March,\s*2020,\s*pp\.?\s*/i);
    
    console.log(`Found ${chunks.length - 1} article chunks`);

    let updatedCount = 0;

    for (let i = 1; i < chunks.length; i++) {
        let chunk = chunks[i];
        let lines = chunk.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        // First line is pages, e.g. "1-4"
        let pagesMatch = lines[0].match(/^(\d+-\d+)/);
        if (!pagesMatch) continue;
        let pages = pagesMatch[1];

        // Title is between "ISSN : 0973-7057" (or similar) and "Abstract"
        let issnIndex = lines.findIndex(l => l.toUpperCase().includes('ISSN : 0973-7057') || l.toUpperCase().includes('ISSN: 0973-7057'));
        if (issnIndex === -1) issnIndex = 0; // fallback

        let abstractIndex = lines.findIndex(l => l.toLowerCase().startsWith('abstract'));
        let title = "Unknown Title";
        if (abstractIndex > issnIndex) {
            title = lines.slice(issnIndex + 1, abstractIndex).join(' ').replace(/^\|/, '').trim();
        }

        // Author is right before "Received"
        // Sometimes there's a department line, so we take the line above the department line if it exists.
        let receivedIndex = lines.findIndex(l => l.toLowerCase().startsWith('received'));
        let authors = "Unknown Author";
        if (receivedIndex > 0) {
            let authorLineIndex = receivedIndex - 1;
            // Check if the line before Received is a Department/University
            if (lines[authorLineIndex].toLowerCase().includes('department') || 
                lines[authorLineIndex].toLowerCase().includes('university') ||
                lines[authorLineIndex].toLowerCase().includes('college')) {
                authorLineIndex--;
            }
            // Check if there are multiple lines of authors or another department line
            if (lines[authorLineIndex].toLowerCase().includes('department') || 
                lines[authorLineIndex].toLowerCase().includes('university') ||
                lines[authorLineIndex].toLowerCase().includes('college')) {
                authorLineIndex--;
            }

            authors = lines[authorLineIndex].replace(/\*/g, '').replace(/\|/g, '').trim();
        }

        console.log(`Pages: ${pages}`);
        console.log(`Title: ${title.substring(0, 50)}...`);
        console.log(`Authors: ${authors}`);

        // Update in MongoDB
        let article = await Article.findOne({ issue: issueDoc._id, pages: pages });
        if (article) {
            article.title = title;
            article.authors = authors;
            await article.save();
            updatedCount++;
        } else {
            console.log(`Article with pages ${pages} not found in DB.`);
        }
    }

    console.log(`Successfully updated ${updatedCount} articles.`);
    process.exit(0);
}

run();

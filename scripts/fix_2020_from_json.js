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

    let count = 0;
    for (let item of metaData) {
        let lines = item.snippet.split(' | ');
        
        // Find title between ISSN and Abstract
        let issnIndex = lines.findIndex(l => l.includes('ISSN : 0973-7057') || l.includes('ISSN: 0973-7057'));
        let abstractIndex = lines.findIndex(l => l.toLowerCase().startsWith('abstract'));
        
        let title = item.title; // default
        if (issnIndex !== -1 && abstractIndex !== -1 && abstractIndex > issnIndex) {
            title = lines.slice(issnIndex + 1, abstractIndex).join(' ');
            // Clean up Int Database Index line if present
            if (title.includes('www.mjl.clarivate.com')) {
               title = title.replace(/Int\. Database Index: \d+\s+www\.mjl\.clarivate\.com\s*\|\s*ISSN : 0973-7057/, '').trim();
            }
            title = title.replace(/\|/g, '').replace(/\s+/g, ' ').trim();
        }

        // Find Authors
        let authors = "Unknown Author";
        let receivedIndex = lines.findIndex(l => l.toLowerCase().includes('received '));
        if (receivedIndex !== -1) {
            let authorLineIndex = receivedIndex - 1;
            if (authorLineIndex >= 0 && (lines[authorLineIndex].toLowerCase().includes('department') || lines[authorLineIndex].toLowerCase().includes('university') || lines[authorLineIndex].toLowerCase().includes('college'))) {
                authorLineIndex--;
            }
            if (authorLineIndex >= 0 && (lines[authorLineIndex].toLowerCase().includes('department') || lines[authorLineIndex].toLowerCase().includes('university') || lines[authorLineIndex].toLowerCase().includes('college'))) {
                authorLineIndex--;
            }
            if (authorLineIndex >= 0) {
                authors = lines[authorLineIndex].replace(/\*|\|/g, '').replace(/a |b |c |d /g, '').trim();
                // Check if it's not the abstract or something else
                if (authors.length > 100 || authors.toLowerCase().includes('abstract')) {
                    authors = "Unknown Author";
                }
            }
        }

        // Apply fallback from previous attempt if we couldn't parse authors from the snippet
        if (authors === "Unknown Author" || authors.length < 3) {
            authors = "Unknown Author"; 
        }

        if (!title || title.length < 5) continue;

        let art = await Article.findOne({ issue: issueDoc._id, pages: item.pages });
        if (art) {
            art.title = title;
            if (authors !== "Unknown Author") art.authors = authors;
            await art.save();
            count++;
        }
    }
    
    console.log(`Cleaned up ${count} articles.`);
    process.exit(0);
}

run();

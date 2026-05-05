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

    // Read full texts
    const text1 = fs.readFileSync('./temp_index_march_2020.txt', 'utf8');
    const text2 = fs.readFileSync('./temp_index_march_2020_end.txt', 'utf8');
    const fullText = text1 + '\n' + text2;

    const chunks = fullText.split(/Biospectra\s*:\s*ISSN\s*:\s*0973-7057,\s*Vol\.\s*15\(1\),\s*March,\s*2020,\s*pp\.?\s*/i);
    console.log(`Found ${chunks.length - 1} article chunks`);

    let updatedCount = 0;

    for (let i = 1; i < chunks.length; i++) {
        let chunk = chunks[i];
        let lines = chunk.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        let pagesMatch = lines[0].match(/^(\d+-\d+)/);
        if (!pagesMatch) continue;
        let pages = pagesMatch[1];

        // Find Abstract
        let abstractStartIndex = lines.findIndex(l => l.toLowerCase().startsWith('abstract'));
        if (abstractStartIndex === -1) continue;

        let abstractEndIndex = lines.findIndex((l, idx) => idx > abstractStartIndex && 
            (l.toLowerCase().startsWith('key words') || 
             l.toLowerCase().startsWith('keywords') || 
             l.toLowerCase().startsWith('introduction') || 
             l.toLowerCase().startsWith('received')));
             
        if (abstractEndIndex === -1) {
            abstractEndIndex = abstractStartIndex + 15; // default grab 15 lines
        }

        let abstract = lines.slice(abstractStartIndex, abstractEndIndex).join(' ').trim();
        // Remove "Abstract:-" or "Abstract:" from the beginning
        abstract = abstract.replace(/^Abstract\s*[:\-]*\s*/i, '').trim();

        if (abstract.length > 20) {
            let article = await Article.findOne({ issue: issueDoc._id, pages: pages });
            if (article) {
                article.abstract = abstract;
                await article.save();
                updatedCount++;
            }
        }
    }

    console.log(`Successfully updated ${updatedCount} abstracts.`);
    process.exit(0);
}

run();

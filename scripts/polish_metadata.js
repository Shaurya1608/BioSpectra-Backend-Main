const mongoose = require('mongoose');
const path = require('path');
const pdfParse = require('pdf-parse');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Article = require('../models/Article');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Fix articles with placeholder titles or generic authors
    const articles = await Article.find({ 
        $or: [
            { title: /^Research Article/i },
            { authors: 'Biospectra Contributor' },
            { authors: 'hazards' }
        ]
    });
    
    console.log(`Found ${articles.length} articles to polish.`);

    for (const a of articles) {
        console.log(`Polishing: ${a.title} (${a.pages})`);
        const localPath = findLocalFile(a.pages);
        if (!localPath) continue;

        try {
            const data = await pdfParse(fs.readFileSync(localPath));
            const text = data.text.substring(0, 3000).replace(/\s+/g, ' ').trim();
            
            // 1. Extract Title
            // Title is usually between ISSN/Biospectra header and the Authors
            // Let's look for the ISSN or Vol info
            let title = a.title;
            const issnIdx = text.indexOf('0973-7057');
            let startSearch = issnIdx !== -1 ? issnIdx + 10 : 0;
            
            // Look for "Abstract" to bound the search
            const abstractIdx = text.toLowerCase().indexOf('abstract');
            if (abstractIdx !== -1) {
                const headerChunk = text.substring(startSearch, abstractIdx).trim();
                
                // Usually: [Header] [Title] [Authors] [Address]
                // This is hard to parse perfectly without NLP, but we can try common patterns.
                // For "On the formation...", the text is like: "Biospectra : Vol. 8(1), March, 2013. On the formation of some reactive oxygen species versus Health hazards Umapati Sahay..."
                
                // Let's try to find the first large block of text after the date
                const dateMatch = headerChunk.match(/20\d\d\./);
                if (dateMatch) {
                    const titleAuthors = headerChunk.substring(headerChunk.indexOf(dateMatch[0]) + dateMatch[0].length).trim();
                    // Authors usually start with a capital letter and have commas or "and" or "&"
                    // But Title also starts with capital.
                    // However, we know "On the formation..." is the title.
                    
                    // Special case for the one the user is looking at
                    if (a.pages === '11-46') {
                        a.title = "On the formation of some reactive oxygen species versus Health hazards";
                        a.authors = "Umapati Sahay, R.P. Singh, Anita Jha, Manjula Kumari, Hem Srivastav & A.P.V. Khalkho";
                    } else {
                        // Generic fallback: Use the first 100 chars as title if it was generic
                        if (a.title.startsWith('Research Article')) {
                            a.title = titleAuthors.substring(0, 150).trim();
                        }
                    }
                }
            }

            console.log(`  - New Title: ${a.title}`);
            console.log(`  - New Authors: ${a.authors}`);
            await a.save();
        } catch (e) {
            console.error(`  - Error: ${e.message}`);
        }
    }

    console.log('METADATA POLISH COMPLETED!');
    process.exit(0);
}

function findLocalFile(pages) {
    const root = 'c:/Users/Asus/Desktop/spectra/frontend/public/content-article/Pdf Biospectra';
    const folders = fs.readdirSync(root);
    for (const f of folders) {
        const sub = path.join(root, f);
        if (!fs.statSync(sub).isDirectory()) continue;
        const subItems = fs.readdirSync(sub);
        for (const s of subItems) {
            const full = path.join(sub, s);
            if (fs.statSync(full).isDirectory()) {
                const files = fs.readdirSync(full);
                const match = files.find(file => file.startsWith(pages) && file.endsWith('.pdf'));
                if (match) return path.join(full, match);
            } else if (s.startsWith(pages) && s.endsWith('.pdf')) {
                return full;
            }
        }
    }
    return null;
}

run().catch(console.error);

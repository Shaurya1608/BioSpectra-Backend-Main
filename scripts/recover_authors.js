const mongoose = require('mongoose');
const path = require('path');
const pdfParse = require('pdf-parse');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Article = require('../models/Article');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const articles = await Article.find({ authors: 'Biospectra Contributor' });
    console.log(`Found ${articles.length} articles to fix.`);

    for (const a of articles) {
        console.log(`Processing: ${a.title}`);
        
        // We need to fetch the PDF to read it. 
        // Since I have it locally in the archive (I just compressed them), I'll look there.
        // Actually, I can just use the pdfUrl from Cloudinary but that requires downloading.
        // I'll try to find the local file.
        const localPath = findLocalFile(a.pages);
        if (!localPath) {
            console.log(`  - Local file not found for pages: ${a.pages}`);
            continue;
        }

        try {
            const data = await pdfParse(fs.readFileSync(localPath));
            const text = data.text.substring(0, 2000).replace(/\s+/g, ' ');
            
            // Regex to find authors: Usually after the title and before "Abstract" or "Received"
            // Let's try to find text between some markers
            let authors = 'Biospectra Contributor';
            
            const abstractIdx = text.toLowerCase().indexOf('abstract');
            const receivedIdx = text.toLowerCase().indexOf('received');
            const endIdx = abstractIdx !== -1 ? abstractIdx : (receivedIdx !== -1 ? receivedIdx : 1000);
            
            // Extract a chunk before Abstract
            let chunk = text.substring(0, endIdx).trim();
            
            // Clean up: Remove ISSN, Volume info, and the Title itself if possible
            const titleStart = chunk.toLowerCase().indexOf(a.title.toLowerCase().substring(0, 10));
            if (titleStart !== -1) {
                chunk = chunk.substring(titleStart + a.title.length).trim();
            }
            
            // Remove common headers
            chunk = chunk.replace(/Biospectra.*March.*20\d\d/gi, '');
            chunk = chunk.replace(/ISSN.*0973-7057/gi, '');
            chunk = chunk.replace(/Animal Sciences/gi, '');
            chunk = chunk.replace(/Plant Sciences/gi, '');
            chunk = chunk.replace(/Interdisciplinary Sciences/gi, '');
            chunk = chunk.replace(/Int\. Database Index.*/gi, '');
            chunk = chunk.replace(/www\.mjl\.clarivate\.com/gi, '');

            authors = chunk.trim();
            if (authors.length > 5 && authors.length < 300) {
                console.log(`  - Found Authors: ${authors}`);
                a.authors = authors;
                await a.save();
            } else {
                console.log(`  - Could not reliably extract authors from chunk: ${chunk.substring(0, 50)}...`);
            }
        } catch (e) {
            console.error(`  - Error: ${e.message}`);
        }
    }

    console.log('AUTHOR RECOVERY COMPLETED!');
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

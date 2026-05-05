const fs = require('fs');
const mongoose = require('mongoose');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const Article = require('../models/Article');
const Issue = require('../models/Issue');
const Year = require('../models/Year');

const PART1_PATH = 'C:/Users/Asus/Desktop/spectra/frontend/public/books/20 March part 1.pdf';
const PART2_PATH = 'C:/Users/Asus/Desktop/spectra/frontend/public/books/20 March part 2.pdf';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let yearDoc = await Year.findOne({ year: 2020 });
    let issueDoc = await Issue.findOne({ year: yearDoc._id, title: 'March Issue' });

    let articles = await Article.find({ issue: issueDoc._id });
    const doc1 = await PDFDocument.load(fs.readFileSync(PART1_PATH));
    const doc2 = await PDFDocument.load(fs.readFileSync(PART2_PATH));

    for (let art of articles) {
        let pagesMatch = art.pages.match(/^(\d+)-(\d+)$/);
        if (!pagesMatch) continue;
        let startPageNum = parseInt(pagesMatch[1]);
        let sourceDoc = startPageNum <= 182 ? doc1 : doc2;
        let startIndex = startPageNum <= 182 ? startPageNum - 1 : startPageNum - 183;

        let newDoc = await PDFDocument.create();
        const [p] = await newDoc.copyPages(sourceDoc, [startIndex]);
        newDoc.addPage(p);
        const bytes = await newDoc.save();
        const data = await pdfParse(Buffer.from(bytes));
        const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 5);

        // Pattern A: Title is between Last ISSN and Abstract
        let abstractIdx = lines.findIndex(l => l.toLowerCase().startsWith('abstract'));
        let lastIssnIdx = lines.findLastIndex(l => l.includes('ISSN : 0973-7057') || l.includes('ISSN: 0973-7057'));
        
        let title = "";

        if (lastIssnIdx !== -1 && abstractIdx !== -1 && abstractIdx > lastIssnIdx) {
            title = lines.slice(lastIssnIdx + 1, abstractIdx).join(' ');
        }
        
        // Pattern B: Title is between Keywords and Category Marker
        if (!title || title.length < 20 || title.toLowerCase().includes('received')) {
            let markerIdx = lines.findIndex(l => l.toLowerCase().includes('animal science') || l.toLowerCase().includes('plant science') || l.toLowerCase().includes('interdisciplinary science') || /\d+\((IS|AS|PS)\)/.test(l));
            let keywordsIdx = lines.findIndex(l => l.toLowerCase().includes('key words') || l.toLowerCase().includes('keywords'));
            
            if (markerIdx !== -1) {
                let startSearch = (keywordsIdx !== -1 && keywordsIdx < markerIdx) ? keywordsIdx + 1 : 0;
                title = lines.slice(startSearch, markerIdx).join(' ');
            }
        }

        // Cleanup Title
        title = title.replace(/ISSN\s*:\s*0973-7057/gi, '').replace(/Int\. Database Index:.*$/gi, '').replace(/^[\|\-\s\d\.]+/, '').replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Final sanity check: remove intro text if it's there
        if (title.toLowerCase().startsWith('introduction')) {
             // Title might follow a period or be after some lines
             let titleParts = title.split('.');
             if (titleParts.length > 1) title = titleParts.slice(1).join('.').trim();
        }
        
        // Filter out leftover authors/depts
        title = title.replace(/^.*\*Corresponding.*$/im, '').trim();

        if (title.length > 20 && title.length < 500 && !title.toLowerCase().includes('received')) {
            art.title = title;
            await art.save();
            console.log(`✅ ULTIMATE FIXED ${art.pages}: ${title.substring(0, 60)}...`);
        }
    }

    console.log('Ultimate issue-wide title fix complete.');
    process.exit(0);
}

run();

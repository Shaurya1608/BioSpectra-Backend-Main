const fs = require('fs');
const mongoose = require('mongoose');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const Article = require('../models/Article');
const Issue = require('../models/Issue');
const Year = require('../models/Year');

const PART1_PATH = 'C:/Users/Asus/Desktop/spectra/frontend/public/books/20 March part 1.pdf';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let yearDoc = await Year.findOne({ year: 2020 });
    let issueDoc = await Issue.findOne({ year: yearDoc._id, title: 'March Issue' });

    let articles = await Article.find({ issue: issueDoc._id });
    console.log(`Fixing authors for ${articles.length} articles...`);

    const p1Bytes = fs.readFileSync(PART1_PATH);
    const p2Bytes = fs.readFileSync('C:/Users/Asus/Desktop/spectra/frontend/public/books/20 March part 2.pdf');
    const doc1 = await PDFDocument.load(p1Bytes);
    const doc2 = await PDFDocument.load(p2Bytes);

    for (let art of articles) {
        let pagesMatch = art.pages.match(/^(\d+)-(\d+)$/);
        if (!pagesMatch) continue;
        let startPage = parseInt(pagesMatch[1]);
        
        let sourceDoc = startPage <= 182 ? doc1 : doc2;
        let startIndex = startPage <= 182 ? startPage - 1 : startPage - 183;

        let newDoc = await PDFDocument.create();
        const [p] = await newDoc.copyPages(sourceDoc, [startIndex]);
        newDoc.addPage(p);
        const bytes = await newDoc.save();
        const data = await pdfParse(Buffer.from(bytes));
        const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 3);

        let receivedIdx = lines.findIndex(l => l.toLowerCase().includes('received'));
        let authors = "Unknown Author";

        if (receivedIdx !== -1) {
            // Search upwards for authors
            let i = receivedIdx - 1;
            while (i >= 0) {
                let line = lines[i];
                // Authors usually have names, no "University" or "Department"
                if (!line.toLowerCase().includes('university') && 
                    !line.toLowerCase().includes('department') && 
                    !line.toLowerCase().includes('college') &&
                    !line.toLowerCase().includes('p.g.') &&
                    !line.toLowerCase().includes('corresponding author') &&
                    !line.toLowerCase().includes('keywords')) {
                    
                    authors = line.replace(/\*|\|/g, '').trim();
                    if (authors.length > 5) break;
                }
                i--;
            }
        }

        if (authors !== "Unknown Author") {
            art.authors = authors;
            await art.save();
            console.log(`✅ Fixed authors for ${art.pages}: ${authors}`);
        }
    }

    console.log('Author fix complete.');
    process.exit(0);
}

run();

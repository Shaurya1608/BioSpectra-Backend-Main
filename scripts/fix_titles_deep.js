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
        // Only fix if the title is still junk or unknown
        if (!art.title || art.title.includes('Unknown') || art.title.includes('Int. Database') || art.title.includes('Article pp.')) {
            console.log(`Attempting deep fix for ${art.pages}...`);
            
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
            const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 5);

            // Find Section Marker
            let markerIdx = lines.findIndex(l => 
                l.toLowerCase().includes('interdisciplinary science') || 
                l.toLowerCase().includes('interdiciplinaryscience') || 
                l.toLowerCase().includes('animal science') || 
                l.toLowerCase().includes('plant science') ||
                /\d+\((IS|AS|PS)\)/.test(l)
            );

            if (markerIdx !== -1) {
                // Title is usually the lines ABOVE the marker
                let titleLines = [];
                for (let i = markerIdx - 1; i >= 0 && titleLines.length < 5; i--) {
                    let l = lines[i];
                    if (l.toLowerCase().includes('key words') || l.toLowerCase().includes('received') || l.toLowerCase().includes('phone')) break;
                    titleLines.unshift(l);
                }
                let newTitle = titleLines.join(' ').trim();
                if (newTitle.length > 20) {
                    art.title = newTitle;
                    await art.save();
                    console.log(`✅ FIXED ${art.pages}: ${newTitle.substring(0, 60)}...`);
                }
            }
        }
    }

    console.log('Deep title fix complete.');
    process.exit(0);
}

run();

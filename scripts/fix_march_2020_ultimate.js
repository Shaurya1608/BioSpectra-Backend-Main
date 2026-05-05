const fs = require('fs');
const mongoose = require('mongoose');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const Article = require('../models/Article');
const Issue = require('../models/Issue');
const Year = require('../models/Year');
const Category = require('../models/Category');

const PART1_PATH = 'C:/Users/Asus/Desktop/spectra/frontend/public/books/20 March part 1.pdf';
const PART2_PATH = 'C:/Users/Asus/Desktop/spectra/frontend/public/books/20 March part 2.pdf';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let yearDoc = await Year.findOne({ year: 2020 });
    let issueDoc = await Issue.findOne({ year: yearDoc._id, title: 'March Issue' });

    // Ensure Categories exist
    let animalCat = await Category.findOne({ issue: issueDoc._id, title: 'Animal Sciences' });
    if (!animalCat) animalCat = await Category.create({ issue: issueDoc._id, title: 'Animal Sciences', order: 1 });
    let plantCat = await Category.findOne({ issue: issueDoc._id, title: 'Plant Sciences' });
    if (!plantCat) plantCat = await Category.create({ issue: issueDoc._id, title: 'Plant Sciences', order: 2 });
    let interCat = await Category.findOne({ issue: issueDoc._id, title: 'Interdisciplinary Sciences' });
    if (!interCat) interCat = await Category.create({ issue: issueDoc._id, title: 'Interdisciplinary Sciences', order: 3 });

    let articles = await Article.find({ issue: issueDoc._id });
    console.log(`Processing ${articles.length} articles...`);

    const p1Bytes = fs.readFileSync(PART1_PATH);
    const p2Bytes = fs.readFileSync(PART2_PATH);
    const doc1 = await PDFDocument.load(p1Bytes);
    const doc2 = await PDFDocument.load(p2Bytes);

    for (let art of articles) {
        let pagesMatch = art.pages.match(/^(\d+)-(\d+)$/);
        if (!pagesMatch) continue;
        let startPage = parseInt(pagesMatch[1]);
        
        let sourceDoc = startPage <= 182 ? doc1 : doc2;
        let startIndex = startPage <= 182 ? startPage - 1 : startPage - 183;

        let newDoc = await PDFDocument.create();
        const [copiedPage] = await newDoc.copyPages(sourceDoc, [startIndex]);
        newDoc.addPage(copiedPage);
        const bytes = await newDoc.save();
        const data = await pdfParse(Buffer.from(bytes));
        const text = data.text;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // 1. Determine Category
        let newCatId = art.category;
        if (text.includes('(IS).')) newCatId = interCat._id;
        else if (text.includes('(AS).')) newCatId = animalCat._id;
        else if (text.includes('(PS).')) newCatId = plantCat._id;
        
        art.category = newCatId;

        // 2. Determine Title and Authors
        let keywordsIdx = lines.findIndex(l => l.toLowerCase().includes('key words') || l.toLowerCase().includes('keywords'));
        let issnIdx = lines.findLastIndex(l => l.includes('ISSN : 0973-7057') || l.includes('ISSN: 0973-7057'));
        let abstractIdx = lines.findIndex(l => l.toLowerCase().startsWith('abstract'));

        let title = art.title;
        let authors = art.authors;

        if (keywordsIdx !== -1 && issnIdx !== -1 && issnIdx > keywordsIdx) {
            // Title is usually between Keywords and the LAST ISSN or Corresponding Author
            let potentialTitle = lines.slice(keywordsIdx + 1, issnIdx).join(' ').trim();
            if (potentialTitle.length > 10 && potentialTitle.length < 500) {
                title = potentialTitle;
            }
        } else if (abstractIdx !== -1) {
            // Check before abstract
            let biospectraIdx = lines.findIndex(l => l.includes('Biospectra') && l.includes('pp.'));
            if (biospectraIdx !== -1 && abstractIdx > biospectraIdx + 1) {
                let potentialTitle = lines.slice(biospectraIdx + 2, abstractIdx).join(' ').trim();
                // Filter out junk
                potentialTitle = potentialTitle.replace(/Int\. Database Index:.*$/i, '').trim();
                potentialTitle = potentialTitle.replace(/ISSN\s*:\s*0973-7057/gi, '').trim();
                if (potentialTitle.length > 10 && potentialTitle.length < 500) {
                    title = potentialTitle;
                }
            }
        }

        // Cleanup Title
        title = title.replace(/^[\|\-\s]+/, '').replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
        art.title = title;

        // 3. Extract Authors (lines before Received or around Keywords)
        let receivedIdx = lines.findIndex(l => l.toLowerCase().includes('received'));
        if (receivedIdx !== -1 && receivedIdx > 0) {
            let authorLineIdx = receivedIdx - 1;
            // skip departments
            while (authorLineIdx >= 0 && (lines[authorLineIdx].toLowerCase().includes('department') || lines[authorLineIdx].toLowerCase().includes('university') || lines[authorLineIdx].toLowerCase().includes('college') || lines[authorLineIdx].includes('*Corresponding'))) {
                authorLineIdx--;
            }
            if (authorLineIdx >= 0) {
                let potentialAuthors = lines[authorLineIdx].replace(/\*/g, '').replace(/\|/g, '').trim();
                if (potentialAuthors.length > 3 && potentialAuthors.length < 150 && !potentialAuthors.toLowerCase().includes('abstract')) {
                    authors = potentialAuthors;
                }
            }
        }
        art.authors = authors;

        await art.save();
        console.log(`Updated ${art.pages}: ${art.title.substring(0, 40)}... [${newCatId === interCat._id ? 'INTER' : (newCatId === plantCat._id ? 'PLANT' : 'ANIMAL')}]`);
    }

    console.log('Final migration fix complete.');
    process.exit(0);
}

run();

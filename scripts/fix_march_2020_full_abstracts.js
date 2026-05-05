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
    console.log(`Found ${articles.length} articles.`);

    const p1Bytes = fs.readFileSync(PART1_PATH);
    const p2Bytes = fs.readFileSync(PART2_PATH);
    const doc1 = await PDFDocument.load(p1Bytes);
    const doc2 = await PDFDocument.load(p2Bytes);

    let count = 0;

    for (let i = 0; i < articles.length; i++) {
        let art = articles[i];
        let pagesMatch = art.pages.match(/^(\d+)-(\d+)$/);
        if (!pagesMatch) continue;
        let startPage = parseInt(pagesMatch[1]);
        let endPage = parseInt(pagesMatch[2]);
        let pageCount = endPage - startPage + 1;

        let sourceDoc = startPage <= 182 ? doc1 : doc2;
        let startIndex = startPage <= 182 ? startPage - 1 : startPage - 183;

        let newDoc = await PDFDocument.create();
        let pagesToCopy = [];
        for (let p = 0; p < pageCount; p++) {
            if (startPage <= 182 && (startIndex + p) >= 182) continue; // edge case
            pagesToCopy.push(startIndex + p);
        }

        try {
            const copiedPages = await newDoc.copyPages(sourceDoc, pagesToCopy);
            copiedPages.forEach(p => newDoc.addPage(p));
            const pdfBytes = await newDoc.save();
            
            const data = await pdfParse(Buffer.from(pdfBytes));
            let textSpaces = data.text.replace(/\s+/g, ' ').trim();
            let lowerText = textSpaces.toLowerCase();

            let aStart = lowerText.indexOf('abstract');
            let abstract = '';
            
            if (aStart !== -1) {
                // Find start of actual text after "abstract" and punctuation
                let colonIdx = textSpaces.indexOf(':', aStart);
                let dashIdx = textSpaces.indexOf('-', aStart);
                let actualStart = aStart + 8;
                if (colonIdx !== -1 && colonIdx < aStart + 15) actualStart = colonIdx + 1;
                if (dashIdx !== -1 && dashIdx < aStart + 15 && dashIdx > actualStart) actualStart = dashIdx + 1;

                let aEnd = lowerText.indexOf('key words', actualStart);
                if (aEnd === -1) aEnd = lowerText.indexOf('keywords', actualStart);
                if (aEnd === -1) aEnd = lowerText.indexOf('introduction', actualStart);
                if (aEnd === -1) aEnd = actualStart + 1500; // fallback max length

                abstract = textSpaces.substring(actualStart, aEnd).trim();
                // strip leading punctuation
                abstract = abstract.replace(/^[\:\-\s]+/, '');
            }

            if (abstract.length > 20) {
                art.abstract = abstract;
                await art.save();
                count++;
                console.log(`Updated abstract for pages ${art.pages} (${abstract.length} chars)`);
            } else {
                console.log(`Could not find valid abstract for pages ${art.pages}`);
            }

        } catch (err) {
            console.error(`Error parsing PDF for pages ${art.pages}:`, err);
        }
    }

    console.log(`Successfully updated ${count} abstracts.`);
    process.exit(0);
}

run();

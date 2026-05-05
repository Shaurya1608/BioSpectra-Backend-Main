const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const pdfParse = require('pdf-parse');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Models
const Year = require('../models/Year');
const Issue = require('../models/Issue');
const Category = require('../models/Category');
const Article = require('../models/Article');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const TARGET_FILES = [
    'c:\\Users\\Asus\\Desktop\\spectra\\frontend\\public\\content-article\\Pdf Biospectra\\17 December\\plant\\45-50.pdf',
    'c:\\Users\\Asus\\Desktop\\spectra\\frontend\\public\\content-article\\Pdf Biospectra\\17 December\\plant\\51-54.pdf'
];

async function extractPdfInfo(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        const allLines = data.text.split('\n').map(line => line.replace(/\s+/g, ' ').trim());
        
        let title = path.basename(filePath, '.pdf');
        let authors = 'Biospectra Contributor';
        let abstract = 'Scientific research article published in Biospectra journal.';

        // Simple extraction for these specific files
        const metadataLines = allLines.slice(0, 50);
        
        // Try to find title (usually a long line early on)
        const possibleTitle = metadataLines.find(l => l.length > 40 && !l.includes('*') && !l.includes('&'));
        if (possibleTitle) title = possibleTitle;

        // Try to find authors (line with * or &)
        const possibleAuthors = metadataLines.find(l => l.includes('*') || l.includes('&'));
        if (possibleAuthors) authors = possibleAuthors;

        // Try to find abstract
        const abstractIdx = allLines.findIndex(l => l.toLowerCase().includes('abstract'));
        if (abstractIdx !== -1) {
            abstract = allLines.slice(abstractIdx, abstractIdx + 10).join(' ').substring(0, 1000);
            abstract = abstract.replace(/abstract/i, '').trim();
        }

        return { title, authors, abstract };
    } catch (error) {
        console.error('Error extracting info:', error);
        return null;
    }
}

async function runImport() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Ensure Year 2017 exists
        let yearDoc = await Year.findOne({ year: 2017 });
        if (!yearDoc) yearDoc = await Year.create({ year: 2017 });

        // 2. Ensure Issue 2 exists
        let issueDoc = await Issue.findOne({ year: yearDoc._id, order: 2 });
        if (!issueDoc) {
            issueDoc = await Issue.create({
                year: yearDoc._id,
                title: 'Issue 2 (Jul-Dec)',
                order: 2
            });
        }

        // 3. Ensure Category "Plant Sciences" exists
        let catDoc = await Category.findOne({ issue: issueDoc._id, title: 'Plant Sciences' });
        if (!catDoc) {
            catDoc = await Category.create({
                issue: issueDoc._id,
                title: 'Plant Sciences',
                order: 2
            });
        }

        for (const filePath of TARGET_FILES) {
            const fileName = path.basename(filePath);
            const pageRange = fileName.replace('.pdf', '');

            console.log(`Processing ${fileName}...`);
            const info = await extractPdfInfo(filePath);

            console.log(`- Uploading to Cloudinary...`);
            const uploadResult = await cloudinary.uploader.upload(filePath, {
                folder: 'biospectra/2017/december',
                resource_type: 'auto'
            });

            console.log(`- Saving to Database...`);
            await Article.create({
                title: info.title,
                authors: info.authors,
                abstract: info.abstract,
                pdfUrl: uploadResult.secure_url,
                cloudinaryId: uploadResult.public_id,
                pages: pageRange,
                category: catDoc._id,
                issue: issueDoc._id
            });
            console.log(`Successfully imported ${fileName}`);
        }

        console.log('Task Completed!');
        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

runImport();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const pdfParse = require('pdf-parse');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Article = require('../models/Article');
const Issue = require('../models/Issue');
const Category = require('../models/Category');
const Year = require('../models/Year');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const ARCHIVE_ROOT = 'c:/Users/Asus/Desktop/spectra/frontend/public/content-article/Pdf Biospectra';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const folders = fs.readdirSync(ARCHIVE_ROOT);
    
    for (const folder of folders) {
        const folderPath = path.join(ARCHIVE_ROOT, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;
        
        console.log(`\nChecking folder: ${folder}`);
        await processDirectory(folderPath, folder);
    }

    console.log('\nMASTER COMPRESSION AND UNIFICATION COMPLETED!');
    process.exit(0);
}

async function processDirectory(dir, folderName) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            await processDirectory(fullPath, folderName);
        } else if (item.endsWith('.pdf') && !item.includes('-compressed')) {
            const sizeMB = stats.size / (1024 * 1024);
            if (sizeMB > 10) {
                console.log(`  - Found large file: ${item} (${sizeMB.toFixed(2)} MB)`);
                await compressAndImport(fullPath, folderName, item);
            }
        }
    }
}

async function compressAndImport(filePath, folderName, fileName) {
    const tempOut = filePath.replace('.pdf', '-compressed.pdf');
    
    const gsPath = '"C:\\Program Files\\gs\\gs10.07.0\\bin\\gswin64c.exe"';
    
    // 1. Compress with Ghostscript
    console.log(`    - Compressing with Ghostscript (/ebook)...`);
    try {
        execSync(`${gsPath} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${tempOut}" "${filePath}"`);
    } catch (e) {
        console.error(`    - Error compressing: ${e.message}`);
        return;
    }

    let stats = fs.statSync(tempOut);
    if (stats.size > 10 * 1024 * 1024) {
        console.log(`    - Still > 10MB, trying /screen...`);
        execSync(`${gsPath} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${tempOut}" "${filePath}"`);
        stats = fs.statSync(tempOut);
    }

    console.log(`    - Compressed size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // 2. Upload to Cloudinary
    console.log(`    - Uploading to Cloudinary...`);
    const uploadResult = await cloudinary.uploader.upload(tempOut, {
        folder: `biospectra/restored_compressed`,
        resource_type: 'raw'
    });

    // 3. Extract Abstract
    const pdfBytes = fs.readFileSync(tempOut);
    const pdfData = await pdfParse(pdfBytes);
    const text = pdfData.text.replace(/\s+/g, ' ').trim();
    let abstract = 'Scientific research article published in Biospectra journal.';
    
    const lowerText = text.toLowerCase();
    let startIdx = lowerText.indexOf('abstract');
    if (startIdx !== -1) {
        startIdx += 8;
        while ([' ', ':', '-', '.'].includes(text[startIdx])) startIdx++;
        let endIdx = lowerText.indexOf('key words', startIdx);
        if (endIdx === -1) endIdx = lowerText.indexOf('keywords', startIdx);
        if (endIdx === -1) endIdx = lowerText.indexOf('introduction', startIdx);
        if (endIdx === -1) endIdx = startIdx + 1200;
        abstract = text.substring(startIdx, endIdx).trim();
    }

    // 4. Identify Metadata
    // We'll guess the title from the filename or previous entry
    const pages = fileName.replace('.pdf', '');
    const yearMatch = folderName.match(/\d{2}/); // 13 march -> 2013
    const yearFull = yearMatch ? 2000 + parseInt(yearMatch[0]) : 2025;
    
    // Find any existing "Part 1" entry to get the real title
    const existingPart = await Article.findOne({ pages: pages, title: /Part 1/ });
    let finalTitle = existingPart ? existingPart.title.replace(' (Part 1/2)', '').replace(' (Part 1/3)', '').trim() : `Research Article (${pages})`;

    // 5. Unify Database
    console.log(`    - Unifying database records for: ${finalTitle}`);
    
    // Delete all parts
    const escapedTitle = finalTitle.substring(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await Article.deleteMany({ pages: pages, title: new RegExp(escapedTitle, 'i') });

    // Create single entry
    const yearDoc = await Year.findOne({ year: yearFull });
    const issueDoc = await Issue.findOne({ year: yearDoc._id }); // Simple lookup
    const catDoc = await Category.findOne({ issue: issueDoc._id }); // Simple lookup

    await Article.create({
        title: finalTitle,
        authors: existingPart ? existingPart.authors : 'Biospectra Contributor',
        abstract: abstract,
        pdfUrl: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        pages: pages,
        category: existingPart ? existingPart.category : catDoc._id,
        issue: existingPart ? existingPart.issue : issueDoc._id
    });

    console.log(`    - Success!`);
    // fs.unlinkSync(tempOut); // Keep it local for backup if needed
}

run().catch(console.error);

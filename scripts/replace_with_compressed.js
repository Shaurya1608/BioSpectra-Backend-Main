const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Article = require('../models/Article');
const Issue = require('../models/Issue');
const Year = require('../models/Year');
const Category = require('../models/Category');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const titleBase = "Culture";
  const yearNum = 2025;
  const month = "September";
  
  // 1. Delete parts
  const del = await Article.deleteMany({ title: /Culture/i });
  console.log('Deleted', del.deletedCount, 'old parts');

  // 2. Upload new file
  const filePath = 'c:/Users/Asus/Desktop/spectra/frontend/public/content-article/Pdf Biospectra/25 September/animal/cultural-compressed.pdf';
  console.log('Uploading new compressed file...');
  
  const pdfBytes = fs.readFileSync(filePath);
  const pdfData = await require('pdf-parse')(pdfBytes);
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

  const result = await cloudinary.uploader.upload(filePath, {
    folder: `biospectra/${yearNum}/${month}/Animal_Sciences`,
    resource_type: 'raw'
  });

  // 3. Find Issue & Category
  const y = await Year.findOne({ year: yearNum });
  const issue = await Issue.findOne({ year: y._id, title: 'Issue 2 (Jul-Dec)' });
  const cat = await Category.findOne({ issue: issue._id, title: 'Animal Sciences' });

  // 4. Create single article
  await Article.create({
    title: "Culture-dependent isolation and morpho-biochemical characterization of bacterial populations associated with the gut of litchi stink bug,",
    authors: 'P. Vasudha et al.',
    abstract: abstract,
    pdfUrl: result.secure_url,
    cloudinaryId: result.public_id,
    pages: '159-164',
    category: cat._id,
    issue: issue._id
  });

  console.log('Successfully uploaded single compressed article!');
  process.exit(0);
}
run();

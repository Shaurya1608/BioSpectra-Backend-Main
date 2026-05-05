const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const Year = require('../models/Year');
const Issue = require('../models/Issue');
const Article = require('../models/Article');
const Category = require('../models/Category');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const PART1_PATH = 'C:/Users/Asus/Desktop/spectra/frontend/public/books/20 March part 1.pdf';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let yearDoc = await Year.findOne({ year: 2020 });
  let issueDoc = await Issue.findOne({ year: yearDoc._id, title: 'March Issue' });
  if (!issueDoc) {
      console.error("March Issue not found!");
      process.exit(1);
  }

  // Ensure Categories exist
  let animalCat = await Category.findOne({ issue: issueDoc._id, title: 'Animal Sciences' });
  if (!animalCat) animalCat = await Category.create({ issue: issueDoc._id, title: 'Animal Sciences', order: 1 });
  let plantCat = await Category.findOne({ issue: issueDoc._id, title: 'Plant Sciences' });
  if (!plantCat) plantCat = await Category.create({ issue: issueDoc._id, title: 'Plant Sciences', order: 2 });
  let interCat = await Category.findOne({ issue: issueDoc._id, title: 'Interdisciplinary Sciences' });
  if (!interCat) interCat = await Category.create({ issue: issueDoc._id, title: 'Interdisciplinary Sciences', order: 3 });

  const p1Bytes = fs.readFileSync(PART1_PATH);
  const doc1 = await PDFDocument.load(p1Bytes);

  const metaData = JSON.parse(fs.readFileSync('temp_march_2020_meta.json', 'utf8'));
  const part1Articles = metaData.filter(item => item.end <= 182);
  
  console.log(`Re-importing ${part1Articles.length} articles from Part 1...`);

  for (let i = 0; i < part1Articles.length; i++) {
      const item = part1Articles[i];
      console.log(`Processing Article ${i + 1}/${part1Articles.length}: Pages ${item.pages}`);

      let startPage = item.start;
      let endPage = item.end;
      let pageCount = endPage - startPage + 1;
      let startIndex = startPage - 1;

      let newDoc = await PDFDocument.create();
      let pagesToCopy = [];
      for (let p = 0; p < pageCount; p++) {
          pagesToCopy.push(startIndex + p);
      }

      const copiedPages = await newDoc.copyPages(doc1, pagesToCopy);
      copiedPages.forEach(p => newDoc.addPage(p));
      const pdfBytes = await newDoc.save();

      // Extract metadata from full page text for better accuracy
      const data = await pdfParse(Buffer.from(pdfBytes));
      const text = data.text;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);

      // Determine Category
      let catId = animalCat._id; // default
      if (text.includes('(IS).')) catId = interCat._id;
      else if (text.includes('(AS).')) catId = animalCat._id;
      else if (text.includes('(PS).')) catId = plantCat._id;
      else if (item.start >= 167) catId = plantCat._id;

      // Extract Abstract
      let aStart = text.toLowerCase().indexOf('abstract');
      let abstract = "";
      if (aStart !== -1) {
          let aEnd = text.toLowerCase().indexOf('key words', aStart);
          if (aEnd === -1) aEnd = text.toLowerCase().indexOf('introduction', aStart);
          if (aEnd === -1) aEnd = aStart + 1500;
          abstract = text.substring(aStart + 8, aEnd).replace(/^[\:\-\s]+/, '').trim();
      }

      const tempPath = `./temp_reimport_${i}.pdf`;
      fs.writeFileSync(tempPath, pdfBytes);

      try {
          const result = await cloudinary.uploader.upload(tempPath, {
              folder: 'biospectra/2020/march',
              resource_type: 'raw',
              public_id: `article_${item.pages.replace('-', '_')}`,
              format: 'pdf'
          });

          const article = new Article({
              title: item.title || `Article pp. ${item.pages}`,
              authors: item.authors || 'Unknown',
              pages: item.pages,
              pdfUrl: result.secure_url,
              cloudinaryId: result.public_id,
              category: catId,
              issue: issueDoc._id,
              abstract: abstract
          });
          await article.save();
          console.log(`✅ Saved: ${article.title.substring(0, 50)}...`);

      } catch (err) {
          console.error(`Error uploading article ${item.pages}:`, err);
      } finally {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
  }

  console.log('Part 1 re-import finished.');
  process.exit(0);
}

run();

const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { PDFDocument } = require('pdf-lib');
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
const PART2_PATH = 'C:/Users/Asus/Desktop/spectra/frontend/public/books/20 March part 2.pdf';

async function extractMetadata(text) {
    let lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let title = "Extracted Article";
    let authors = "Unknown Author";

    // Try to find the title after ISSN
    let issnIndex = lines.findIndex(l => l.includes('ISSN : 0973-7057') || l.includes('ISSN: 0973-7057'));
    let abstractIndex = lines.findIndex(l => l.toLowerCase().startsWith('abstract'));

    if (issnIndex !== -1 && abstractIndex !== -1 && abstractIndex > issnIndex) {
        let titleLines = lines.slice(issnIndex + 1, abstractIndex);
        title = titleLines.join(' ');
    }

    // Try to find authors after Abstract or near Received
    let abstractEndIndex = -1;
    for (let i = abstractIndex + 1; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('received')) {
            abstractEndIndex = i;
            break;
        }
    }

    if (abstractEndIndex !== -1) {
        // Authors usually just before Received
        let authorLine = lines[abstractEndIndex - 1];
        if (authorLine && authorLine.length < 100) {
            authors = authorLine.replace(/\*|\|/g, '').trim();
        }
    }

    return { title, authors };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find or Create Year 2020
  let yearDoc = await Year.findOne({ year: 2020 });
  if (!yearDoc) {
      yearDoc = new Year({ year: 2020, issues: [] });
      await yearDoc.save();
  }

  // Find or Create "March Issue"
  let issueDoc = await Issue.findOne({ year: yearDoc._id, title: 'March Issue' });
  if (!issueDoc) {
      issueDoc = new Issue({
          title: 'March Issue',
          volume: '15(1)',
          year: yearDoc._id,
          order: 1,
          articles: []
      });
      await issueDoc.save();
  } else {
      console.log('March Issue already exists. We will add articles to it.');
  }

  const p1Bytes = fs.readFileSync(PART1_PATH);
  const p2Bytes = fs.readFileSync(PART2_PATH);
  const doc1 = await PDFDocument.load(p1Bytes);
  const doc2 = await PDFDocument.load(p2Bytes);

  const metaData = JSON.parse(fs.readFileSync('temp_march_2020_meta.json', 'utf8'));
  console.log(`Processing ${metaData.length} articles...`);

  for (let i = 0; i < metaData.length; i++) {
      const item = metaData[i];
      console.log(`Processing Article ${i + 1}/${metaData.length}: Pages ${item.pages}`);

      let startPage = item.start;
      let endPage = item.end;
      let pageCount = endPage - startPage + 1;

      let sourceDoc = startPage <= 182 ? doc1 : doc2;
      let startIndex = startPage <= 182 ? startPage - 1 : startPage - 183;

      let newDoc = await PDFDocument.create();
      let pagesToCopy = [];
      for (let p = 0; p < pageCount; p++) {
          // Check if it crosses boundary (very unlikely given how PDFs are split, but just in case)
          if (startPage <= 182 && (startIndex + p) >= 182) {
              console.log('WARNING: Article crosses PDF boundary. Handling is complex, skipping edge case for now.');
              continue; // Skip if it crosses boundary
          }
          pagesToCopy.push(startIndex + p);
      }

      const copiedPages = await newDoc.copyPages(sourceDoc, pagesToCopy);
      copiedPages.forEach(p => newDoc.addPage(p));
      const pdfBytes = await newDoc.save();

      // Extract metadata
      let extractedTitle = item.title;
      let extractedAuthors = item.authors;

      // Write temp file
      const tempPath = `./temp_article_2020_march_${i}.pdf`;
      fs.writeFileSync(tempPath, pdfBytes);

      // Upload to Cloudinary
      try {
          const result = await cloudinary.uploader.upload(tempPath, {
              folder: 'biospectra/2020/march',
              resource_type: 'raw',
              public_id: `article_${item.pages.replace('-', '_')}`,
              format: 'pdf'
          });

          // Extract basic info from snippet logic
          const { title, authors } = await extractMetadata(item.snippet.replace(/ \| /g, '\n'));

          let section = (item.start >= 167) ? 'Plant Sciences' : 'Animal Sciences';
          let catDoc = await mongoose.model('Category').findOne({ issue: issueDoc._id, title: section });
          if (!catDoc) {
              catDoc = await mongoose.model('Category').create({ issue: issueDoc._id, title: section });
          }

          const article = new Article({
              title: title || `Article pp. ${item.pages}`,
              authors: authors || 'Unknown',
              pages: item.pages,
              pdfUrl: result.secure_url,
              cloudinaryId: result.public_id,
              category: catDoc._id,
              issue: issueDoc._id
          });
          await article.save();

          console.log(`Successfully uploaded and saved: ${article.title}`);

      } catch (err) {
          console.error(`Error uploading article pages ${item.pages}:`, err);
      } finally {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
  }

  console.log('Finished importing March 2020 Issue');
  mongoose.connection.close();
}

run();

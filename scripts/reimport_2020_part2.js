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

const PART2_PATH = 'C:/Users/Asus/Desktop/spectra/frontend/public/books/20 March part 2.pdf';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let yearDoc = await Year.findOne({ year: 2020 });
  let issueDoc = await Issue.findOne({ year: yearDoc._id, title: 'March Issue' });
  
  // Ensure Categories exist
  let animalCat = await Category.findOne({ issue: issueDoc._id, title: 'Animal Sciences' });
  let plantCat = await Category.findOne({ issue: issueDoc._id, title: 'Plant Sciences' });
  let interCat = await Category.findOne({ issue: issueDoc._id, title: 'Interdisciplinary Sciences' });

  const p2Bytes = fs.readFileSync(PART2_PATH);
  const doc2 = await PDFDocument.load(p2Bytes);

  const metaData = JSON.parse(fs.readFileSync('temp_march_2020_meta.json', 'utf8'));
  const part2Articles = metaData.filter(item => item.start >= 183);
  
  console.log(`Re-importing ${part2Articles.length} articles from Part 2...`);

  for (let i = 0; i < part2Articles.length; i++) {
      const item = part2Articles[i];
      console.log(`Processing Article ${i + 1}/${part2Articles.length}: Pages ${item.pages}`);

      let startPage = item.start;
      let endPage = item.end;
      let pageCount = endPage - startPage + 1;
      let startIndex = startPage - 183;

      let newDoc = await PDFDocument.create();
      let pagesToCopy = [];
      for (let p = 0; p < pageCount; p++) {
          pagesToCopy.push(startIndex + p);
      }

      const copiedPages = await newDoc.copyPages(doc2, pagesToCopy);
      copiedPages.forEach(p => newDoc.addPage(p));
      const pdfBytes = await newDoc.save();

      // Extract metadata from full page text for better accuracy
      const data = await pdfParse(Buffer.from(pdfBytes));
      const text = data.text;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);

      // 1. Determine Category
      let catId = plantCat._id; // default for part 2
      if (text.includes('(IS).')) catId = interCat._id;
      else if (text.includes('(AS).')) catId = animalCat._id;
      else if (text.includes('(PS).')) catId = plantCat._id;

      // 2. Extract Abstract
      let aStart = text.toLowerCase().indexOf('abstract');
      let abstract = "";
      if (aStart !== -1) {
          let aEnd = text.toLowerCase().indexOf('key words', aStart);
          if (aEnd === -1) aEnd = text.toLowerCase().indexOf('introduction', aStart);
          if (aEnd === -1) aEnd = aStart + 1500;
          abstract = text.substring(aStart + 8, aEnd).replace(/^[\:\-\s]+/, '').trim();
      }

      // 3. Extract Title (Look around Keywords or Markers)
      let title = `Article pp. ${item.pages}`;
      let keywordsIdx = lines.findIndex(l => l.toLowerCase().includes('key words') || l.toLowerCase().includes('keywords'));
      let biospectraIdx = lines.findIndex(l => l.includes('Biospectra') && l.includes('pp.'));
      let markerIdx = lines.findIndex(l => l.toLowerCase().includes('interdisciplinary science') || l.toLowerCase().includes('animal science') || l.toLowerCase().includes('plant science') || /\d+\((IS|AS|PS)\)/.test(l));

      if (markerIdx !== -1) {
          let titleLines = [];
          for (let j = markerIdx - 1; j >= 0 && titleLines.length < 5; j--) {
              let l = lines[j];
              if (l.toLowerCase().includes('key words') || l.toLowerCase().includes('received') || l.toLowerCase().includes('phone')) break;
              titleLines.unshift(l);
          }
          if (titleLines.length > 0) title = titleLines.join(' ');
      } else if (biospectraIdx !== -1 && aStart !== -1) {
          // Check before abstract
          let abstractIdx = lines.findIndex(l => l.toLowerCase().startsWith('abstract'));
          if (abstractIdx > biospectraIdx + 1) {
              title = lines.slice(biospectraIdx + 1, abstractIdx).join(' ');
          }
      }
      
      // Cleanup Title
      title = title.replace(/Int\. Database Index:.*$/gi, '').replace(/ISSN\s*:\s*0973-7057/gi, '').replace(/^[\|\-\s\d]+/, '').replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
      if (title.length < 10) title = `Article pp. ${item.pages}`; // fallback

      // 4. Extract Authors
      let authors = "Unknown Author";
      let receivedIdx = lines.findIndex(l => l.toLowerCase().includes('received'));
      if (receivedIdx !== -1) {
          let j = receivedIdx - 1;
          while (j >= 0) {
              let line = lines[j];
              if (!line.toLowerCase().includes('university') && !line.toLowerCase().includes('department') && !line.toLowerCase().includes('college') && !line.toLowerCase().includes('p.g.') && !line.toLowerCase().includes('corresponding author')) {
                  authors = line.replace(/\*|\|/g, '').trim();
                  if (authors.length > 5 && !authors.toLowerCase().includes('abstract')) break;
              }
              j--;
          }
      }

      const tempPath = `./temp_reimport_p2_${i}.pdf`;
      fs.writeFileSync(tempPath, pdfBytes);

      try {
          const result = await cloudinary.uploader.upload(tempPath, {
              folder: 'biospectra/2020/march',
              resource_type: 'raw',
              public_id: `article_${item.pages.replace('-', '_')}`,
              format: 'pdf'
          });

          const article = new Article({
              title: title,
              authors: authors,
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

  console.log('Part 2 re-import finished.');
  process.exit(0);
}

run();

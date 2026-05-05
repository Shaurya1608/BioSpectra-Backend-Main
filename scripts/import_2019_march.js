const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const Article = require('../models/Article');
const Issue = require('../models/Issue');
const Category = require('../models/Category');
const Year = require('../models/Year');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const FULL_PDF_PATH = 'C:/Users/Asus/Desktop/spectra/frontend/public/books/19 March.pdf';
const YEAR = 2019;
const ISSUE_MONTH = 'March';
const VOLUME = 14;
const ISSUE_ORDER = 1;
const PAGE_OFFSET = 0;

const pageRanges = [
  [1, 6], [7, 12], [13, 16], [17, 20], [21, 26], [27, 30],
  [31, 36], [37, 40], [41, 42], [43, 46], [47, 50], [51, 54],
  [55, 60], [61, 64], [65, 68], [69, 72], [73, 76], [77, 80],
  [81, 84], [85, 88]
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let yearDoc = await Year.findOne({ year: YEAR });
  if (!yearDoc) yearDoc = await Year.create({ year: YEAR });

  let issueDoc = await Issue.findOne({ year: yearDoc._id, order: ISSUE_ORDER });
  if (!issueDoc) {
    issueDoc = await Issue.create({
      year: yearDoc._id,
      title: `${ISSUE_MONTH} Issue`,
      month: ISSUE_MONTH,
      order: ISSUE_ORDER,
      volume: VOLUME
    });
  }

  const fullPdfBytes = fs.readFileSync(FULL_PDF_PATH);
  const fullPdfDoc = await PDFDocument.load(fullPdfBytes);
  const tempFolder = 'temp_split_2019_march';

  if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

  for (let idx = 0; idx < pageRanges.length; idx++) {
    const range = pageRanges[idx];
    const startPage = range[0];
    const endPage = range[1];
    console.log(`Processing pages ${startPage}-${endPage}`);

    const subPdfDoc = await PDFDocument.create();
    const startIdx = startPage + PAGE_OFFSET - 1;
    const endIdx = endPage + PAGE_OFFSET - 1;

    for (let i = startIdx; i <= endIdx; i++) {
        if (i < fullPdfDoc.getPageCount()) {
            const [copiedPage] = await subPdfDoc.copyPages(fullPdfDoc, [i]);
            subPdfDoc.addPage(copiedPage);
        }
    }

    const subPdfBytes = await subPdfDoc.save();
    
    // Extract metadata
    let title = `Research Article (${startPage}-${endPage})`;
    let authors = 'Biospectra Researchers';
    let abstract = 'Scientific research article published in Biospectra journal.';
    let section = (startPage >= 81) ? 'Plant Sciences' : 'Animal Sciences';

    try {
      const data = await pdfParse(Buffer.from(subPdfBytes));
      const textRaw = data.text;
      const textSpaces = data.text.replace(/\s+/g, ' ').trim();
      const lowerText = textSpaces.toLowerCase();
      
      // Attempt Abstract
      let aStart = lowerText.indexOf('abstract');
      if (aStart !== -1) {
        aStart += 8;
        while ([' ', ':', '-', '.', '-'].includes(textSpaces[aStart])) aStart++;
        
        let aEnd = lowerText.indexOf('key words', aStart);
        if (aEnd === -1) aEnd = lowerText.indexOf('keywords', aStart);
        if (aEnd === -1) aEnd = lowerText.indexOf('introduction', aStart);
        if (aEnd === -1) aEnd = aStart + 1200;
        
        abstract = textSpaces.substring(aStart, aEnd).trim();
        if (abstract.length < 50) abstract = 'Scientific research article published in Biospectra journal.';
      }

      // Attempt Title
      const lines = textRaw.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
      let foundISSN = false;
      let possibleTitle = [];
      for (let i = 0; i < lines.length && i < 30; i++) {
         if (lines[i].includes('ISSN') && lines[i].includes('0973-7057')) {
             foundISSN = true;
             continue;
         }
         if (foundISSN) {
             if (lines[i].toLowerCase().startsWith('abstract') || lines[i].toLowerCase().startsWith('introduction')) {
                 break;
             }
             if (lines[i].length > 5) {
                possibleTitle.push(lines[i]);
             }
         }
      }
      if (possibleTitle.length > 0) {
          title = possibleTitle.join(' ');
          // Clean up if the last string is the author (it usually is)
          // Actually, authors are often right before "Received"
          let authLines = [];
          for (let i = 0; i < lines.length && i < 30; i++) {
              if (lines[i].toLowerCase().includes('received') || lines[i].toLowerCase().includes('*corresponding author')) {
                  // The line right before it is usually the Department, the line before that is Authors
                  if (i > 1) {
                     authors = lines[i-1];
                     if (authors.includes('Department') || authors.includes('University') || authors.includes('College')) {
                         authors = lines[i-2];
                     }
                  }
                  break;
              }
          }
      }
    } catch (e) {
      console.log(`  Warning: Could not parse text for metadata extraction`);
    }

    // fallback cleanup
    if (title.length > 300) title = title.substring(0, 300) + '...';
    if (authors.includes('Abstract')) authors = 'Biospectra Researchers';
    authors = authors.replace(/\\*|1|2|3|4|5/g, '').trim();

    const fileName = `2019_mar_${startPage}-${endPage}.pdf`;
    const filePath = path.join(tempFolder, fileName);
    fs.writeFileSync(filePath, subPdfBytes);

    console.log(`  Title: ${title.substring(0, 50)}...`);
    console.log(`  Authors: ${authors}`);

    console.log(`  Uploading ${fileName} to Cloudinary...`);
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: `biospectra/2019/march/${section.replace(/\s+/g, '_')}`,
      resource_type: 'raw'
    });

    let catDoc = await Category.findOne({ issue: issueDoc._id, title: section });
    if (!catDoc) {
      catDoc = await Category.create({ issue: issueDoc._id, title: section });
    }

    await Article.findOneAndUpdate(
      { title: title, issue: issueDoc._id },
      {
        authors: authors,
        abstract: abstract,
        pages: `${startPage}-${endPage}`,
        pdfUrl: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        category: catDoc._id,
        issue: issueDoc._id
      },
      { upsert: true, new: true }
    );

    console.log(`  Done.`);
    await new Promise(r => setTimeout(r, 100));
    try { fs.unlinkSync(filePath); } catch (e) {}
  }

  try { fs.rmdirSync(tempFolder); } catch (e) {}
  console.log('ALL 2019 MARCH ARTICLES IMPORTED SUCCESSFULLY!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

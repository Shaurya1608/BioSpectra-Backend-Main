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

const FULL_PDF_PATH = 'c:/Users/Asus/Desktop/spectra/frontend/public/books/Biospectra September 2019.pdf';
const YEAR = 2019;
const ISSUE_MONTH = 'September';
const VOLUME = 14;
const ISSUE_ORDER = 2;
const PAGE_OFFSET = 4; // physical page 5 is logical page 1

const articlesMetadata = [
  { id: 1, title: 'Seasonal changes in the biochemical profile of male fresh water fish Channa punctatus', authors: ['Sharda', 'Arun Kumar'], startPage: 1, endPage: 4, section: 'Animal Sciences' },
  { id: 2, title: 'Effect of water pollutants on biochemicals of gut of some aquatic insects', authors: ['Md. Sami', 'O.P. Singh'], startPage: 5, endPage: 8, section: 'Animal Sciences' },
  { id: 3, title: 'Effects of water quality on the growth of freshwater fishes in Medininagar, Palamu, Jharkhand, India', authors: ['Pradeep Kumar', 'Surabhi Saloni', 'Lakshman Sah', 'Anjana Verma'], startPage: 9, endPage: 12, section: 'Animal Sciences' },
  { id: 4, title: 'Fish diversity and abundance in relation to water quality of Gaya reservoir, Bihar (India)', authors: ['Surabhi Saloni', 'Pradeep Kumar', 'Lakshman Sah', 'Waquar Ahsan'], startPage: 13, endPage: 20, section: 'Animal Sciences' },
  { id: 5, title: 'Role of earthworms in heavy metal accumulation', authors: ['Keshav Singh', 'Nishat Fatima'], startPage: 21, endPage: 36, section: 'Animal Sciences' },
  { id: 6, title: 'Daidzein affects leptin hormone secretion in the male Wistar rat', authors: ['Sweta Kumari', 'Nayni Saxena'], startPage: 37, endPage: 42, section: 'Animal Sciences' },
  { id: 7, title: 'Fish diversity and abundance in relation to water quality of Medninagar, Palamu, Jharkhand (India)', authors: ['Pradeep Kumar', 'Anjana Verma'], startPage: 43, endPage: 50, section: 'Animal Sciences' },
  { id: 8, title: 'Effect of intragastric daidzein administration on blood testosterone level in male Wistar rat', authors: ['Sweta Kumari', 'Nayni Saxena'], startPage: 51, endPage: 58, section: 'Animal Sciences' },
  { id: 9, title: 'Comparative anatomy of ABO of estuarine gobies (Monopterus cuchia) of India', authors: ['Arti Rani', 'B.P. Yadav Bipra', 'Arun Kumar'], startPage: 59, endPage: 62, section: 'Animal Sciences' },
  { id: 10, title: 'Studies on the coleopteran pests infesting certain vegetables in Madhepura district, Bihar', authors: ['Arvind Kumar', 'Arun Kumar'], startPage: 63, endPage: 66, section: 'Animal Sciences' },
  { id: 11, title: 'Role of air breathing organs in Indian gobies of estuarine habitat', authors: ['Arti Rani', 'B.P. Yadav Bipra', 'Arun Kumar'], startPage: 67, endPage: 68, section: 'Animal Sciences' },
  { id: 12, title: 'Histological study on the olfactory bulb of adult male albino rat exposed to different concentration of manganese chloride (MnCl2)', authors: ['Deepshikha', 'B.P. Yadav Bipra', 'Arun Kumar'], startPage: 69, endPage: 72, section: 'Animal Sciences' },
  { id: 13, title: 'A survey of some coleopterans found in the cultivated vegetable lands of Madhepura, Bihar', authors: ['Arvind Kumar', 'Arun Kumar'], startPage: 73, endPage: 74, section: 'Animal Sciences' },
  { id: 14, title: 'Assessment of water quality of Baya River, Samastipur, Bihar, India', authors: ['Mithilesh Kumar Singh'], startPage: 75, endPage: 78, section: 'Animal Sciences' },
  { id: 15, title: 'Starch as precursor of bioethanol production through rdr baker’s yeast, Saccharomyces cerevisiae', authors: ['Dinesh Krishna', 'Arun Kumar'], startPage: 79, endPage: 82, section: 'Animal Sciences' },
  { id: 16, title: 'Inter-relationship of fish culture, abiotic and biotic factor of river Sone', authors: ['Kumar Vimal'], startPage: 83, endPage: 86, section: 'Animal Sciences' },
  { id: 17, title: 'Histopathological study on the effect of cyclophosphamide on the spleen of adult albino rat', authors: ['Deepshikha Samdershi', 'Khushboo Tigga', 'Priyanka Kujur', 'Suhasini Besra'], startPage: 87, endPage: 92, section: 'Animal Sciences' },
  { id: 18, title: 'Studies on the energy flow and physico-chemical parameters in some ponds of Madhepura, Bihar', authors: ['Gunjan Bharti', 'Arun Kumar'], startPage: 93, endPage: 96, section: 'Animal Sciences' },
  { id: 19, title: 'Studies on the diversity of Solenopsis species from Mathahi block of Madhepura District, Bihar', authors: ['Seema Kumari', 'Arun Kumar'], startPage: 97, endPage: 100, section: 'Animal Sciences' },
  { id: 20, title: 'Certain endangered and threatened ethnobotanically important plants of Ranchi District, Jharkhand', authors: ['Malti Kerketta'], startPage: 101, endPage: 104, section: 'Plant Sciences' },
  { id: 21, title: 'Ethnomedicinal plants of Jharkhand', authors: ['Vidyan Kumari', 'Malti Kerketta'], startPage: 105, endPage: 108, section: 'Plant Sciences' },
  { id: 22, title: 'Physico-chemical analysis of effluents of Sri Ram Paper Mill, Forbisganj, Araria', authors: ['Rupak Kumari', 'Binod Kumar Jaiswal'], startPage: 109, endPage: 112, section: 'Plant Sciences' },
  { id: 23, title: 'Ethnomedicinal study of some wild herbs of Nawhata block of Saharsa district', authors: ['Rani Rupam Kumari'], startPage: 113, endPage: 116, section: 'Plant Sciences' },
  { id: 24, title: 'A survey on identification and classification of wheat plant disease, in Madhepura, Bihar', authors: ['Jay Narayan Yadav', 'Abul Fazal'], startPage: 117, endPage: 120, section: 'Plant Sciences' },
  { id: 25, title: 'Nutritional study of some local strain of blue green algae from Saharsa district', authors: ['Swati Kumari', 'I.D.Singh'], startPage: 121, endPage: 126, section: 'Plant Sciences' },
  { id: 26, title: 'Ethnomedicinal values of some indigenous plants for treatment of skin diseases in Mandar block of Ranchi District, Jharkhand', authors: ['Malti Kerketta'], startPage: 127, endPage: 128, section: 'Plant Sciences' }
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
  const tempFolder = 'temp_split_2019';

  if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

  for (const meta of articlesMetadata) {
    console.log(`Processing: ${meta.title}`);

    const subPdfDoc = await PDFDocument.create();
    const startIdx = meta.startPage + PAGE_OFFSET - 1;
    const endIdx = meta.endPage + PAGE_OFFSET - 1;

    for (let i = startIdx; i <= endIdx; i++) {
        if (i < fullPdfDoc.getPageCount()) {
            const [copiedPage] = await subPdfDoc.copyPages(fullPdfDoc, [i]);
            subPdfDoc.addPage(copiedPage);
        }
    }

    const subPdfBytes = await subPdfDoc.save();
    
    // Extract Abstract
    let abstract = 'Scientific research article published in Biospectra journal.';
    try {
      const data = await pdfParse(Buffer.from(subPdfBytes));
      const text = data.text.replace(/\s+/g, ' ').trim();
      const lowerText = text.toLowerCase();
      
      let startIdx = lowerText.indexOf('abstract');
      if (startIdx !== -1) {
        startIdx += 8;
        while ([' ', ':', '-', '.', '-'].includes(text[startIdx])) startIdx++;
        
        let endIdx = lowerText.indexOf('key words', startIdx);
        if (endIdx === -1) endIdx = lowerText.indexOf('keywords', startIdx);
        if (endIdx === -1) endIdx = lowerText.indexOf('introduction', startIdx);
        if (endIdx === -1) endIdx = startIdx + 1200;
        
        abstract = text.substring(startIdx, endIdx).trim();
        if (abstract.length < 50) abstract = 'Scientific research article published in Biospectra journal.';
      }
    } catch (e) {
      console.log(`  Warning: Could not extract abstract`);
    }

    const fileName = `2019_${meta.startPage}-${meta.endPage}.pdf`;
    const filePath = path.join(tempFolder, fileName);
    fs.writeFileSync(filePath, subPdfBytes);

    console.log(`  Uploading ${fileName} to Cloudinary...`);
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: `biospectra/2019/september/${meta.section.replace(/\s+/g, '_')}`,
      resource_type: 'raw'
    });

    let catDoc = await Category.findOne({ issue: issueDoc._id, title: meta.section });
    if (!catDoc) {
      catDoc = await Category.create({ issue: issueDoc._id, title: meta.section });
    }

    await Article.findOneAndUpdate(
      { title: meta.title, issue: issueDoc._id },
      {
        authors: meta.authors.join(', '),
        abstract: abstract,
        pages: `${meta.startPage}-${meta.endPage}`,
        pdfUrl: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        category: catDoc._id,
        issue: issueDoc._id
      },
      { upsert: true, new: true }
    );

    console.log(`  Done.`);
    // Small delay to avoid EBUSY on Windows
    await new Promise(r => setTimeout(r, 100));
    try { fs.unlinkSync(filePath); } catch (e) {}
  }

  try { fs.rmdirSync(tempFolder); } catch (e) {}
  console.log('ALL 2019 ARTICLES IMPORTED SUCCESSFULLY!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

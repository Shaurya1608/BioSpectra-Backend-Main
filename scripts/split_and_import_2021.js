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

const FULL_PDF_PATH = 'c:/Users/Asus/Desktop/spectra/frontend/public/books/BIOSPECTRA MARCH 2021 VOL 16(1).pdf';
const YEAR = 2021;
const ISSUE_MONTH = 'March';
const VOLUME = 16;
const ISSUE_ORDER = 1;
const PAGE_OFFSET = 8; // Physical page 9 is Article page 1

const articlesMetadata = [
  { id: 1, title: 'Eco friendly management of banana scarring beetle, Basilepta subcostatum (Jacoby) in North Bihar', authors: 'Anshu Prabha, Arun Kumar & Bhuwan Bhaskar Mishra', startPage: 1, endPage: 4, section: 'Animal Sciences' },
  { id: 2, title: 'Some important plants used in the festivals of santhal tribe of Dumka district of Jharkhand', authors: 'Priyanka Tudu & Kunul Kandir', startPage: 5, endPage: 8, section: 'Plant Sciences' },
  { id: 3, title: 'Studies on the season-wise prevalence of specific intestinal parasite in the rural areas of Saran, Bihar, India', authors: 'Md. Insaf Ahmad Khan', startPage: 9, endPage: 12, section: 'Animal Sciences' },
  { id: 4, title: 'A study on the diversity of bryophytes in Madhepura with reference to pollution', authors: 'Vinita Kumari', startPage: 13, endPage: 16, section: 'Plant Sciences' },
  { id: 5, title: 'Ethnobotanical study of sacred groves (jaher) of Sri Amra of Dumka block, Dumka district, Jharkhand', authors: 'Joyena Marandi & Prabhawati Bodra', startPage: 17, endPage: 20, section: 'Plant Sciences' },
  { id: 6, title: 'A study of monthly variation in biomass and primary productivity of macrophyte of Hardia wetland of Saran District of North Bihar, India', authors: 'Chitralekha Sinha', startPage: 21, endPage: 24, section: 'Animal Sciences' },
  { id: 7, title: 'In vitro antibacterial activity of chitosan from crab, Maydelliathelphusa masoniana against Staphylococcus aureus and Pseudomonas aeruginosa', authors: 'Pulin Kerketta & Suhasini Besra', startPage: 25, endPage: 28, section: 'Animal Sciences' },
  { id: 8, title: 'Aquatic Hemipteran biodiversity of Ranchi region of Jharkhand', authors: 'Silva Kanta Lakra, Dipti Lata & Seema Keshari', startPage: 29, endPage: 32, section: 'Animal Sciences' },
  { id: 9, title: 'Variation in population density of aquatic coleopteran in a freshwater body of Ranchi District, Jharkhand with special reference to pH, temperature and dissolved oxygen', authors: 'Dipti Lata, Silva Kanta Lakra & Seema Keshari', startPage: 33, endPage: 36, section: 'Animal Sciences' },
  { id: 10, title: 'Study of fluorosis problems in Hardia Sector D (Jajpur Village) of Rajauli Block of Nawada District, Bihar', authors: 'Peeyush Kumar & Anil Kumar Singh', startPage: 37, endPage: 40, section: 'Environmental Sciences' },
  { id: 11, title: 'Impact of Citrus limonum seed on sperm parameters of male albino rats', authors: 'Haque Sana, Shamshun Nehar, Priyanka Kujur & Md.Amzad Khan', startPage: 41, endPage: 42, section: 'Animal Sciences' },
  { id: 12, title: 'Ethology and Phenology of Orchids of Jharkhand with special reference to Vanda', authors: 'Ravi Kumar Sahu & A.K. Chaudhary', startPage: 43, endPage: 46, section: 'Plant Sciences' },
  { id: 13, title: 'Determination of chlorpyrifos residue in water and liver and muscle of Clarias batrachus by HPLC with UV detection', authors: 'Priyanka Kujur, Deepshikha Samdershi, Haque Sana & Suhasini Besra', startPage: 47, endPage: 52, section: 'Animal Sciences' },
  { id: 14, title: 'Demogenetic study on ABO blood group distribution and allelic frequency in tribal population of District Kishanganj, Bihar, India', authors: 'Narendra Srivastava & Ravindra Shrivastava', startPage: 53, endPage: 58, section: 'Animal Sciences' },
  { id: 15, title: 'Studies on effects of aqueous leaf extract of Achyranthes aspera on thyroid function in male albino rats', authors: 'Md. Amzad Khan, Deepshikha Samdershi, Priyanka Kujur, Haque Sana, Kumari Neetu & Suhasini Besra', startPage: 59, endPage: 62, section: 'Animal Sciences' },
  { id: 16, title: 'Land degradation due to black stone mining in Pakur: Need Eco restoration', authors: 'Archana Kumari Jha & Prasanjit Mukherjee', startPage: 63, endPage: 68, section: 'Plant Sciences' },
  { id: 17, title: 'Pollution of water in North Koel River basin in Latehar and Palamu districts in the state of Jharkhand', authors: 'Nikita Bhagat, Shweta Mishra & P.K. Verma', startPage: 69, endPage: 72, section: 'Interdisciplinary Sciences' },
  { id: 18, title: 'Studies on aquatic macrophytic diversity in ponds of Pakur', authors: 'Prasanjit Mukherjee & Mithelesh Kumar', startPage: 73, endPage: 78, section: 'Plant Sciences' },
  { id: 19, title: 'Spermatorrhoea disease and ethnomedicinal plants with reference to Simdega District of Jharkhand, India', authors: 'Ashok Kumar Nag', startPage: 79, endPage: 80, section: 'Plant Sciences' },
  { id: 20, title: 'Comparative study of stomatal index of some ethnomedicinal plants of some species of family Malvaceae in Ranchi district of Jharkhand', authors: 'Neha Kumari & Kunul Kandir', startPage: 81, endPage: 84, section: 'Plant Sciences' },
  { id: 21, title: 'Qualitative phytochemical screening of leafy vegetable consumed by aborigine of Santal Pargana, Jharkhand', authors: 'Nitu Bharti & S.L. Bondya', startPage: 85, endPage: 88, section: 'Plant Sciences' },
  { id: 22, title: 'Comparative study of moisture content of some ethnomedicinal plants of some species of family Malvaceae in Ranchi district Jharkhand', authors: 'Neha Kumari & Kunul Kandir', startPage: 89, endPage: 92, section: 'Plant Sciences' },
  { id: 23, title: 'Determinants of antipredator behaviour in birds', authors: 'Avinash Agrawal, Sahil Gupta & Kanan Saxena', startPage: 93, endPage: 102, section: 'Animal Sciences' },
  { id: 24, title: 'Impact of Corona crisis on Environment', authors: 'Shushma Kumari', startPage: 103, endPage: 110, section: 'Animal Sciences' },
  { id: 25, title: 'The status of Lytocestus laturensis Kale & Kalshetty, 2020- a critical study and its placement under INCERTAE SEDIS', authors: 'Anjana Verma, Umapati Sahay, Ravi Rahul Singh, Shalini Kamal & Anil Kumar Singh', startPage: 111, endPage: 118, section: 'Animal Sciences' },
  { id: 26, title: 'Review study on altitudinal zonation of floral and faunal species, its richness and distribution', authors: 'Narayan Lal Choudhary, Nadim Chishty & Puneet Sharma', startPage: 119, endPage: 126, section: 'Animal Sciences' },
  { id: 27, title: 'Black Carbon - A dangerous climate forcerer mitigating strategies', authors: 'Kunjlata Lal, Anjana Verma & Umapati Sahay', startPage: 127, endPage: 130, section: 'Animal Sciences' },
  { id: 28, title: 'Resveratrol\'s myriad biological activities and interest: A brief review', authors: 'Abhinav Chauhan & Tanuja', startPage: 131, endPage: 142, section: 'Plant Sciences' },
  { id: 29, title: 'Indigenous isolate Bacillus subtilis strain mp1 mediated degradation of di -(2-ethyl hexyl) phthalate and analysis of the degradation intermediates by lc-ms', authors: 'Tanuja, Madhavi Rashmi & Shivanand Singh', startPage: 143, endPage: 148, section: 'Plant Sciences' },
  { id: 30, title: 'Seasonal variation in physico-chemical parameters of the water of River Karamnasa at Buxar, Bihar', authors: 'Govind Kumar, Ravinish Prasad, Priya Kumari & M.L.Srivastava', startPage: 149, endPage: 152, section: 'Animal Sciences' },
  { id: 31, title: 'A study on analysis of gut content in certain freshwater food fishes found in River Kosi', authors: 'Deepa Kumari, Shiv Narayan Yadav & Arun Kumar', startPage: 153, endPage: 156, section: 'Animal Sciences' },
  { id: 32, title: 'Significance of aquatic/gill/branchial respiration in Colisa fasciata with concurrent exchange mechanism', authors: 'Nutan Ranjana Das & Braj Bhusan Prasad Singh', startPage: 157, endPage: 160, section: 'Animal Sciences' },
  { id: 33, title: 'Assessment of duration dependent toxic responses induced by dietary administration of phthalate on liver indices', authors: 'Tanuja, Anjali Singh, Shivangi Singh, Kumari Puja, Ravish Kumar & J.K Singh', startPage: 161, endPage: 170, section: 'Plant Sciences' },
  { id: 34, title: 'Hormonal effects on oxygen consumption in an air breathing snakehead fish, Channa punctata', authors: 'Khushbu Kumari, Dinesh Yadav & Arun Kumar', startPage: 171, endPage: 174, section: 'Animal Sciences' },
  { id: 35, title: 'Greening textile industry reduces environmental pollution- A research on eco-friendly garments', authors: 'Astha Kiran', startPage: 175, endPage: 180, section: 'Interdisciplinary Sciences' },
  { id: 36, title: 'Study on the use of Azadirachta indica as biological control agent of Spilosoma obliqua', authors: 'Manisha Kumari', startPage: 181, endPage: 184, section: 'Animal Sciences' },
  { id: 37, title: 'Comparative study on antimicrobial activity of tulsi (Ocimum sanctum) and neem (Azadirachta indica) methanal extract', authors: 'Ashok Kumar Nag & Aparna Sinha', startPage: 185, endPage: 188, section: 'Plant Sciences' },
  { id: 38, title: 'Study on the histology of the pineal organ of Channa gachua', authors: 'Md. Reyaz Siddique & Narendra Prasad Singh', startPage: 189, endPage: 192, section: 'Animal Sciences' },
  { id: 39, title: 'Survey of fluoride content in drinking water in Ranchi City', authors: 'Purnima Shalini Orea', startPage: 193, endPage: 200, section: 'Animal Sciences' },
  { id: 40, title: 'Different varieties of prawn/shrimp leading to increase in the world demand of sea food', authors: 'Paulomi Dutta & S.B.Lal', startPage: 201, endPage: 204, section: 'Animal Sciences' },
  { id: 41, title: 'Toxicity and behaviour under Mardo intoxication in a fresh water teleost, Mystus vittatus (Bloch)', authors: 'Sudama Kumar, Md. Abul Fatah, Surabhi Saloni & Lakshman Sah', startPage: 205, endPage: 208, section: 'Animal Sciences' },
  { id: 42, title: 'Herbal medicines and Indigenous knowledge', authors: 'Vidyan Kumari & Malti Kerketta', startPage: 209, endPage: 210, section: 'Plant Sciences' },
  { id: 43, title: 'Diurnal variations in zooplankton in the waters of Taj Baj ka pokhra and Mamu-Bhanja ka pokhra', authors: 'Sujeet Kumar & Sushama Kumari', startPage: 211, endPage: 214, section: 'Animal Sciences' },
  { id: 44, title: 'Toxic effect of mardo on bimodal oxygen uptake in a fresh water fish, Labeo rohita (Ham.)', authors: 'Sudama Kumar, Surabhi Saloni & Lakshman Sah', startPage: 215, endPage: 218, section: 'Animal Sciences' },
  { id: 45, title: 'Origin, History and Route of Silk', authors: 'Sheojee Singh & Satyendra Kumar', startPage: 219, endPage: 222, section: 'Research Articles' }
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

  if (!fs.existsSync('temp_split_2021')) fs.mkdirSync('temp_split_2021');

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
        while ([' ', ':', '-', '.'].includes(text[startIdx])) startIdx++;
        
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

    const fileName = `${meta.startPage}-${meta.endPage}.pdf`;
    const filePath = path.join('temp_split_2021', fileName);
    fs.writeFileSync(filePath, subPdfBytes);

    console.log(`  Uploading ${fileName} to Cloudinary...`);
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: `biospectra/2021/march/${meta.section.replace(/\s+/g, '_')}`,
      resource_type: 'raw'
    });

    let catDoc = await Category.findOne({ issue: issueDoc._id, title: meta.section });
    if (!catDoc) {
      catDoc = await Category.create({ issue: issueDoc._id, title: meta.section });
    }

    await Article.findOneAndUpdate(
      { title: meta.title, issue: issueDoc._id },
      {
        authors: meta.authors,
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

  console.log('ALL 2021 ARTICLES IMPORTED SUCCESSFULLY!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

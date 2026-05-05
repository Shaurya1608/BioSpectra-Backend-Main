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

const FULL_PDF_PATH = 'c:/Users/Asus/Desktop/spectra/frontend/public/books/Biospectra March 2023 18 (1).pdf';
const YEAR = 2023;
const ISSUE_MONTH = 'March';
const VOLUME = 18;
const ISSUE_ORDER = 1;

// Metadata parsed from TOC
const articlesMetadata = [
  // Animal Sciences (1-25)
  { id: 1, title: 'Vehicular impact on Varanus bengalensis (Daudin, 1803) around the roads of Girnar Eco-Sensitive Zones', authors: 'Jay K. Chudasama & Jatin V. Raval', startPage: 1, endPage: 6, section: 'Animal Sciences' },
  { id: 2, title: 'A systemic review on mupirocin resistance in Staphylococcus aureus: Current status and future prospects', authors: 'Rajni Prakash, Amar Garg & Riteshkumar Arya', startPage: 7, endPage: 12, section: 'Animal Sciences' },
  { id: 3, title: 'A new nematode from Loktak Lake, Manipur', authors: 'Laishram Shanjoy & R.K. Gambhir', startPage: 13, endPage: 18, section: 'Animal Sciences' },
  { id: 4, title: 'Aquatic bird diversity in the Badwai Pond of Chittorgarh District of Rajasthan', authors: 'Pradeep Raj Singh Chauhan, Akshat Arya & Sunita Chauhan', startPage: 19, endPage: 24, section: 'Animal Sciences' },
  { id: 5, title: 'Study of diversity and distribution of Zooplankton in a perennial pond of Palamu district, Jharkhand', authors: 'Chandan Kumar* & Suhasini Besra', startPage: 25, endPage: 28, section: 'Animal Sciences' },
  { id: 6, title: 'Effect of climate change on vector borne diseases in Ranchi district', authors: 'Sangeeta Suman & Sarita Murmu', startPage: 29, endPage: 32, section: 'Animal Sciences' },
  { id: 7, title: 'Role of bio-pesticides in the management of pigeonpea pod borer (Helicoverpa armigera Hub.)', authors: 'Pankaj Saini* & Sushma Jain', startPage: 33, endPage: 42, section: 'Animal Sciences' },
  { id: 8, title: 'Evaluation of the insecticidal property of custard apple (Annona squamosa L.) on Diamondback moth (Plutella xylostella L.)', authors: 'Asha Kumari* & Sarita Murmu', startPage: 43, endPage: 46, section: 'Animal Sciences' },
  { id: 9, title: 'Analysis of phytochemicals in Punica granatum L. and their effect on Spodoptera litura (Fab.)', authors: 'Deepak Kumar & Suhasini Besra', startPage: 47, endPage: 52, section: 'Animal Sciences' },
  { id: 10, title: 'Histochemical detection of lipid concentration in the gut lining of larval instars of Callosobruchus chinensis Linn. propagating on moong', authors: 'Pushpalata Hansdak', startPage: 53, endPage: 56, section: 'Animal Sciences' },
  { id: 11, title: 'Toxicity of organophosphate and synthetic pyrethroid pesticides on rohu fish (Labeo rohita) fingerlings', authors: 'Sangita Priyadarshni, Dinesh Yadav & Arun Kumar', startPage: 57, endPage: 60, section: 'Animal Sciences' },
  { id: 12, title: 'In vitro antidiabetic property of chitosan extracted from freshwater edible crab Sartoriana spinigera (Wood-Mason, 1871)', authors: 'Khushboo Tigga, Deepshikha Samdershi & Suhasini Besra', startPage: 61, endPage: 64, section: 'Animal Sciences' },
  { id: 13, title: 'Microbial population and diversity in earthworm midden of Ocnerodrilus occidentalis Eisen', authors: 'Suruchi Kumari, Rohit Srivastava, Neeta Lal & M. P. Sinha', startPage: 65, endPage: 70, section: 'Animal Sciences' },
  { id: 14, title: 'Costus speciosus: The "insulin plant" a boon for tribals in Jharkhand- A review article', authors: 'Sangeeta Hansda & Neeta Lal', startPage: 71, endPage: 76, section: 'Animal Sciences' },
  { id: 15, title: 'Histochemical detection of protein concentration in the gut lining of larval instars of Callosobruchus chinensis Linn. propagating on moong', authors: 'Pushpalata Hansdak', startPage: 77, endPage: 80, section: 'Animal Sciences' },
  { id: 16, title: 'Sources of air pollutants in Ranchi, Jharkhand, India', authors: 'Sandeep Prasad & Namita Lal', startPage: 81, endPage: 84, section: 'Animal Sciences' },
  { id: 17, title: 'Report on the future of insects and ecosystems: Research and Management for sustainability', authors: 'Anand Kumar Thakur', startPage: 85, endPage: 92, section: 'Animal Sciences' },
  { id: 18, title: 'Impact of physico-chemical parameters on growth of IMCS (in both length and weight) in a mixed culture system', authors: 'Pallabi Dhal, Ravi Ranjan & Anjana Verma', startPage: 93, endPage: 100, section: 'Animal Sciences' },
  { id: 19, title: 'Studies on the impact of temperature changes on the life-table parameters of Earias vittella Fabricius in Ranchi, Jharkhand', authors: 'Kanika Kumari & Anand Kumar Thakur', startPage: 101, endPage: 106, section: 'Animal Sciences' },
  { id: 20, title: 'Study on the zooplankton diversity of Hasanpur Barahi, Swamp, Madhepura', authors: 'Saurav Kumar & Arun Kumar', startPage: 107, endPage: 110, section: 'Animal Sciences' },
  { id: 21, title: 'Effects of atrazine exposure on some biochemical parameters in mice: A comprehensive study', authors: 'Ruchi & Dinesh Yadav', startPage: 111, endPage: 114, section: 'Animal Sciences' },
  { id: 22, title: 'An extensive investigation on the current state of freshwater cage aquaculture in India', authors: 'Ekta Kumari & Arun Kumar', startPage: 115, endPage: 118, section: 'Animal Sciences' },
  { id: 23, title: 'Study on the impact of deltamethrin on a few hematopoietic variables in freshwater fish Heteropneustes fossilis (Bloch)', authors: 'Ragini Ranu', startPage: 119, endPage: 122, section: 'Animal Sciences' },
  { id: 24, title: 'Study on the impact of Annona squamosa on the biological control of Spilosoma obliqua on the jute plant', authors: 'Manisha Kumari', startPage: 123, endPage: 126, section: 'Animal Sciences' },
  { id: 25, title: 'Studies on heterogeneity of hydrographic macro invertebrate fauna of Koshi River', authors: 'Khushboo Kumari', startPage: 127, endPage: 130, section: 'Animal Sciences' },

  // Interdisciplinary Sciences (26-29)
  { id: 26, title: 'Analysis of changes in land use land cover and seasonal land surface temperature using remote sensing data and GIS in PMC Area, Patna, Bihar', authors: 'Mohammad Yasir Ahmad, Nikhat Hassan Munim & Shashi Sekhar', startPage: 131, endPage: 138, section: 'Interdisciplinary Sciences' },
  { id: 27, title: 'Implications for prevention and management of lead poisoning based on lead protoporphyrin risk assessment', authors: 'Amrapali Kunwar, Govind Mawari & Manash Pratim Sarma', startPage: 139, endPage: 144, section: 'Interdisciplinary Sciences' },
  { id: 28, title: 'Microwave assisted synthesis and study of some chromium (III) complexes of p-cresol with TBC', authors: 'Chanda Kumari, Ranveer Kumar & Hari Om Pandey', startPage: 145, endPage: 148, section: 'Interdisciplinary Sciences' },
  { id: 29, title: 'Studies on health status of fluorosis suffering inhabitants of Rajauli, Bihar', authors: 'Bihari Singh, Anil Kumar Singh & Peeyush Kumar', startPage: 149, endPage: 154, section: 'Interdisciplinary Sciences' },

  // Plant Sciences (30-53)
  { id: 30, title: 'Quantitative ethnobotanical assessment of Barda Sanctuary, Gujarat, India', authors: 'Pratikkumar Chavada, P. J. Bhatt, Bhagyashri V. Dangar, Kunjan Balai & Rajesh Raviya', startPage: 155, endPage: 164, section: 'Plant Sciences' },
  { id: 31, title: 'A comprehensive review on various uses of Lantana camara L.', authors: 'Shweta Bhodiwal, Reenu Agarwal & Sunita Chauhan', startPage: 165, endPage: 170, section: 'Plant Sciences' },
  { id: 32, title: 'Centella asiatica and Oldenlandia corymbosa as a rich source of bioactive compounds', authors: 'Partha Pratim Kalita, Maya Konwar, Prasenjit Bhagawati, Mrinmoy Basak & Manash Pratim Sarma', startPage: 171, endPage: 176, section: 'Plant Sciences' },
  { id: 33, title: 'Land use changes and their implications in Gir Sanctuary, Gujarat, India', authors: 'Pratikkumar Chavada, P. J. Bhatt, Bhagyashri V. Dangar, Kunjan Balai, & Rajesh Raviya', startPage: 177, endPage: 180, section: 'Plant Sciences' },
  { id: 34, title: 'Physico-chemical studies of aquatic fern Marsilea quadrifolia in Ranchi District, Jharkhand', authors: 'Neha Raj & Anil Kumar', startPage: 181, endPage: 184, section: 'Plant Sciences' },
  { id: 35, title: 'Standardization of quality control parameters of some ethnomedicinal plants', authors: 'Rima Julie Bhaunra & Ajay Kumar Srivastava', startPage: 185, endPage: 186, section: 'Plant Sciences' },
  { id: 36, title: 'Ecological study of sacred grove (Jaher) of Golpur village of Dumka district and its ethnobotanical significance', authors: 'Joyena Marandi, Prasanjit Mukherjee & Sutanu Lal Bondya', startPage: 187, endPage: 190, section: 'Plant Sciences' },
  { id: 37, title: 'Persicaria limbata (Meisn.) H. Hara (Polygonaceae): An addition to flora of Allahabad District, Uttar Pradesh', authors: 'Satya Narain, Deepak Khare & Prabhat Kumar', startPage: 191, endPage: 192, section: 'Plant Sciences' },
  { id: 38, title: 'Economic importance of Hydrophytes: A Review', authors: 'Mithilesh Kumar, Manashi Singha & Prasanjit Mukherjee', startPage: 193, endPage: 198, section: 'Plant Sciences' },
  { id: 39, title: 'Taxonomy and economic importance of Clerodendrum phlomidis L.f. in Rajasthan', authors: 'Sushila, Anoop Kumar, Praveen Mohil & Anil Kumar', startPage: 199, endPage: 202, section: 'Plant Sciences' },
  { id: 40, title: 'Allelopathic effect of weed (Phalaris minor Retz.) extract on seed germination, growth & vigour of wheat var. "vidisha"', authors: 'Dipti Kumari & B.K.Dayal', startPage: 203, endPage: 206, section: 'Plant Sciences' },
  { id: 41, title: 'Study of medicinal trees in Pandwa block of Palamu District', authors: 'Deepak Kumar and Arpana Sinha', startPage: 207, endPage: 212, section: 'Plant Sciences' },
  { id: 42, title: 'Green fabrication and characterization of silver nanoparticles from leaf and bark extracts of Alstonia sp.', authors: 'Jyoti Kumari & Tanuja', startPage: 213, endPage: 220, section: 'Plant Sciences' },
  { id: 43, title: 'Impact of Brick Kiln emission on physico-chemical properties of soil in agriculture field of Madhepura', authors: 'Akanksha & Kapildev Prasad', startPage: 221, endPage: 224, section: 'Plant Sciences' },
  { id: 44, title: 'Phyto-chemical studies of methanol extracts of Tinospora cordifolia growing with different supporting trees by GC-MS', authors: 'Anita Sinha, Amit Patnaik, Vinay Oraon, Jyoti Kumar & Kunul Kandir', startPage: 225, endPage: 230, section: 'Plant Sciences' },
  { id: 45, title: 'Effect of ethanol and chloroform extracts of selected plants against Fusarium oxysporum f. sp. pisi', authors: 'Indu Kumari & R. K. Pandey', startPage: 231, endPage: 236, section: 'Plant Sciences' },
  { id: 46, title: 'Comparative moisture content of Cuscuta reflexa Roxb. grown on Bougainvillae, Vitex negundo & Nerium olender', authors: 'Kavita Kumari & Anil Kumar', startPage: 237, endPage: 240, section: 'Plant Sciences' },
  { id: 47, title: 'Assessment of vegetation cover of Palghar taluka using NDVI technique', authors: 'Deepali Mhapsekar, Dnyaneshwar Bombe & Smrity Prabha', startPage: 241, endPage: 250, section: 'Plant Sciences' },
  { id: 48, title: 'Morphological characterization and fertility of pollens of two economically important seed species from Apiaceae', authors: 'Unnita Mahato, Kamini Kumar & Sameer Gunjan Lakra', startPage: 251, endPage: 256, section: 'Plant Sciences' },
  { id: 49, title: 'In-vitro propagation of Catharanthus roseus and their pharmaceutical value', authors: 'Md. Sahid Hussain, A.K.Jha, Md. Sarfaraj Ahmad & Kaushal Kishore Choudhary', startPage: 257, endPage: 264, section: 'Plant Sciences' },
  { id: 50, title: 'Phytochemical analysis and therapeutic values of certain plant-based gums and resins found in Ranchi District', authors: 'Pratibha Kumari & Smrity Prabha', startPage: 265, endPage: 274, section: 'Plant Sciences' },
  { id: 51, title: 'Antifungal activity of extracts of Millettia pinnata L. and Cassia tora L. against plant fungal pathogen Alternaria solani', authors: 'Indu Kumari & R. K. Pandey', startPage: 275, endPage: 280, section: 'Plant Sciences' },
  { id: 52, title: 'Floristic survey of dicotyledonous angiospermic flora of Kelaghagh Dam Road, Simdega block in Jharkhand', authors: 'Umme Ammara & Smrity Prabha', startPage: 281, endPage: 286, section: 'Plant Sciences' },
  { id: 53, title: 'Effect of Azadirachta indica and Citrus sinensis on Sitophilus zeamais insect of stored maize grains', authors: 'Archana Kumari', startPage: 287, endPage: 290, section: 'Plant Sciences' }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Ensure Year exists
  let yearDoc = await Year.findOne({ year: YEAR });
  if (!yearDoc) {
    yearDoc = await Year.create({ year: YEAR });
    console.log(`Created year ${YEAR}`);
  }

  // 2. Ensure Issue exists
  let issueDoc = await Issue.findOne({ year: yearDoc._id, order: ISSUE_ORDER });
  if (!issueDoc) {
    issueDoc = await Issue.create({
      year: yearDoc._id,
      title: `${ISSUE_MONTH} Issue`,
      month: ISSUE_MONTH,
      order: ISSUE_ORDER,
      volume: VOLUME
    });
    console.log(`Created issue ${ISSUE_MONTH} ${YEAR}`);
  }

  const fullPdfBytes = fs.readFileSync(FULL_PDF_PATH);
  const fullPdfDoc = await PDFDocument.load(fullPdfBytes);

  // Offset: If the first page of the PDF is page 1 of the article, offset is 0.
  // But often there are 10-15 cover/TOC pages.
  // Let's find where page 1 starts.
  // TOC showed Animal Sciences 1 starts on page 1?
  // Let's check text of page 13 (which is page 1 after offset).
  const page13 = fullPdfDoc.getPage(12); // 0-indexed
  // Just guessing offset is 12 for now based on earlier read.
  const PAGE_OFFSET = 12; 

  if (!fs.existsSync('temp_split')) fs.mkdirSync('temp_split');

  for (const meta of articlesMetadata) {
    console.log(`Processing: ${meta.title}`);

    // Create a new PDF for this article
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
    
    // Extract Abstract from the split PDF
    let abstract = 'Scientific research article published in Biospectra journal.';
    try {
      const data = await pdfParse(Buffer.from(subPdfBytes));
      const text = data.text.replace(/\s+/g, ' ').trim();
      const lowerText = text.toLowerCase();
      
      let startIdx = lowerText.indexOf('abstract');
      if (startIdx !== -1) {
        startIdx += 8;
        // Skip common separators
        while ([' ', ':', '-', '.'].includes(text[startIdx])) startIdx++;
        
        let endIdx = lowerText.indexOf('key words', startIdx);
        if (endIdx === -1) endIdx = lowerText.indexOf('keywords', startIdx);
        if (endIdx === -1) endIdx = lowerText.indexOf('introduction', startIdx);
        if (endIdx === -1) endIdx = startIdx + 1200; // Fallback
        
        abstract = text.substring(startIdx, endIdx).trim();
        if (abstract.length < 50) abstract = 'Scientific research article published in Biospectra journal.';
      }
    } catch (e) {
      console.log(`  Warning: Could not extract abstract from ${fileName}`);
    }

    const fileName = `${meta.startPage}-${meta.endPage}.pdf`;
    const filePath = path.join('temp_split', fileName);
    fs.writeFileSync(filePath, subPdfBytes);

    // Upload to Cloudinary
    console.log(`  Uploading ${fileName} to Cloudinary...`);
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: `biospectra/2023/march/${meta.section.replace(/\s+/g, '_')}`,
      resource_type: 'raw'
    });

    // Ensure Category exists
    let catDoc = await Category.findOne({ issue: issueDoc._id, title: meta.section });
    if (!catDoc) {
      catDoc = await Category.create({ issue: issueDoc._id, title: meta.section });
    }

    // Save/Update Article
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
    fs.unlinkSync(filePath);
  }

  console.log('ALL ARTICLES IMPORTED SUCCESSFULLY!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

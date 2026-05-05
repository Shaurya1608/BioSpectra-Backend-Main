const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const Article = require('../models/Article');
const Issue = require('../models/Issue');
const Year = require('../models/Year');
const Category = require('../models/Category');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    let yearDoc = await Year.findOne({ year: 2020 });
    let issueDoc = await Issue.findOne({ year: yearDoc._id, title: 'March Issue' });
    if (!issueDoc) process.exit(1);

    const metaData = JSON.parse(fs.readFileSync('./temp_march_2020_meta.json', 'utf8'));

    // Ensure Categories exist
    let animalCat = await Category.findOne({ issue: issueDoc._id, title: 'Animal Sciences' });
    if (!animalCat) animalCat = await Category.create({ issue: issueDoc._id, title: 'Animal Sciences' });

    let plantCat = await Category.findOne({ issue: issueDoc._id, title: 'Plant Sciences' });
    if (!plantCat) plantCat = await Category.create({ issue: issueDoc._id, title: 'Plant Sciences' });

    let interCat = await Category.findOne({ issue: issueDoc._id, title: 'Interdisciplinary Sciences' });
    if (!interCat) interCat = await Category.create({ issue: issueDoc._id, title: 'Interdisciplinary Sciences' });

    let arts = await Article.find({ issue: issueDoc._id });
    
    let updatedTitles = 0;
    let updatedCategories = 0;

    for (let art of arts) {
        let originalTitle = art.title;
        let title = originalTitle || "Unknown Title";

        // Fix title
        title = title.replace(/Int\. Database Index:.*?ISSN\s*:\s*0973-7057/gi, '');
        title = title.replace(/(Animal|Plant|Interdisciplinary)\s+Science.*?ISSN\s*:\s*0973-7057.*?pp\.?\s*\d+-\d+/gi, '');
        title = title.replace(/Biospectra\s*:\s*ISSN\s*:\s*0973-7057.*?pp\.?\s*\d+-\d+/gi, '');
        
        // Sometimes the author name gets appended at the end of the title if the title extraction was very raw
        // Let's just do a basic trim and strip leading pipes
        title = title.replace(/^\|+/, '').replace(/^\-+/, '').trim();
        
        if (title !== originalTitle) {
            art.title = title;
            updatedTitles++;
        }

        // Fix category using the snippet
        let item = metaData.find(m => m.pages === art.pages);
        if (item) {
            let snip = item.snippet.toLowerCase();
            let newCatId = null;
            
            if (snip.includes('interdisciplinary science')) {
                newCatId = interCat._id;
            } else if (snip.includes('plant science')) {
                newCatId = plantCat._id;
            } else if (snip.includes('animal science')) {
                newCatId = animalCat._id;
            }

            // Also check for articles that had wrong names
            if (newCatId && art.category.toString() !== newCatId.toString()) {
                art.category = newCatId;
                updatedCategories++;
            }
        }
        
        // Also fix the few author names that are wrong (e.g. "b ", "Sujata Kumari " instead of "Sujata Kumari", or unknown)
        if (art.authors === "b" || art.authors === "Unknown Author" || art.authors.startsWith("& ")) {
            // Just minor cleanup
            if (art.authors.startsWith("& ")) art.authors = art.authors.substring(2);
            if (art.authors === "b") art.authors = "Unknown Author";
        }

        await art.save();
    }

    console.log(`Updated ${updatedTitles} titles and ${updatedCategories} categories.`);
    process.exit(0);
}

run();

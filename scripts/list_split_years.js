const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Article = require('../models/Article');
const Issue = require('../models/Issue');
const Year = require('../models/Year');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const articles = await Article.find({ title: /\(Part/ }).populate({
    path: 'issue',
    populate: { path: 'year' }
  });
  
  const results = articles.map(a => ({
    year: a.issue?.year?.year || 'Unknown',
    title: a.title
  }));
  
  // Sort by year
  results.sort((a, b) => a.year - b.year);
  
  results.forEach(r => {
    console.log(`${r.year}: ${r.title}`);
  });
  
  process.exit(0);
}
run();

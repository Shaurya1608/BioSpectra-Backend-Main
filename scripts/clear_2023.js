const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Article = require('../models/Article');
const Year = require('../models/Year');
const Issue = require('../models/Issue');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Delete all articles that don't have an 'issue' field (cleanup)
  const res1 = await Article.deleteMany({ issue: { $exists: false } });
  console.log('Deleted', res1.deletedCount, 'articles without issue field');

  // Delete all articles for March 2023
  const y = await Year.findOne({ year: 2023 });
  if (y) {
    const issues = await Issue.find({ year: y._id });
    const issueIds = issues.map(i => i._id);
    const res2 = await Article.deleteMany({ issue: { $in: issueIds } });
    console.log('Deleted', res2.deletedCount, 'articles for 2023 issues');
  }
  
  process.exit(0);
}
run();

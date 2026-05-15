const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Year = require('./models/Year');
const Issue = require('./models/Issue');
const Category = require('./models/Category');
const Article = require('./models/Article');

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const year9999 = await Year.findOne({ year: 9999 });
        
        if (year9999) {
            console.log('--- FOUND 9999 ---');
            console.log('ID:', year9999._id);
            
            const issues = await Issue.find({ year: year9999._id });
            console.log('Issues count:', issues.length);
            
            const issueIds = issues.map(i => i._id);
            const categories = await Category.find({ issue: { $in: issueIds } });
            console.log('Categories count:', categories.length);
            
            const categoryIds = categories.map(c => c._id);
            const articles = await Article.find({ category: { $in: categoryIds } });
            console.log('Articles count:', articles.length);
        } else {
            console.log('Year 9999 does NOT exist in the database.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking data:', error);
        process.exit(1);
    }
};

checkData();

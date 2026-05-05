const Year = require('../models/Year');
const Issue = require('../models/Issue');
const Category = require('../models/Category');
const Topic = require('../models/Topic');
const Article = require('../models/Article');

// Year Controllers
exports.createYear = async (req, res) => {
    try {
        const { year } = req.body;
        const newYear = new Year({ year });
        await newYear.save();
        
        // Auto-create 2 issues for the year
        const issue1 = new Issue({ year: newYear._id, title: `Issue 1 (Jan-Jun) ${year}`, order: 1 });
        const issue2 = new Issue({ year: newYear._id, title: `Issue 2 (Jul-Dec) ${year}`, order: 2 });
        await issue1.save();
        await issue2.save();

        res.status(201).json(newYear);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getYears = async (req, res) => {
    try {
        const years = await Year.find().sort({ year: -1 });
        res.json(years);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Issue Controllers
exports.getIssuesByYear = async (req, res) => {
    try {
        const issues = await Issue.find({ year: req.params.yearId }).sort({ order: 1 });
        res.json(issues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Category (Content) Controllers
exports.createCategory = async (req, res) => {
    try {
        const { issueId, title } = req.body;
        const category = new Category({ issue: issueId, title });
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getCategoriesByIssue = async (req, res) => {
    try {
        const categories = await Category.find({ issue: req.params.issueId });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Topic Controllers
exports.createTopic = async (req, res) => {
    try {
        const { categoryId, title } = req.body;
        const topic = new Topic({ category: categoryId, title });
        await topic.save();
        res.status(201).json(topic);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getTopicsByCategory = async (req, res) => {
    try {
        const topics = await Topic.find({ category: req.params.categoryId });
        res.json(topics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Full Tree Getter (Useful for frontend navigation)
exports.getFullJournalTree = async (req, res) => {
    try {
        const tree = await Year.aggregate([
            {
                $lookup: {
                    from: 'issues',
                    localField: '_id',
                    foreignField: 'year',
                    as: 'issues'
                }
            },
            { $unwind: { path: '$issues', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'issues._id',
                    foreignField: 'issue',
                    as: 'issues.categories'
                }
            },
            // This is getting complex for aggregate, better do it in JS or multiple queries for simplicity if needed
        ]);
        // For now, let's just return years and issues as a start
        const years = await Year.find().sort({ year: -1 });
        const result = [];
        for (const y of years) {
            const issues = await Issue.find({ year: y._id }).sort({ order: 1 });
            const issuesWithData = [];
            for (const i of issues) {
                const categories = await Category.find({ issue: i._id }).sort({ createdAt: 1 });
                const categoriesWithData = [];
                for (const c of categories) {
                    let articles = await Article.find({ category: c._id });
                    
                    // Sort articles numerically by their starting page number
                    articles = articles.sort((a, b) => {
                        const pageA = parseInt((a.pages || '').split('-')[0]) || 0;
                        const pageB = parseInt((b.pages || '').split('-')[0]) || 0;
                        return pageA - pageB;
                    });

                    categoriesWithData.push({ ...c._doc, articles });
                }
                issuesWithData.push({ ...i._doc, categories: categoriesWithData });
            }
            result.push({ ...y._doc, issues: issuesWithData });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

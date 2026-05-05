const Article = require('../models/Article');
const Year = require('../models/Year');
const Issue = require('../models/Issue');
const Category = require('../models/Category');
const { cloudinary } = require('../config/cloudinary');

exports.uploadArticle = async (req, res) => {
    try {
        const { categoryId, title, authors, abstract, keywords, pages, doi } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const newArticle = new Article({
            category: categoryId,
            title,
            authors,
            abstract,
            keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
            pages,
            doi,
            pdfUrl: req.file.path,
            cloudinaryId: req.file.filename
        });

        await newArticle.save();
        res.status(201).json(newArticle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getArticlesByCategory = async (req, res) => {
    try {
        const articles = await Article.find({ category: req.params.categoryId });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id).populate({
            path: 'category',
            populate: {
                path: 'issue',
                populate: {
                    path: 'year'
                }
            }
        });
        if (!article) return res.status(404).json({ message: 'Article not found' });
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).json({ message: 'Article not found' });

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(article.cloudinaryId);
        
        // Delete from DB
        await Article.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
 
 exports.getLatestArticles = async (req, res) => {
     try {
         const limit = parseInt(req.query.limit) || 10;
         const articles = await Article.find()
             .sort({ createdAt: -1 })
             .limit(limit)
             .populate({
                 path: 'category',
                 populate: {
                     path: 'issue',
                     populate: {
                         path: 'year'
                     }
                 }
             });
         res.json(articles);
     } catch (error) {
         res.status(500).json({ message: error.message });
     }
 };

// --- HIERARCHY LOGIC ---

exports.getJournalTree = async (req, res) => {
    try {
        const years = await Year.find().sort({ year: -1 });
        const tree = await Promise.all(years.map(async (year) => {
            const issues = await Issue.find({ year: year._id }).sort({ order: 1 });
            const populatedIssues = await Promise.all(issues.map(async (issue) => {
                const categories = await Category.find({ issue: issue._id }).sort({ createdAt: 1 });
                const populatedCategories = await Promise.all(categories.map(async (cat) => {
                    const articles = await Article.find({ category: cat._id }).sort({ createdAt: -1 });
                    return { ...cat.toObject(), articles };
                }));
                return { ...issue.toObject(), categories: populatedCategories };
            }));
            return { ...year.toObject(), issues: populatedIssues };
        }));
        res.json(tree);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.initYear = async (req, res) => {
    try {
        const { year } = req.body;
        // Check if year exists
        let yearDoc = await Year.findOne({ year });
        if (yearDoc) return res.status(400).json({ message: 'Year already initialized' });
        
        yearDoc = new Year({ year });
        await yearDoc.save();

        // Auto-create 2 issues for the year
        const issue1 = new Issue({ year: yearDoc._id, title: `Issue 1 (Jan-Jun)`, order: 1 });
        const issue2 = new Issue({ year: yearDoc._id, title: `Issue 2 (Jul-Dec)`, order: 2 });
        await Promise.all([issue1.save(), issue2.save()]);

        res.status(201).json(yearDoc);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateArticle = async (req, res) => {
    try {
        const { title, authors, abstract, keywords, pages, doi, categoryId } = req.body;
        const updateData = {
            title,
            authors,
            abstract,
            pages,
            doi
        };

        if (keywords) {
            updateData.keywords = Array.isArray(keywords) ? keywords : keywords.split(',').map(k => k.trim());
        }

        if (categoryId) {
            updateData.category = categoryId;
        }

        const article = await Article.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!article) return res.status(404).json({ message: 'Article not found' });
        
        res.json(article);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        // Delete all articles in this category first
        await Article.deleteMany({ category: id });
        // Delete the category
        await Category.findByIdAndDelete(id);
        res.json({ message: 'Section and all its articles deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { issueId, title } = req.body;
        if (!issueId || !title) {
            return res.status(400).json({ message: 'Issue ID and Title are required' });
        }
        const category = new Category({ issue: issueId, title });
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        console.error('Create Category Error:', error);
        res.status(400).json({ message: error.message });
    }
};

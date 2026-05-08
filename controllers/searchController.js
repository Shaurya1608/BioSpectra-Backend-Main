const Article = require('../models/Article');
const Editorial = require('../models/Editorial');

exports.globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Query parameter q is required' });
        }

        const queryRegex = new RegExp(q, 'i');

        // Search Articles
        const articles = await Article.find({
            $or: [
                { title: queryRegex },
                { authors: queryRegex },
                { abstract: queryRegex },
                { keywords: { $in: [queryRegex] } }
            ]
        })
        .select('title authors abstract doi category issue createdAt')
        .populate({
            path: 'category',
            select: 'title issue',
            populate: {
                path: 'issue',
                select: 'order year',
                populate: {
                    path: 'year',
                    select: 'year'
                }
            }
        })
        .limit(10)
        .lean();

        // Search Editorial Board
        const editorial = await Editorial.find({
            $or: [
                { name: queryRegex },
                { role: queryRegex },
                { department: queryRegex },
                { location: queryRegex }
            ]
        })
        .limit(10)
        .lean();

        res.json({
            articles,
            editorial
        });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ message: 'Internal server error during search' });
    }
};

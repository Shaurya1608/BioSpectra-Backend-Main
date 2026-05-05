const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    authors: {
        type: String,
        required: true
    },
    abstract: {
        type: String
    },
    pdfUrl: {
        type: String,
        required: true
    },
    cloudinaryId: {
        type: String,
        required: true
    },
    keywords: [String],
    pages: String,
    doi: String,
    issue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue'
    }
}, { timestamps: true });

articleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Article', articleSchema);

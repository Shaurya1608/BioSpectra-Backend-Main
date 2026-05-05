const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    year: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Year',
        required: true
    },
    title: {
        type: String,
        required: true // e.g., "Issue 1 (Jan-Jun)" or "Issue 2 (Jul-Dec)"
    },
    order: {
        type: Number,
        enum: [1, 2],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Issue', issueSchema);

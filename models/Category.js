const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    issue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue',
        required: true
    },
    title: {
        type: String,
        required: true // e.g., "Research Articles", "Short Communications"
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);

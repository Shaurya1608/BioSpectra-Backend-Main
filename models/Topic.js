const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    title: {
        type: String,
        required: true // e.g., "Physics", "Chemistry"
    }
}, { timestamps: true });

module.exports = mongoose.model('Topic', topicSchema);

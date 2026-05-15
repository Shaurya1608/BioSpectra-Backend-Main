const mongoose = require('mongoose');

const AboutSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String },
    sectionType: { 
        type: String,
        enum: ['hero', 'founder', 'history', 'mission', 'recognition', 'publication', 'metrics'],
        required: true 
    },
    images: [{ type: String }],
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('About', AboutSchema);

const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    imageUrl: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    category: { type: String, default: 'general', enum: ['general', 'event', 'seminar', 'conference', 'workshop', 'campus'] },
    order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);

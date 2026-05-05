const mongoose = require('mongoose');

const EditorialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String },
    department: { type: String },
    location: { type: String },
    memberType: { 
        type: String, 
        enum: ['core', 'national_advisory', 'national_editor', 'foreign_editor', 'strategic'],
        required: true 
    },
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Editorial', EditorialSchema);

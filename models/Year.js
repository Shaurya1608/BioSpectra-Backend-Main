const mongoose = require('mongoose');

const yearSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true,
        unique: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Year', yearSchema);

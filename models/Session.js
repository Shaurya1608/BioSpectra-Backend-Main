const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    ipAddress: String,
    userAgent: String,
    device: {
        browser: String,
        os: String,
        device: String
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for automatic expiration if needed (optional)
// sessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

module.exports = mongoose.model('Session', sessionSchema);

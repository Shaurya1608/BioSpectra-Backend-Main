const Editorial = require('../models/Editorial');

// Get all members
exports.getAllMembers = async (req, res) => {
    try {
        const members = await Editorial.find().sort({ order: 1 });
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a member
exports.createMember = async (req, res) => {
    const member = new Editorial(req.body);
    try {
        const newMember = await member.save();
        res.status(201).json(newMember);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update a member
exports.updateMember = async (req, res) => {
    try {
        const updatedMember = await Editorial.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedMember);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a member
exports.deleteMember = async (req, res) => {
    try {
        await Editorial.findByIdAndDelete(req.params.id);
        res.json({ message: 'Member deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Bulk create (for initial migration)
exports.bulkCreate = async (req, res) => {
    try {
        const members = await Editorial.insertMany(req.body);
        res.status(201).json(members);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const About = require('../models/About');

// Get all sections
exports.getAllSections = async (req, res) => {
    try {
        const sections = await About.find().sort({ order: 1 });
        res.json(sections);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a section
exports.createSection = async (req, res) => {
    const section = new About(req.body);
    try {
        const newSection = await section.save();
        res.status(201).json(newSection);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update a section
exports.updateSection = async (req, res) => {
    try {
        const updatedSection = await About.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedSection);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a section
exports.deleteSection = async (req, res) => {
    try {
        await About.findByIdAndDelete(req.params.id);
        res.json({ message: 'Section deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Bulk create (for initial migration)
exports.bulkCreate = async (req, res) => {
    try {
        const sections = await About.insertMany(req.body);
        res.status(201).json(sections);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

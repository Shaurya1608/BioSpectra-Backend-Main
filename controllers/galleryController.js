const Gallery = require('../models/Gallery');
const { cloudinary } = require('../config/cloudinary');

// GET all gallery images
exports.getGalleryImages = async (req, res) => {
    try {
        const images = await Gallery.find().sort({ order: 1, createdAt: -1 });
        res.json(images);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST — upload a new gallery image (compressed via Cloudinary transformations)
exports.uploadGalleryImage = async (req, res) => {
    try {
        const { title, description, category, order } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }

        const newImage = new Gallery({
            title: title || 'Untitled',
            description: description || '',
            imageUrl: req.file.path,
            cloudinaryId: req.file.filename,
            category: category || 'general',
            order: order ? parseInt(order) : 0,
        });

        await newImage.save();
        res.status(201).json(newImage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// PUT — update gallery image metadata
exports.updateGalleryImage = async (req, res) => {
    try {
        const { title, description, category, order } = req.body;
        const image = await Gallery.findByIdAndUpdate(
            req.params.id,
            { title, description, category, order: parseInt(order) || 0 },
            { new: true }
        );
        if (!image) return res.status(404).json({ message: 'Image not found' });
        res.json(image);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE — remove image from DB and Cloudinary
exports.deleteGalleryImage = async (req, res) => {
    try {
        const image = await Gallery.findById(req.params.id);
        if (!image) return res.status(404).json({ message: 'Image not found' });

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(image.cloudinaryId);

        // Delete from DB
        await Gallery.findByIdAndDelete(req.params.id);

        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

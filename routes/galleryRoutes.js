const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const galleryController = require('../controllers/galleryController');

// Cloudinary storage with auto-compression for gallery images
// Industry standard: WebP format, quality auto, max 1200px width
const galleryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'spectra_gallery',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [
            { width: 1200, crop: 'limit', quality: 'auto:good', fetch_format: 'webp' }
        ],
        public_id: (req, file) => 'gallery_' + Date.now(),
    },
});

const galleryUpload = multer({ 
    storage: galleryStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

router.get('/', galleryController.getGalleryImages);
router.post('/', galleryUpload.single('image'), galleryController.uploadGalleryImage);
router.put('/:id', galleryController.updateGalleryImage);
router.delete('/:id', galleryController.deleteGalleryImage);

module.exports = router;

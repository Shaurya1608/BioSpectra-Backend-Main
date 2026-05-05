const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'spectra_articles',
        resource_type: 'raw',
        public_id: (req, file) => file.originalname.split('.')[0] + '_' + Date.now(),
    },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };

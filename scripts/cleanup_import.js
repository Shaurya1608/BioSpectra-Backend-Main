const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Models
const Year = require('../models/Year');
const Issue = require('../models/Issue');
const Category = require('../models/Category');
const Article = require('../models/Article');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function hardCleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Delete all database records
        console.log('Deleting all Journal database records...');
        const aCount = await Article.deleteMany({});
        const cCount = await Category.deleteMany({});
        const iCount = await Issue.deleteMany({});
        const yCount = await Year.deleteMany({});
        
        console.log(`Deleted: ${aCount.deletedCount} Articles, ${cCount.deletedCount} Categories, ${iCount.deletedCount} Issues, ${yCount.deletedCount} Years.`);

        // 2. Delete Cloudinary files
        console.log('Deleting Cloudinary files in "biospectra" folder...');
        let nextCursor = null;
        do {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'biospectra/',
                max_results: 500,
                next_cursor: nextCursor
            });
            
            const publicIds = result.resources.map(r => r.public_id);
            if (publicIds.length > 0) {
                console.log(`Deleting ${publicIds.length} resources...`);
                // Chunk into 100s for Cloudinary API limit
                for (let i = 0; i < publicIds.length; i += 100) {
                    const chunk = publicIds.slice(i, i + 100);
                    await cloudinary.api.delete_resources(chunk);
                }
            }
            nextCursor = result.next_cursor;
        } while (nextCursor);

        // Also check raw resources
        nextCursor = null;
        do {
            const result = await cloudinary.api.resources({
                resource_type: 'raw',
                type: 'upload',
                prefix: 'biospectra/',
                max_results: 500,
                next_cursor: nextCursor
            });
            
            const publicIds = result.resources.map(r => r.public_id);
            if (publicIds.length > 0) {
                console.log(`Deleting ${publicIds.length} raw resources...`);
                for (let i = 0; i < publicIds.length; i += 100) {
                    const chunk = publicIds.slice(i, i + 100);
                    await cloudinary.api.delete_resources(chunk, { resource_type: 'raw' });
                }
            }
            nextCursor = result.next_cursor;
        } while (nextCursor);

        console.log('\nHard cleanup completed! Database and Cloudinary are now empty.');
        process.exit(0);
    } catch (error) {
        console.error('Fatal Error during cleanup:', error);
        process.exit(1);
    }
}

hardCleanup();

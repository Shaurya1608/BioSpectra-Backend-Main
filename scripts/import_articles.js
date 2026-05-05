const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Models
const Year = require('../models/Year');
const Issue = require('../models/Issue');
const Category = require('../models/Category');
const Article = require('../models/Article');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const PDF_ROOT = path.join(__dirname, '../../frontend/public/content-article/Pdf Biospectra');
const TEMP_DIR = path.join(__dirname, '../temp_import');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

const MONTH_MAP = {
    'march': 1,
    'september': 2,
    'december': 2
};

async function extractPdfInfo(filePath, fileName) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        // Parse all pages for full text, but use first page for metadata
        const data = await pdfParse(dataBuffer);
        const allLines = data.text.split('\n').map(line => line.replace(/\s+/g, ' ').trim());
        
        // Section names we want to use as categories
        const SECTION_NAMES = [
            'Animal Science', 'Animal Sciences', 
            'Plant Science', 'Plant Sciences', 
            'Interdisciplinary Science', 'Interdisciplinary Sciences',
            'Environmental Science', 'Environmental Sciences',
            'Enviornmental Science', 'Enviornmental Sciences',
            'Enviromental Science', 'Enviromental Sciences',
            'Agricultural Science', 'Agricultural Sciences',
            'Transdisciplinary Science', 'Transdisciplinary Sciences',
            'Medical Science', 'Medical Sciences'
        ];

        const metadataLines = allLines.slice(0, 100).map(line => {
            // Some PDFs have "Biospectra : Vol... Animal Sciences" on one line.
            // We want to remove the boilerplate but keep the section name.
            let cleanedLine = line.replace(/Biospectra\s*:\s*Vol\.[^\n]*/i, (match) => {
                // If the match is the whole line, it gets removed.
                // If there is text after it (like " Animal Sciences"), it remains.
                return '';
            });
            cleanedLine = cleanedLine.replace(/Biospectra/i, '').trim();
            return cleanedLine;
        }).filter(line => {
            const lower = line.toLowerCase();
            
            // If the line contains a section name, DEFINITELY keep it
            const hasSection = SECTION_NAMES.some(s => lower.includes(s.toLowerCase()));
            if (hasSection) return true;

            return !lower.includes('vol.') && 
                   !lower.includes('no.') && 
                   !lower.startsWith('issn') &&
                   !lower.includes('page') &&
                   !lower.includes('http') &&
                   !lower.includes('www.') &&
                   !lower.includes('database index') &&
                   !lower.includes('international biannual') &&
                   line.length > 5;
        });


        let sectionName = 'Research Articles';
        let authorStartIdx = 1;

        // --- INTELLIGENT TITLE SCORING SYSTEM ---
        // Biospectra layouts are inconsistent. We score the first 25 lines to find the "most title-like" text.
        let bestTitle = null;
        let maxScore = -1;
        let bestIdx = 0;

        for (let i = 0; i < Math.min(metadataLines.length, 25); i++) {
            const line = metadataLines[i];
            const lower = line.toLowerCase();
            
            if (lower.startsWith('abstract')) break;
            if (lower.includes('received') || lower.includes('revised')) continue;
            if (lower.includes('department of') || lower.includes('dept.') || lower.includes('university')) continue;
            if (lower.includes('correspondent') || lower.includes('e-mail')) continue;
            if (lower.includes('proceedings') || lower.includes('conference') || 
                lower.includes('welfare') || lower.includes('goslanruf') ||
                lower.includes('metas') || lower.includes('organised') ||
                lower.includes('held at')) continue;
            if (lower.includes('bihar') || lower.includes('india') || lower.includes('pradesh')) continue; // Exclude address lines

            let score = line.length;
            if (line.includes('*') || line.includes('&')) score -= 60; // Heavy penalty for authors
            if (line.length < 20) score -= 40; // Penalty for short lines
            if (/^[A-Z]/.test(line)) score += 20; // Boost for starting with capital
            if (SECTION_NAMES.some(s => lower.includes(s.toLowerCase()))) score -= 100; // Ignore section names themselves

            if (score > maxScore) {
                maxScore = score;
                bestTitle = line;
                bestIdx = i;
            }
        }

        // Look-ahead to see if the title continues onto the next line
        if (bestTitle && bestIdx + 1 < metadataLines.length) {
            const nextLine = metadataLines[bestIdx + 1];
            const nextLower = nextLine.toLowerCase();
            if (nextLine.length > 25 && 
                !nextLower.includes('received') && 
                !nextLower.startsWith('abstract') && 
                !nextLine.includes('*') &&
                !nextLine.includes('&') &&
                !nextLower.includes('dept')) {
                bestTitle += ' ' + nextLine;
            }
        }
        let title = bestTitle;

        // Section Detection (Legacy logic still useful for sectionName variable)
        for (let i = 0; i < Math.min(metadataLines.length, 8); i++) {
            const lineLower = metadataLines[i].toLowerCase();
            const foundSection = SECTION_NAMES.find(s => lineLower.includes(s.toLowerCase()));
            if (foundSection) {
                sectionName = foundSection;
                break;
            }
        }

        // --- FALLBACK LOGIC FOR BROKEN PDF FONTS ---
        if (!title || title.length < 10 || title.toLowerCase().startsWith('abstract')) {
            const cleanPages = fileName ? fileName.replace('.pdf', '') : '';
            title = `Research Article (Pages ${cleanPages}) - Pending Manual Review`;
        }

        const abstractIdx = allLines.findIndex(l => l.toLowerCase().startsWith('abstract'));
        let authors = 'Biospectra Contributor';
        let abstract = 'Scientific research article published in Biospectra journal.';

        if (abstractIdx !== -1) {
            // Join all lines from abstract onwards and look for ending markers
            const fullTextFromAbstract = allLines.slice(abstractIdx).join(' ');
            const lowerText = fullTextFromAbstract.toLowerCase();
            
            let startPos = lowerText.indexOf('abstract');
            if (startPos !== -1) {
                startPos += 8;
                // Skip separators
                while ([' ', ':', '-', '.'].includes(fullTextFromAbstract[startPos])) startPos++;
                
                let endPos = lowerText.indexOf('key words', startPos);
                if (endPos === -1) endPos = lowerText.indexOf('keywords', startPos);
                if (endPos === -1) endPos = lowerText.indexOf('introduction', startPos);
                if (endPos === -1) endPos = startPos + 1200; // Fallback
                
                const extracted = fullTextFromAbstract.substring(startPos, endPos).trim();
                if (extracted.length > 50) abstract = extracted;
            }
        }

        // Author Extraction (existing logic)
        const authorIdx = metadataLines.findIndex((l, idx) => {
            if (idx >= 80) return false;
            const lower = l.toLowerCase();
            if (lower.startsWith('abstract') || lower.startsWith('introduction') || lower.startsWith('key words')) return false; // Skip common headers
            if (title && (l === title || title.includes(l))) return false; // Don't pick the title as author
            if (lower.includes('corresponding author') || lower.includes('correspondent author')) return false;
            if (lower.includes('phone') || lower.includes('mobile') || lower.includes('e-mail')) return false;
            if (lower.includes('method') || lower.includes('result') || lower.includes('discussion')) return false; // Newer PDFs have headers with &
            return l.includes('*') || l.includes('&');
        });
        if (authorIdx !== -1) {
            authors = metadataLines[authorIdx];
        }
        if (abstractIdx !== -1) {
            abstract = metadataLines.slice(abstractIdx).join(' ').substring(0, 1000);
            abstract = abstract.replace(/^abstract[-:]?\s*/i, '');
        }

        return { 
            title, 
            authors, 
            abstract, 
            sectionName,
            content: data.text 
        };
    } catch (error) {
        return null;
    }
}

async function compressPdf(filePath, fileName) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(dataBuffer);
        const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
        const tempPath = path.join(TEMP_DIR, fileName);
        fs.writeFileSync(tempPath, compressedBytes);
        return tempPath;
    } catch (error) {
        console.error(`    - Compression failed for ${fileName}, using original.`);
        return filePath;
    }
}

async function importArticles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const folders = fs.readdirSync(PDF_ROOT)
            .filter(f => fs.statSync(path.join(PDF_ROOT, f)).isDirectory());
        console.log(`Found ${folders.length} folders to process`);

        for (const folderName of folders) {
            console.log(`\nProcessing folder: ${folderName}`);
            
            const match = folderName.trim().match(/^(\d{2})\s+(.+)$/);
            if (!match) continue;

            const yearShort = match[1];
            const monthRaw = match[2].toLowerCase().trim();
            const yearFull = 2000 + parseInt(yearShort);
            const issueOrder = MONTH_MAP[monthRaw];

            if (!issueOrder) continue;

            let yearDoc = await Year.findOne({ year: yearFull });
            if (!yearDoc) yearDoc = await Year.create({ year: yearFull });

            let issueDoc = await Issue.findOne({ year: yearDoc._id, order: issueOrder });
            if (!issueDoc) {
                issueDoc = await Issue.create({
                    year: yearDoc._id,
                    title: issueOrder === 1 ? 'Issue 1 (Jan-Jun)' : 'Issue 2 (Jul-Dec)',
                    order: issueOrder
                });
            }

            let categoryDoc = await Category.findOne({ issue: issueDoc._id, title: 'Research Articles' });
            if (!categoryDoc) {
                categoryDoc = await Category.create({
                    issue: issueDoc._id,
                    title: 'Research Articles',
                    order: 1
                });
            }

            const folderPath = path.join(PDF_ROOT, folderName);
            const items = fs.readdirSync(folderPath);
            const subfolders = items.filter(f => fs.statSync(path.join(folderPath, f)).isDirectory());
            const directFiles = items.filter(f => f.endsWith('.pdf'));

            const filesToProcess = [];
            
            for (const file of directFiles) {
                filesToProcess.push({ filePath: path.join(folderPath, file), sectionHint: null, file });
            }

            for (const sub of subfolders) {
                let sectionHint = 'Research Articles';
                if (sub.toLowerCase().includes('animal')) sectionHint = 'Animal Sciences';
                else if (sub.toLowerCase().includes('plant') || sub.toLowerCase().includes('plam')) sectionHint = 'Plant Sciences';
                else if (sub.toLowerCase().includes('trans') || sub.toLowerCase().includes('inter')) sectionHint = 'Interdisciplinary Sciences';
                else if (sub.toLowerCase().includes('enviro')) sectionHint = 'Environmental Sciences';
                else if (sub.toLowerCase().includes('medical')) sectionHint = 'Medical Sciences';

                const subItems = fs.readdirSync(path.join(folderPath, sub)).filter(f => f.endsWith('.pdf'));
                for (const file of subItems) {
                    filesToProcess.push({ filePath: path.join(folderPath, sub, file), sectionHint, file });
                }
            }

            // Sort files numerically by the starting page number to guarantee ordered upload
            filesToProcess.sort((a, b) => {
                const pageA = parseInt(a.file.split('-')[0]) || 0;
                const pageB = parseInt(b.file.split('-')[0]) || 0;
                return pageA - pageB;
            });

            for (const { filePath, sectionHint, file } of filesToProcess) {
                const pageRange = file.replace('.pdf', '');

                console.log(`  - Processing ${file}...`);
                const pdfInfo = await extractPdfInfo(filePath, file);
                
                // Determine the correct category
                const finalSectionName = sectionHint || 
                    (pdfInfo?.sectionName && pdfInfo.sectionName !== 'Research Articles' ? pdfInfo.sectionName : null);
                
                let currentCategoryDoc = categoryDoc; // defaults to 'Research Articles'
                if (finalSectionName && finalSectionName !== 'Research Articles') {
                    currentCategoryDoc = await Category.findOne({ issue: issueDoc._id, title: finalSectionName });
                    if (!currentCategoryDoc) {
                        currentCategoryDoc = await Category.create({
                            issue: issueDoc._id,
                            title: finalSectionName,
                            order: 2
                        });
                    }
                }

                // Check if already imported (using the correct category ID now)
                const existingArticle = await Article.findOne({
                    category: currentCategoryDoc._id,
                    pages: pageRange
                });

                if (existingArticle) {
                    console.log(`    - Skipping: ${file} (Already imported)`);
                    continue;
                }

                const title = pdfInfo?.title || `Article (pp. ${pageRange}) - ${monthRaw} ${yearFull}`;
                const authors = pdfInfo?.authors || 'Biospectra Contributor';
                const abstract = pdfInfo?.abstract || 'Scientific research article published in Biospectra journal.';

                try {
                    let uploadPath = filePath;
                    const stats = fs.statSync(filePath);
                    const sizeMB = stats.size / (1024 * 1024);

                    if (sizeMB > 5) {
                        console.log(`    - Compressing ${file} (${sizeMB.toFixed(2)} MB)...`);
                        uploadPath = await compressPdf(filePath, file);
                        const newStats = fs.statSync(uploadPath);
                        console.log(`    - New size: ${(newStats.size / (1024 * 1024)).toFixed(2)} MB`);
                    }

                    const outputPath = uploadPath;
                    const statsFinal = fs.statSync(outputPath);
                    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
                    
                    if (statsFinal.size <= MAX_SIZE) {
                        console.log(`    - Uploading to Cloudinary...`);
                        const uploadResult = await cloudinary.uploader.upload(outputPath, {
                            folder: `biospectra/${yearFull}/${monthRaw}`,
                            resource_type: 'auto'
                        });

                        await saveArticle(uploadResult, title, authors, abstract, pageRange, currentCategoryDoc, issueDoc);
                    } else {
                        const numParts = Math.ceil(statsFinal.size / MAX_SIZE);
                        console.log(`    - File too large (${(statsFinal.size / 1024 / 1024).toFixed(2)} MB). Splitting into ${numParts} parts...`);
                        
                        const pdfBytes = fs.readFileSync(outputPath);
                        const pdfDoc = await PDFDocument.load(pdfBytes);
                        const totalPages = pdfDoc.getPageCount();
                        const pagesPerPart = Math.ceil(totalPages / numParts);

                        for (let p = 0; p < numParts; p++) {
                            const start = p * pagesPerPart;
                            const end = Math.min((p + 1) * pagesPerPart, totalPages);
                            if (start >= totalPages) break;

                            const partDoc = await PDFDocument.create();
                            const indices = Array.from({length: end - start}, (_, i) => start + i);
                            const copiedPages = await partDoc.copyPages(pdfDoc, indices);
                            copiedPages.forEach(pg => partDoc.addPage(pg));
                            
                            const partBytes = await partDoc.save({ useObjectStreams: true });
                            const partPath = outputPath.replace('.pdf', `_part${p+1}.pdf`);
                            fs.writeFileSync(partPath, partBytes);

                            console.log(`      - Uploading Part ${p+1}/${numParts}...`);
                            const uploadResult = await cloudinary.uploader.upload(partPath, {
                                folder: `biospectra/${yearFull}/${monthRaw}`,
                                resource_type: 'raw'
                            });

                            const partTitle = numParts > 1 ? `${title} (Part ${p+1}/${numParts})` : title;
                            await saveArticle(uploadResult, partTitle, authors, abstract, pageRange, currentCategoryDoc, issueDoc);
                            
                            fs.unlinkSync(partPath);
                        }
                        console.log(`    - Successfully split and uploaded as ${numParts} parts.`);
                    }

                    if (uploadPath !== filePath) fs.unlinkSync(uploadPath);

                } catch (uploadError) {
                    console.error(`    - Error:`, uploadError.message);
                }
            }
        }

        console.log('\nFresh import completed!');
        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

async function saveArticle(uploadResult, title, authors, abstract, pages, catDoc, issueDoc) {
    const Article = require('../models/Article');
    await Article.findOneAndUpdate(
        { title: title, issue: issueDoc._id },
        {
            category: catDoc._id,
            authors: authors,
            abstract: abstract,
            pdfUrl: uploadResult.secure_url,
            cloudinaryId: uploadResult.public_id,
            pages: pages,
            issue: issueDoc._id
        },
        { upsert: true, new: true }
    );
}

importArticles();

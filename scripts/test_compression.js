const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function compressPdf() {
    const inputPath = 'c:/Users/Asus/Desktop/spectra/frontend/public/content-article/Pdf Biospectra/13 march/animal/11-46.pdf';
    const outputPath = 'c:/Users/Asus/Desktop/spectra/backend/temp_compressed_test.pdf';
    
    console.log('Loading PDF...');
    const bytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(bytes);
    const newDoc = await PDFDocument.create();
    
    const pages = pdfDoc.getPages();
    console.log(`Processing ${pages.length} pages...`);
    
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Scale down to 70% (0.7)
        const scale = 0.7;
        const [embeddedPage] = await newDoc.embedPdf(pdfDoc, [i]);
        const newPage = newDoc.addPage([width * scale, height * scale]);
        
        newPage.drawPage(embeddedPage, {
            x: 0,
            y: 0,
            width: width * scale,
            height: height * scale,
        });
    }
    
    console.log('Saving compressed PDF...');
    const compressedBytes = await newDoc.save({ 
        useObjectStreams: true,
        addDefaultPage: false
    });
    
    fs.writeFileSync(outputPath, compressedBytes);
    
    const originalSize = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(2);
    const newSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
    
    console.log(`Compression Result:`);
    console.log(`Original: ${originalSize} MB`);
    console.log(`Compressed: ${newSize} MB`);
}

compressPdf().catch(console.error);

const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');

const PART1_PATH = 'C:/Users/Asus/Desktop/spectra/frontend/public/books/20 March part 1.pdf';
const PART2_PATH = 'C:/Users/Asus/Desktop/spectra/frontend/public/books/20 March part 2.pdf';

async function run() {
  const p1Bytes = fs.readFileSync(PART1_PATH);
  const p2Bytes = fs.readFileSync(PART2_PATH);
  
  const p1Text = (await pdfParse(p1Bytes)).text;
  const p2Text = (await pdfParse(p2Bytes)).text;
  const fullText = p1Text + '\n' + p2Text;

  const regex = /Vol\. 15\(1\), March, 2020, pp\.?\s*(\d+)-(\d+)/gi;
  let match;
  let ranges = [];

  while ((match = regex.exec(fullText)) !== null) {
      let start = parseInt(match[1]);
      let end = parseInt(match[2]);
      
      // avoid duplicates
      if (!ranges.find(r => r.start === start && r.end === end)) {
          ranges.push({ start, end });
      }
  }

  // sort ranges just in case
  ranges.sort((a,b) => a.start - b.start);

  const doc1 = await PDFDocument.load(p1Bytes);
  const doc2 = await PDFDocument.load(p2Bytes);

  let results = [];

  for (let r of ranges) {
      let sourceDoc = r.start <= 182 ? doc1 : doc2;
      // Convert printed page number to 0-indexed page index in the document
      // If start <= 182, index = start - 1.
      // If start > 182, index = start - 183.
      let pageIndex = r.start <= 182 ? r.start - 1 : r.start - 183;
      
      let newDoc = await PDFDocument.create();
      try {
        let [p] = await newDoc.copyPages(sourceDoc, [pageIndex]);
        newDoc.addPage(p);
        let b = await newDoc.save();
        let d = await pdfParse(Buffer.from(b));
        
        let lines = d.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let snippet = lines.slice(0, 30).join(' | ');
        
        results.push({
            pages: `${r.start}-${r.end}`,
            start: r.start,
            end: r.end,
            snippet: snippet
        });
      } catch(e) {
         console.log(`Failed at page ${r.start}`);
      }
  }

  fs.writeFileSync('temp_march_2020_meta.json', JSON.stringify(results, null, 2));
  console.log(`Found ${results.length} articles`);
}

run();

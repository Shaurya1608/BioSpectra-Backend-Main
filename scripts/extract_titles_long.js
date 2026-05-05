const fs=require('fs');
const {PDFDocument}=require('pdf-lib');
const pdfParse=require('pdf-parse');

async function run(){
    const doc=await PDFDocument.load(fs.readFileSync('C:/Users/Asus/Desktop/spectra/frontend/public/books/19 March.pdf'));
    const pageRanges=[[13,16],[17,20],[21,26],[27,30],[31,36],[37,40],[41,42],[43,46],[47,50],[51,54],[55,60],[61,64],[65,68],[69,72],[73,76],[77,80],[81,84],[85,88]];
    let out='';
    for(let r of pageRanges){
        let newDoc=await PDFDocument.create();
        let [p]=await newDoc.copyPages(doc,[r[0]-1]);
        newDoc.addPage(p);
        let b=await newDoc.save();
        let d=await pdfParse(Buffer.from(b));
        let lines=d.text.split('\n').map(l=>l.trim()).filter(l=>l.length>0).slice(0,30);
        out += `\n--- PAGES ${r[0]}-${r[1]} ---\n` + lines.join('\n');
    }
    fs.writeFileSync('temp_march_titles_long.txt', out);
}
run();

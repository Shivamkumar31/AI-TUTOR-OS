const pdfParse = require('pdf-parse');
const fs       = require('fs');

async function extractFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data   = await pdfParse(buffer);
  return {
    text  : data.text.trim(),
    pages : data.numpages,
  };
}

function cleanText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { extractFromPDF, cleanText };

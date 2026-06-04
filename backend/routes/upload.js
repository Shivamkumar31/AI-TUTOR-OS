const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuid } = require('uuid');
const { extractFromPDF, cleanText } = require('../services/extractionService');

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const dir = path.join(__dirname, '../uploads/files');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    cb(null, `${uuid()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok = ['.pdf', '.txt', '.md'].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only PDF, TXT, MD files allowed'), ok);
  },
});

/* POST /api/upload/file */
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    let text  = '';

    if (ext === '.pdf') {
      const result = await extractFromPDF(req.file.path);
      text = result.text;
    } else {
      text = fs.readFileSync(req.file.path, 'utf8');
    }

    text = cleanText(text);

    if (text.length < 60) {
      return res.status(400).json({ error: 'Could not extract enough text. Make sure the PDF is not image-only (scanned). Try pasting text instead.' });
    }

    res.json({
      success      : true,
      filename     : req.file.originalname,
      extractedText: text.substring(0, 15000),
      wordCount    : text.split(/\s+/).length,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to process file.' });
  }
});

/* POST /api/upload/text */
router.post('/text', (req, res) => {
  const { text, title } = req.body;
  if (!text || text.trim().length < 30) {
    return res.status(400).json({ error: 'Please provide at least 30 characters of content.' });
  }
  const clean = cleanText(text);
  res.json({
    success      : true,
    filename     : title || 'Pasted Notes',
    extractedText: clean.substring(0, 15000),
    wordCount    : clean.split(/\s+/).length,
  });
});

module.exports = router;

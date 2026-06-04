require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const mongoose   = require('mongoose');
const path       = require('path');

const app = express();

/* ── Security ─────────────────────────────────────────────── */
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── Database ──────────────────────────────────────────────── */
const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(e => console.log('⚠️  MongoDB not connected — sessions stored in memory.\n   Error:', e.message));
} else {
  console.log('ℹ️  No MONGODB_URI — sessions stored in memory (clears on restart).');
}

/* ── Routes ────────────────────────────────────────────────── */
app.use('/api/upload',  require('./routes/upload'));
app.use('/api/lesson',  require('./routes/lesson'));
app.use('/api/chat',    require('./routes/chat'));
app.use('/api/quiz',    require('./routes/quiz'));
app.use('/api/session', require('./routes/session'));

/* ── Health check ──────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({
    status : 'ok',
    ai     : process.env.GROQ_API_KEY ? '✅ Groq connected (FREE)' : '❌ Missing GROQ_API_KEY in .env',
    db     : mongoose.connection.readyState === 1 ? '✅ MongoDB' : '⚠️  Memory only',
    voice  : '✅ Browser Web Speech API (no key needed)',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n🚀  AI Tutor OS  →  http://localhost:' + PORT);
  console.log('🧠  AI Engine   :  Groq  (FREE)');
  console.log('🔊  Voice       :  Browser Web Speech API  (FREE)');
  console.log('🩺  Health      :  http://localhost:' + PORT + '/api/health\n');
});

const express  = require('express');
const router   = express.Router();
const { v4: uuid } = require('uuid');
const { generateLesson, reExplain } = require('../services/teachingEngine');
const store = require('../services/sessionStore');

/* POST /api/lesson/generate */
router.post('/generate', async (req, res) => {
  const { content, topic, filename } = req.body;
  if (!content || content.trim().length < 50) {
    return res.status(400).json({ error: 'Content is too short. Please provide more text.' });
  }

  try {
    console.log(`🎓 Generating lesson: ${topic || filename || 'untitled'}`);
    const lesson    = await generateLesson(content, topic);
    const sessionId = uuid();
    const session   = {
      sessionId,
      filename : filename || 'Notes',
      topic    : topic || lesson.title,
      content  : content.substring(0, 15000),
      lesson,
      quiz        : null,
      chatHistory : [],
      reAttempts  : 0,
      createdAt   : new Date().toISOString(),
    };
    await store.saveSession(session);
    res.json({ success: true, sessionId, lesson });
  } catch (err) {
    console.error('Lesson generation error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate lesson. Please try again.' });
  }
});

/* GET /api/lesson/session/:id */
router.get('/session/:sessionId', async (req, res) => {
  const session = await store.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found. Please generate a new lesson.' });
  res.json({ success: true, session });
});

/* POST /api/lesson/reexplain */
router.post('/reexplain', async (req, res) => {
  const session = await store.getSession(req.body.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });

  session.reAttempts += 1;

  try {
    const result = await reExplain(session.content, session.topic || session.lesson?.title, session.reAttempts);
    await store.saveSession(session);
    res.json({ success: true, ...result, totalAttempts: session.reAttempts });
  } catch (err) {
    console.error('Re-explain error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate new explanation.' });
  }
});

module.exports = router;

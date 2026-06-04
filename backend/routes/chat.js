const express = require('express');
const router  = express.Router();
const { chatWithTutor } = require('../services/teachingEngine');
const store = require('../services/sessionStore');

/* POST /api/chat/message */
router.post('/message', async (req, res) => {
  const { sessionId, message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is empty.' });

  const session = await store.getSession(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found. Please generate a lesson first.' });

  try {
    const reply = await chatWithTutor(message, session.content, session.chatHistory || []);

    session.chatHistory = session.chatHistory || [];
    session.chatHistory.push({ role: 'user',      content: message });
    session.chatHistory.push({ role: 'assistant', content: reply   });

    // Keep only last 20 messages to avoid token overflow
    if (session.chatHistory.length > 20) {
      session.chatHistory = session.chatHistory.slice(-20);
    }

    await store.saveSession(session);
    res.json({ success: true, reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to get reply. Please try again.' });
  }
});

/* GET /api/chat/history/:sessionId */
router.get('/history/:sessionId', async (req, res) => {
  const session = await store.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  res.json({ success: true, history: session.chatHistory || [] });
});

module.exports = router;

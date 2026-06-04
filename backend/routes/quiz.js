const express = require('express');
const router  = express.Router();
const { generateQuiz } = require('../services/teachingEngine');
const store = require('../services/sessionStore');

/* POST /api/quiz/generate */
router.post('/generate', async (req, res) => {
  const { sessionId, difficulty = 'medium' } = req.body;
  const session = await store.getSession(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });

  // Return cached quiz if same difficulty
  if (session.quiz && session.quizDifficulty === difficulty) {
    return res.json({ success: true, quiz: session.quiz, cached: true });
  }

  try {
    console.log(`📝 Generating ${difficulty} quiz for: ${session.lesson?.title}`);
    const quiz = await generateQuiz(session.content, session.lesson?.title || 'this topic', difficulty);
    session.quiz           = quiz;
    session.quizDifficulty = difficulty;
    await store.saveSession(session);
    res.json({ success: true, quiz });
  } catch (err) {
    console.error('Quiz error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate quiz.' });
  }
});

/* POST /api/quiz/submit */
router.post('/submit', async (req, res) => {
  const { sessionId, answers } = req.body;
  const session = await store.getSession(sessionId);
  if (!session?.quiz) return res.status(404).json({ error: 'Quiz not found.' });

  const questions = session.quiz.questions;
  let correct = 0;

  const results = questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctAnswer;
    if (isCorrect) correct++;
    return {
      question      : q.question,
      yourAnswer    : answers[i] || 'Not answered',
      correctAnswer : q.correctAnswer,
      isCorrect,
      explanation   : q.explanation,
    };
  });

  const score = Math.round((correct / questions.length) * 100);
  const grade = score >= 80 ? '🏆 Excellent' : score >= 60 ? '👍 Good' : score >= 40 ? '📖 Keep Practicing' : '🔄 Review Needed';

  res.json({
    success : true,
    score,
    correct,
    total   : questions.length,
    grade,
    results,
    message : score >= 70 ? '🎉 Great job! You understand this topic well.' : '📚 Review the explanations and re-read the lesson.',
  });
});

module.exports = router;

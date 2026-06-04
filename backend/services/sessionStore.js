/**
 * Session Store
 * Primary  : in-memory Map (always works, clears on restart)
 * Secondary: MongoDB (persists across restarts, optional)
 */
const memStore = new Map();

async function saveSession(data) {
  memStore.set(data.sessionId, data);
  try {
    const Session = require('../models/Session');
    await Session.findOneAndUpdate(
      { sessionId: data.sessionId },
      data,
      { upsert: true, new: true }
    );
  } catch (_) { /* MongoDB not available — memory only */ }
}

async function getSession(sessionId) {
  if (memStore.has(sessionId)) return memStore.get(sessionId);
  try {
    const Session = require('../models/Session');
    const doc = await Session.findOne({ sessionId }).lean();
    if (doc) { memStore.set(sessionId, doc); return doc; }
  } catch (_) {}
  return null;
}

async function listSessions() {
  // Prefer memory store for listing (faster)
  const list = Array.from(memStore.values()).map(s => ({
    sessionId : s.sessionId,
    filename  : s.filename,
    topic     : s.topic,
    title     : s.lesson?.title || s.filename || 'Untitled',
    createdAt : s.createdAt,
  }));
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function deleteSession(sessionId) {
  memStore.delete(sessionId);
  try {
    const Session = require('../models/Session');
    await Session.deleteOne({ sessionId });
  } catch (_) {}
}

module.exports = { saveSession, getSession, listSessions, deleteSession };

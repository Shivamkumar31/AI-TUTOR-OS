const express = require('express');
const router  = express.Router();
const store   = require('../services/sessionStore');

router.get('/list',       async (_req, res) => res.json({ success: true, sessions: await store.listSessions() }));
router.delete('/:id',     async (req, res)  => { await store.deleteSession(req.params.id); res.json({ success: true }); });

module.exports = router;

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role    : { type: String, enum: ['user', 'assistant'], required: true },
  content : { type: String, required: true },
  ts      : { type: Date, default: Date.now },
});

const SessionSchema = new mongoose.Schema({
  sessionId    : { type: String, required: true, unique: true, index: true },
  filename     : String,
  topic        : String,
  content      : String,          // extracted text (capped 15k chars)
  lesson       : mongoose.Schema.Types.Mixed,
  quiz         : mongoose.Schema.Types.Mixed,
  chatHistory  : [MessageSchema],
  reAttempts   : { type: Number, default: 0 },
  createdAt    : { type: Date, default: Date.now },
});

module.exports = mongoose.models.Session || mongoose.model('Session', SessionSchema);

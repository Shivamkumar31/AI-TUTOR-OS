/**
 * Teaching Engine  —  powered by Groq  (100% FREE)
 *
 * Groq free tier  :  14,400 requests / day
 * No credit card  :  sign up at https://console.groq.com
 *
 * Models used:
 *   SMART_MODEL  →  lesson generation + quiz  (needs quality)
 * 
 *   FAST_MODEL   →  chat replies  (needs speed)
 */

const Groq = require('groq-sdk');

let _groq = null;
function groq() {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set in .env');
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

const SMART_MODEL = 'llama-3.3-70b-versatile';   // best quality, still free
const FAST_MODEL  = 'llama-3.1-8b-instant';      // ultra-fast for chat

/* ── Teaching styles for re-explanation ────────────────────── */
const STYLES = [
  {
    name   : 'Story-Based',
    prompt : 'Explain this concept through a short, relatable story using Indian characters (Rahul, Priya, Arjun) and everyday Indian scenarios like a chai shop, cricket match, or family gathering. Make it feel like a real conversation.',
  },
  {
    name   : 'Step-by-Step Visual',
    prompt : 'Break the concept into clear numbered steps. Use arrows (→), bullet points, and describe what a diagram would look like. Keep each step to one simple sentence.',
  },
  {
    name   : 'Real-World Examples',
    prompt : 'Give three concrete real-world examples from daily Indian life — market, school, office, family, etc. Start each with "Example:" and explain how it connects to the concept.',
  },
  {
    name   : 'Simple Analogy',
    prompt : 'Explain the concept using one powerful analogy that a 10-year-old would understand. Compare it to something very familiar — cricket, cooking chai, traffic lights, a WhatsApp group. Start with "Think of it like..."',
  },
  {
    name   : 'Question & Answer',
    prompt : 'Explain using a back-and-forth Q&A format between a curious student and a wise teacher. 4-5 short exchanges. Make the student ask exactly the questions a confused person would ask.',
  },
];

/* ── Sanitize JSON string to handle control characters ──────── */
function sanitizeJSONString(str) {
  if (!str) return str;
  
  // Remove any non-printable control characters except newlines and tabs
  // Then escape newlines and carriage returns properly
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \n and \r
    .replace(/\\/g, '\\\\')   // Escape backslashes first
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\t/g, '\\t');   // Escape tabs
}

function safeParseJSON(text) {
  try {
    // First, try to clean up common JSON issues
    let cleaned = text.trim();
    
    // Remove markdown code fences if present
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/, '');
    cleaned = cleaned.replace(/\s*```$/, '');
    
    // Try to extract JSON object if there's extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    // Try parsing as-is first
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ JSON Parse Error:", err.message);
    
    // Attempt to fix common JSON issues
    try {
      let fixed = text;
      
      // Remove markdown fences
      fixed = fixed.replace(/^```json\s*/i, '');
      fixed = fixed.replace(/^```\s*/, '');
      fixed = fixed.replace(/\s*```$/, '');
      
      // Extract JSON object
      const jsonMatch = fixed.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        fixed = jsonMatch[0];
      }
      
      // Fix unescaped control characters in string values
      fixed = fixed.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, str) => {
        // Escape control characters within the string
        const escaped = sanitizeJSONString(str);
        return `"${escaped}"`;
      });
      
      console.log("\n========== FIXED JSON ATTEMPT ==========");
      console.log(fixed.substring(0, 500));
      console.log("=====================================\n");
      
      return JSON.parse(fixed);
    } catch (fixError) {
      console.log("\n========== RAW AI RESPONSE ==========");
      console.log(text);
      console.log("=====================================\n");
      throw new Error(`AI returned invalid JSON: ${err.message}`);
    }
  }
}

/* ── Helper to clean AI response text ──────────────────────── */
function cleanAIResponse(raw) {
  if (!raw) return '';
  
  // Remove any markdown code blocks
  let cleaned = raw.replace(/```json\s*/gi, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  
  // Fix common JSON formatting issues
  cleaned = cleaned.replace(/,\s*}/g, '}');  // Remove trailing commas
  cleaned = cleaned.replace(/,\s*]/g, ']');  // Remove trailing commas in arrays
  
  // Ensure quotes are properly escaped in strings
  cleaned = cleaned.replace(/(?<!\\)"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content) => {
    // Don't escape if it's already escaped
    const escaped = content.replace(/"/g, '\\"');
    return `"${escaped}"`;
  });
  
  return cleaned.trim();
}

/* ── Generate full lesson ───────────────────────────────────── */
async function generateLesson(content, topic) {
  const prompt = `You are an expert AI teacher known for making complex things simple.

A student has provided this study material:
---
${content.substring(0, 5000)}
---
Topic focus: ${topic || 'the main concepts above'}

Generate a complete, engaging lesson. Return ONLY a valid JSON object — no markdown fences, no extra text.

IMPORTANT: Escape all special characters in strings (especially newlines as \\n, quotes as \\", backslashes as \\\\).

{
  "title": "Catchy lesson title",
  "summary": "2-3 sentences explaining what the student will learn",
  "keyPoints": ["key point 1", "key point 2", "key point 3", "key point 4", "key point 5"],
  "mainExplanation": "A clear, friendly explanation in 3-4 paragraphs. Use simple words. Include one small example naturally. Write like you are talking to a friend.",
  "realWorldExample": {
    "scenario": "A specific, vivid scenario from Indian daily life that illustrates this concept",
    "explanation": "Step by step: how this scenario shows the concept",
    "conclusion": "The single most important thing to remember from this example"
  },
  "analogyExplanation": "One powerful analogy starting with: Think of it like...",
  "importantTerms": [
    { "term": "Term 1", "definition": "Plain English definition in one sentence" },
    { "term": "Term 2", "definition": "Plain English definition in one sentence" },
    { "term": "Term 3", "definition": "Plain English definition in one sentence" }
  ],
  "teachingScript": "A warm, conversational 2-3 paragraph script a teacher would read aloud to a student. Use 'you', 'imagine', 'picture this'. This will be spoken by the browser.",
  "quickRecap": "2 sentences. The absolute core idea the student must walk away with."
}`;

  try {
    const resp = await groq().chat.completions.create({
      model       : SMART_MODEL,
      messages    : [{ role: 'user', content: prompt }],
      max_tokens  : 3000,
      temperature : 0.7,
    });

    const raw = resp.choices[0].message.content;
    if (!raw) throw new Error('No response from AI');
    
    const cleaned = cleanAIResponse(raw);
    return safeParseJSON(cleaned);
  } catch (error) {
    console.error('Lesson generation error:', error.message);
    throw new Error(`Failed to generate lesson: ${error.message}`);
  }
}

/* ── Re-explain with a different style ─────────────────────── */
async function reExplain(content, topic, attempt) {
  const style = STYLES[Math.min(attempt - 1, STYLES.length - 1)];

  const prompt = `You are a patient, creative AI teacher. A student still doesn't understand "${topic}" after ${attempt - 1} explanation(s).

Original content summary:
${content.substring(0, 1500)}

Use ONLY this teaching approach: ${style.prompt}

Rules:
- Write in plain text only (no JSON, no headers, no bullet lists unless the style asks for it)
- Start with: "Let me try explaining this differently..."
- End with: "Does this make more sense now? 😊"
- Keep it under 220 words
- Be warm, patient, and encouraging throughout`;

  try {
    const resp = await groq().chat.completions.create({
      model       : FAST_MODEL,
      messages    : [{ role: 'user', content: prompt }],
      max_tokens  : 450,
      temperature : 0.85,
    });

    return {
      styleName    : style.name,
      explanation  : resp.choices[0].message.content,
      attemptNumber: attempt,
    };
  } catch (error) {
    console.error('Re-explain error:', error.message);
    throw new Error(`Failed to generate re-explanation: ${error.message}`);
  }
}

/* ── Chat with the AI tutor ─────────────────────────────────── */
async function chatWithTutor(userMessage, lessonContext, history) {
  const system = `You are a friendly, patient AI tutor. You are currently teaching this topic:

${lessonContext.substring(0, 2500)}

Your rules:
1. Answer in simple, conversational language — no jargon unless you explain it
2. Use Indian names and daily-life examples when helpful (cricket, chai, Bollywood, etc.)
3. Keep replies short — under 130 words — unless a longer explanation is truly needed
4. Be warm, encouraging, and never make the student feel bad for not understanding
5. End every reply with a short check like "Does that help?" or a follow-up question
6. If the question is unrelated to the lesson, gently redirect: "Great question! Let's keep focused on [topic] for now — ask me anything about it!"`;

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-14).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  try {
    const resp = await groq().chat.completions.create({
      model       : FAST_MODEL,
      messages,
      max_tokens  : 350,
      temperature : 0.75,
    });

    return resp.choices[0].message.content;
  } catch (error) {
    console.error('Chat error:', error.message);
    return "I'm having trouble responding right now. Could you please ask your question again? 😊";
  }
}

/* ── Generate quiz ──────────────────────────────────────────── */
async function generateQuiz(content, title, difficulty = 'medium') {
  const prompt = `You are an expert quiz creator for students.

Topic: "${title}"
Difficulty: ${difficulty}
Content:
${content.substring(0, 3500)}

Create a 5-question multiple-choice quiz. Return ONLY a valid JSON object — no markdown, no extra text.

IMPORTANT: Escape all special characters. Use \\n for newlines, \\" for quotes.

{
  "questions": [
    {
      "id": 1,
      "question": "Clear, unambiguous question?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A",
      "explanation": "Why A is correct, and why the others are wrong — explained simply in 2 sentences."
    }
  ]
}

Rules:
- Questions must test real understanding, not just memory
- Wrong options must be plausible (not obviously silly)
- Mix conceptual questions with application questions
- ${difficulty === 'easy' ? 'Focus on basic definitions and simple recall.' : difficulty === 'hard' ? 'Focus on application, analysis, and edge cases.' : 'Mix basic understanding with simple application.'}`;

  try {
    const resp = await groq().chat.completions.create({
      model       : SMART_MODEL,
      messages    : [{ role: 'user', content: prompt }],
      max_tokens  : 1800,
      temperature : 0.5,
    });

    const raw = resp.choices[0].message.content;
    if (!raw) throw new Error('No response from AI');
    
    const cleaned = cleanAIResponse(raw);
    return safeParseJSON(cleaned);
  } catch (error) {
    console.error('Quiz generation error:', error.message);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
}

module.exports = { generateLesson, reExplain, chatWithTutor, generateQuiz };
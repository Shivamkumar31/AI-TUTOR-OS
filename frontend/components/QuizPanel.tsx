'use client';
import { useState } from 'react';
import { submitQuiz } from '@/lib/api';
import toast from 'react-hot-toast';
import { Award, RotateCcw, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface Q { id: number; question: string; options: string[]; correctAnswer: string; explanation: string; }
interface Result { score: number; correct: number; total: number; grade: string; results: any[]; message: string; }

export default function QuizPanel({
  sessionId, quiz, loading, lessonTitle,
}: { sessionId: string; quiz: { questions: Q[] } | null; loading: boolean; lessonTitle: string; }) {
  const [answers,     setAnswers]     = useState<Record<number, string>>({});
  const [result,      setResult]      = useState<Result | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [showExp,     setShowExp]     = useState(false);

  const pick = (qi: number, opt: string) => {
    if (result) return;
    setAnswers(prev => ({ ...prev, [qi]: opt }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const missing = quiz.questions.length - Object.keys(answers).length;
    if (missing > 0) return toast.error(`Answer ${missing} more question${missing > 1 ? 's' : ''} first.`);
    setSubmitting(true);
    try {
      const r = await submitQuiz(sessionId, answers);
      setResult(r.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch { toast.error('Failed to submit quiz.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
      <p className="text-slate-400">Generating your quiz with Groq AI…</p>
    </div>
  );

  if (!quiz) return (
    <div className="text-center py-32 text-slate-400">Quiz not available. Please try again.</div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-slide-up">
      {/* Header */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold text-white mb-1">Quiz: {lessonTitle}</h2>
        <p className="text-slate-400 text-sm">{quiz.questions.length} questions · Select the best answer for each</p>
      </div>

      {/* Score card */}
      {result && (
        <div className={`card p-8 text-center border ${result.score >= 70 ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
          <div className="text-7xl font-display font-bold text-white mb-2">{result.score}%</div>
          <div className={`text-xl font-semibold mb-2 ${result.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{result.grade}</div>
          <p className="text-slate-400 text-sm mb-1">{result.correct} / {result.total} correct</p>
          <p className="text-slate-300 mb-6">{result.message}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => { setAnswers({}); setResult(null); setShowExp(false); }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={() => setShowExp(s => !s)}
              className="flex items-center gap-2 bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-400 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <Award className="w-4 h-4" />
              {showExp ? 'Hide' : 'Show'} Explanations
            </button>
          </div>
        </div>
      )}

      {/* Questions */}
      {quiz.questions.map((q, qi) => {
        const chosen = answers[qi];
        const qr     = result?.results?.[qi];
        return (
          <div key={q.id} className="card p-6">
            <div className="flex items-start gap-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-400 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {qi + 1}
              </span>
              <p className="text-white font-medium leading-relaxed">{q.question}</p>
            </div>
            <div className="space-y-2.5">
              {q.options.map(opt => {
                const letter = opt.charAt(0);
                let cls = 'opt';
                if (result && qr) {
                  if (letter === qr.correctAnswer)                      cls += ' correct';
                  else if (letter === chosen && !qr.isCorrect)          cls += ' wrong';
                  else                                                   cls += ' disabled';
                } else if (chosen === letter)                            cls += ' selected';
                return (
                  <div key={opt} className={cls} onClick={() => pick(qi, letter)}>
                    <div className="flex items-center gap-3">
                      {result && qr && (
                        letter === qr.correctAnswer ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        : letter === chosen && !qr.isCorrect ? <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        : <div className="w-4 h-4" />
                      )}
                      <span>{opt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {result && showExp && qr && (
              <div className={`mt-4 p-4 rounded-xl text-sm ${qr.isCorrect ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-amber-500/5 border border-amber-500/20'}`}>
                <p className={`font-semibold mb-1 ${qr.isCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {qr.isCorrect ? '✅ Correct!' : '❌ Not quite'}
                </p>
                <p className="text-slate-300">{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Submit */}
      {!result && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 glow"
        >
          {submitting
            ? <><Loader2 className="w-5 h-5 animate-spin" />Checking answers…</>
            : <><Award className="w-5 h-5" />Submit Quiz ({Object.keys(answers).length}/{quiz.questions.length} answered)</>
          }
        </button>
      )}
    </div>
  );
}

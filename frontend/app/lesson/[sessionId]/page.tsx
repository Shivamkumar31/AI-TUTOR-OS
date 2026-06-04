'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getSession, reExplain, generateQuiz as genQuiz } from '@/lib/api';
import ChatPanel from '@/components/ChatPanel';
import QuizPanel from '@/components/QuizPanel';
import VoicePlayer from '@/components/VoicePlayer';
import {
  Brain, Volume2, MessageCircle, HelpCircle, BookOpen,
  Lightbulb, ChevronDown, ChevronUp, Star, ArrowLeft,
  FileQuestion, RotateCcw, CheckCircle2, Zap, Eye,
} from 'lucide-react';

type Panel = 'lesson' | 'chat' | 'quiz';

export default function LessonPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [lesson,       setLesson]       = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [panel,        setPanel]        = useState<Panel>('lesson');
  const [showTerms,    setShowTerms]    = useState(false);
  const [rebusy,       setRebusy]       = useState(false);
  const [reExp,        setReExp]        = useState<any>(null);
  const [voiceText,    setVoiceText]    = useState<string | null>(null);
  const [quiz,         setQuiz]         = useState<any>(null);
  const [quizLoading,  setQuizLoading]  = useState(false);

  useEffect(() => { load(); }, [sessionId]);

  const load = async () => {
    try {
      const r = await getSession(sessionId);
      setLesson(r.data.session.lesson);
    } catch {
      toast.error('Session not found. Please generate a new lesson.');
      router.push('/');
    } finally { setLoading(false); }
  };

  const handleReExplain = async () => {
    setRebusy(true);
    try {
      const r = await reExplain(sessionId);
      setReExp(r.data);
      setVoiceText(null);
      toast.success(`Trying "${r.data.styleName}" approach!`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to generate new explanation.');
    } finally { setRebusy(false); }
  };

  const handleVoice = () => {
    const text = reExp?.explanation || lesson?.teachingScript || lesson?.mainExplanation || '';
    setVoiceText(text);
  };

  const handleQuiz = async () => {
    setPanel('quiz');
    if (quiz) return;
    setQuizLoading(true);
    try {
      const r = await genQuiz(sessionId);
      setQuiz(r.data.quiz);
    } catch { toast.error('Failed to generate quiz.'); }
    finally { setQuizLoading(false); }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center mx-auto mb-4 glow">
          <Brain className="w-8 h-8 text-brand-400 animate-pulse" />
        </div>
        <p className="text-slate-400">Loading your lesson…</p>
      </div>
    </div>
  );
  if (!lesson) return null;

  /* ── Nav buttons shared ── */
  const navBtns: { id: Panel; label: string; icon: any }[] = [
    { id: 'lesson', label: 'Lesson',    icon: BookOpen      },
    { id: 'chat',   label: 'Ask Tutor', icon: MessageCircle },
    { id: 'quiz',   label: 'Quiz',      icon: FileQuestion  },
  ];

  return (
    <div className="min-h-screen mesh-bg">
      {/* ── Top nav ── */}
      <nav className="border-b border-slate-800/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Brain className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <span className="font-display font-semibold text-white truncate">{lesson.title}</span>
          </div>
          <div className="flex gap-1 bg-slate-900 rounded-xl p-1 flex-shrink-0">
            {navBtns.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => id === 'quiz' ? handleQuiz() : setPanel(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${panel === id ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* ═══════════════════ LESSON PANEL ═══════════════════ */}
        {panel === 'lesson' && (
          <div className="space-y-6 animate-slide-up">

            {/* Re-explanation banner */}
            {reExp && (
              <div className="card p-6 border-l-4 border-brand-500">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 font-semibold text-sm">New style: {reExp.styleName}</span>
                  <span className="text-slate-500 text-xs">· Attempt {reExp.attemptNumber}</span>
                </div>
                <p className="text-slate-200 leading-relaxed whitespace-pre-line">{reExp.explanation}</p>
                <button
                  onClick={() => { setReExp(null); setVoiceText(null); }}
                  className="mt-3 text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Back to original lesson
                </button>
              </div>
            )}

            {/* Summary card */}
            <div className="card p-6">
              <h1 className="font-display text-2xl font-bold text-white mb-2">{lesson.title}</h1>
              <p className="text-slate-400 leading-relaxed">{lesson.summary}</p>

              {/* Key points */}
              <div className="mt-5">
                <h3 className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  What You'll Learn
                </h3>
                <ul className="space-y-2">
                  {lesson.keyPoints?.map((p: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                      <span className="text-brand-400 mt-0.5">→</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={handleVoice}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                >
                  <Volume2 className="w-4 h-4 text-brand-400" />
                  Listen to Explanation
                  <span className="text-emerald-400 text-xs">(Free)</span>
                </button>

                <button
                  onClick={handleReExplain}
                  disabled={rebusy}
                  className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  {rebusy
                    ? <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                    : <HelpCircle className="w-4 h-4" />}
                  {rebusy ? 'Finding a better way…' : "I Don't Understand"}
                </button>
              </div>

              {/* Voice player */}
              {voiceText && <VoicePlayer text={voiceText} />}
            </div>

            {/* Main explanation */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-400" />
                The Explanation
              </h2>
              <div className="space-y-3">
                {lesson.mainExplanation?.split('\n').filter((s: string) => s.trim()).map((p: string, i: number) => (
                  <p key={i} className="text-slate-300 leading-relaxed">{p}</p>
                ))}
              </div>
            </div>

            {/* Real-world example */}
            {lesson.realWorldExample && (
              <div className="card p-6 border border-emerald-500/20">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-emerald-400" />
                  Real-World Example
                </h2>
                <div className="space-y-3">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                    <p className="text-emerald-300 font-medium text-sm mb-2">📍 The Scenario</p>
                    <p className="text-slate-300">{lesson.realWorldExample.scenario}</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-4">
                    <p className="text-brand-400 font-medium text-sm mb-2">💡 The Connection</p>
                    <p className="text-slate-300">{lesson.realWorldExample.explanation}</p>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                    <p className="text-amber-400 font-medium text-sm mb-2">✅ Key Takeaway</p>
                    <p className="text-slate-300">{lesson.realWorldExample.conclusion}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analogy */}
            {lesson.analogyExplanation && (
              <div className="card p-6 border border-violet-500/20">
                <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-violet-400" />
                  Simple Analogy
                </h2>
                <p className="text-slate-200 text-lg italic leading-relaxed">"{lesson.analogyExplanation}"</p>
              </div>
            )}

            {/* Key terms */}
            {lesson.importantTerms?.length > 0 && (
              <div className="card p-6">
                <button onClick={() => setShowTerms(s => !s)} className="flex items-center justify-between w-full">
                  <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Key Terms ({lesson.importantTerms.length})
                  </h2>
                  {showTerms ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                {showTerms && (
                  <div className="mt-4 grid md:grid-cols-2 gap-3">
                    {lesson.importantTerms.map((t: any, i: number) => (
                      <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        <p className="text-brand-400 font-semibold text-sm mb-1">{t.term}</p>
                        <p className="text-slate-400 text-sm">{t.definition}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick recap */}
            <div className="card p-6 border border-brand-500/20 bg-gradient-to-r from-brand-500/5 to-violet-500/5">
              <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-400" />
                Quick Recap
              </h2>
              <p className="text-slate-200 text-lg leading-relaxed">{lesson.quickRecap}</p>
            </div>

            {/* Bottom CTA */}
            <div className="flex flex-wrap gap-4 pb-8">
              <button
                onClick={() => setPanel('chat')}
                className="flex-1 min-w-44 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-medium transition-all"
              >
                <MessageCircle className="w-5 h-5 text-brand-400" />
                Ask the AI Tutor
              </button>
              <button
                onClick={handleQuiz}
                className="flex-1 min-w-44 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white py-4 rounded-xl font-medium transition-all glow"
              >
                <FileQuestion className="w-5 h-5" />
                Take the Quiz
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════ CHAT PANEL ═══════════════════ */}
        {panel === 'chat' && (
          <ChatPanel sessionId={sessionId} lessonTitle={lesson.title} />
        )}

        {/* ═══════════════════ QUIZ PANEL ═══════════════════ */}
        {panel === 'quiz' && (
          <QuizPanel
            sessionId={sessionId}
            quiz={quiz}
            loading={quizLoading}
            lessonTitle={lesson.title}
          />
        )}
      </main>
    </div>
  );
}

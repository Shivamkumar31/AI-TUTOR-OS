'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { uploadFile, uploadText, generateLesson } from '@/lib/api';
import {
  Brain, Upload, FileText, Sparkles, Volume2, MessageCircle,
  Zap, ChevronRight, ArrowRight, BookOpen, HelpCircle, Star
} from 'lucide-react';

type Tab = 'upload' | 'paste';
type Step = 'idle' | 'uploading' | 'extracting' | 'generating';

const STEP_LABELS: Record<Step, string> = {
  idle       : '',
  uploading  : 'Uploading file…',
  extracting : 'Extracting content…',
  generating : 'AI Tutor is building your lesson…',
};

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab]         = useState<Tab>('upload');
  const [file, setFile]       = useState<File | null>(null);
  const [notes, setNotes]     = useState('');
  const [topic, setTopic]     = useState('');
  const [busy, setBusy]       = useState(false);
  const [step, setStep]       = useState<Step>('idle');

  const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) setFile(accepted[0]); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'text/markdown': ['.md'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleGenerate = async () => {
    if (tab === 'upload' && !file) return toast.error('Please select a file first.');
    if (tab === 'paste' && notes.trim().length < 50)
      return toast.error('Please paste at least 50 characters of content.');

    setBusy(true);
    const tid = toast.loading('Starting…');

    try {
      let extractedText = '';
      let filename      = 'Notes';

      if (tab === 'upload' && file) {
        setStep('uploading');
        toast.loading('Uploading file…', { id: tid });
        const fd = new FormData();
        fd.append('file', file);
        const r = await uploadFile(fd);
        extractedText = r.data.extractedText;
        filename      = r.data.filename;
        toast.loading(`Extracted ${r.data.wordCount} words — generating lesson…`, { id: tid });
      } else {
        setStep('extracting');
        const r = await uploadText(notes, topic || 'Notes');
        extractedText = r.data.extractedText;
      }

      setStep('generating');
      toast.loading('AI Tutor is creating your personalised lesson…', { id: tid });

      const r = await generateLesson(extractedText, topic, filename);
      toast.success('Lesson ready! 🎓', { id: tid });
      router.push(`/lesson/${r.data.sessionId}`);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Something went wrong.';
      toast.error(msg, { id: tid });
    } finally {
      setBusy(false);
      setStep('idle');
    }
  };

  return (
    <div className="min-h-screen mesh-bg">
      {/* ── Nav ── */}
      <nav className="border-b border-slate-800/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center glow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">AI Tutor OS</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            100% Free APIs
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* ── Hero ── */}
        <div className="text-center mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-full px-4 py-2 text-brand-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by Groq AI — Free Forever
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-5 leading-tight">
            Any PDF becomes your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-violet-400 to-purple-400">
              Personal AI Teacher
            </span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Upload notes or a PDF. Get a full lesson with real-world examples,
            voice explanation, adaptive re-teaching, and a chat tutor — all free.
          </p>
        </div>

        {/* ── Feature pills ── */}
        <div className="flex flex-wrap justify-center gap-4 mb-14">
          {[
            { icon: BookOpen,    label: 'AI Lesson'          },
            { icon: Volume2,     label: 'Voice (Browser TTS)' },
            { icon: MessageCircle, label: 'Chat Tutor'       },
            { icon: Zap,         label: 'Smart Quiz'          },
            { icon: HelpCircle,  label: 'Re-Explain × 5'     },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2 text-slate-400 text-sm bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-full">
              <Icon className="w-4 h-4 text-brand-400" />
              {label}
            </span>
          ))}
        </div>

        {/* ── Upload card ── */}
        <div className="max-w-2xl mx-auto animate-slide-up">
          <div className="card p-8">
            <h2 className="font-display text-2xl font-semibold mb-1">Start Learning</h2>
            <p className="text-slate-400 text-sm mb-6">Upload study material and let AI teach it to you</p>

            {/* Tab switcher */}
            <div className="flex gap-2 bg-slate-900 rounded-xl p-1 mb-6">
              {(['upload', 'paste'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    tab === t ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'upload' ? <Upload className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {t === 'upload' ? 'Upload File' : 'Paste Notes'}
                </button>
              ))}
            </div>

            {/* Drop zone */}
            {tab === 'upload' ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  isDragActive ? 'border-brand-500 bg-brand-500/10' :
                  file         ? 'border-emerald-500 bg-emerald-500/5' :
                                 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="font-medium text-emerald-400">{file.name}</p>
                    <p className="text-slate-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-brand-400" />
                    </div>
                    <p className="font-medium text-white mb-1">
                      {isDragActive ? 'Drop it here!' : 'Drop file here or click to browse'}
                    </p>
                    <p className="text-slate-500 text-sm">PDF, TXT, MD · Max 10 MB</p>
                  </>
                )}
              </div>
            ) : (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={7}
                placeholder={`Paste your notes, textbook content, or any study material here…\n\nExample:\nBlood relations are family connections. Types include:\n- Direct relations: father, mother, son, daughter\n- Indirect relations: uncle, aunt, cousin…`}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm placeholder-slate-600 resize-none focus:outline-none focus:border-brand-500 transition-colors"
              />
            )}

            {/* Topic input */}
            <div className="mt-4">
              <label className="block text-slate-400 text-sm mb-2">
                Focus Topic <span className="text-slate-600">(optional — helps AI zero in)</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Blood Relations, Newton's Laws, Photosynthesis, Profit & Loss…"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={busy}
              className="mt-6 w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow"
            >
              {busy ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {STEP_LABELS[step]}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate My AI Lesson
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-slate-600 text-xs mt-4">
              🧠 Groq AI (free) &nbsp;·&nbsp; 🔊 Browser Voice (free) &nbsp;·&nbsp; 📝 Unlimited lessons
            </p>
          </div>

          {/* Tip */}
          <div className="mt-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
            <p className="text-amber-400 text-sm">
              💡 First time? Paste any Wikipedia paragraph to test the system instantly — no file needed!
            </p>
          </div>
        </div>

        {/* ── How it teaches ── */}
        <div className="mt-24 text-center">
          <h2 className="font-display text-3xl font-bold mb-3">How AI Tutor OS Teaches</h2>
          <p className="text-slate-400 mb-12">Click "I Don't Understand" — the AI tries up to 5 different styles</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {[
              { n: '1', label: 'Textbook',    desc: 'Clear, structured' },
              { n: '2', label: 'Story',        desc: 'Narrative & characters' },
              { n: '3', label: 'Visual',       desc: 'Step-by-step diagram' },
              { n: '4', label: 'Examples',     desc: 'Real-life scenarios' },
              { n: '5', label: 'Analogy',      desc: 'Simple comparison' },
            ].map(({ n, label, desc }, i, arr) => (
              <div key={n} className="relative">
                <div className="card p-5 text-center h-full">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 text-sm font-bold flex items-center justify-center mx-auto mb-3">{n}</div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-slate-500 text-xs mt-1">{desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <ChevronRight className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-700 w-4 h-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Example comparison ── */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-10">The Difference</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6 border-red-500/20">
              <p className="text-red-400 font-semibold text-sm mb-4 flex items-center gap-2">❌ Traditional AI Answer</p>
              <p className="text-slate-400 font-mono text-sm leading-relaxed">
                "A is the brother of B. B is the father of C. Therefore A is the uncle of C."
              </p>
            </div>
            <div className="card p-6 border-emerald-500/20">
              <p className="text-emerald-400 font-semibold text-sm mb-4 flex items-center gap-2">
                <Star className="w-4 h-4" /> AI Tutor OS Answer
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                "Imagine a family. Rahul and Mohan are brothers. Mohan has a son named Raju.
                Now think — who is Rahul to Raju? Rahul is Raju's <strong className="text-emerald-400">uncle!</strong>
                Let's draw the family tree together…"
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

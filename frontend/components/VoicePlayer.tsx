'use client';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Settings2 } from 'lucide-react';

export default function VoicePlayer({ text }: { text: string }) {
  const [voices,    setVoices]    = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState('');
  const [rate,      setRate]      = useState(0.92);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused,  setIsPaused]  = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [supported, setSupported] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const en  = all.filter(v => v.lang.startsWith('en'));
      const list = en.length ? en : all;
      setVoices(list);
      const best = list.find(v =>
        v.name.includes('Google UK') || v.name.includes('Google') ||
        v.name.includes('Natural')   || v.name.includes('Neural')
      );
      if (best) setVoiceName(best.name);
      else if (list[0]) setVoiceName(list[0].name);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.cancel(); clearInterval(timerRef.current!); };
  }, []);

  const cleanText = text.replace(/[*_#`>]/g, '').replace(/\n+/g, ' ').substring(0, 5000);
  const DURATION_MS = (cleanText.length / 14) * (1 / rate) * 1000; // rough estimate

  const speak = () => {
    window.speechSynthesis.cancel();
    clearInterval(timerRef.current!);
    setProgress(0);

    const utt = new SpeechSynthesisUtterance(cleanText);
    utt.rate   = rate;
    utt.pitch  = 1.05;
    utt.volume = 1;

    const voice = voices.find(v => v.name === voiceName);
    if (voice) utt.voice = voice;

    const startTime = Date.now();
    utt.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.min(99, (elapsed / DURATION_MS) * 100));
      }, 300);
    };
    utt.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      clearInterval(timerRef.current!);
    };
    utt.onerror = () => { setIsPlaying(false); clearInterval(timerRef.current!); };

    window.speechSynthesis.speak(utt);
  };

  const togglePause = () => {
    if (isPaused) { window.speechSynthesis.resume(); setIsPaused(false); }
    else          { window.speechSynthesis.pause();  setIsPaused(true);  }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    clearInterval(timerRef.current!);
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  };

  if (!supported) return (
    <div className="mt-4 p-4 bg-slate-900 border border-slate-700 rounded-xl flex items-center gap-2 text-slate-400 text-sm">
      <VolumeX className="w-4 h-4" />
      Voice not supported. Please use Chrome or Edge.
    </div>
  );

  return (
    <div className="mt-4 bg-slate-900 border border-slate-700 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-brand-400" />
          <span className="text-slate-300 text-sm font-medium">Voice Explanation</span>
          <span className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">FREE</span>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isPlaying ? (
          <button onClick={speak} className="w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center transition-all glow">
            <Play className="w-4 h-4 text-white ml-0.5" />
          </button>
        ) : (
          <>
            <button onClick={togglePause} className="w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center transition-all">
              {isPaused ? <Play className="w-4 h-4 text-white ml-0.5" /> : <Pause className="w-4 h-4 text-white" />}
            </button>
            <button onClick={stop} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all">
              <Square className="w-3 h-3 text-slate-400" />
            </button>
          </>
        )}

        <div className="flex-1">
          <div className="pbar">
            <div className="pbar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-slate-500 text-xs mt-1.5">
            {isPlaying && !isPaused ? (
              <span className="flex items-center gap-1.5">
                <span className="wave"><span/><span/><span/><span/><span/></span>
                Speaking…
              </span>
            ) : isPaused ? '⏸ Paused — click play to resume'
              : progress === 100 ? '✅ Done — click play to replay'
              : 'Click ▶ to listen'}
          </p>
        </div>
      </div>

      {/* Settings */}
      {showSettings && voices.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-xs">Voice</label>
            <select
              value={voiceName}
              onChange={e => setVoiceName(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none max-w-[180px]"
            >
              {voices.map(v => (
                <option key={v.name} value={v.name}>
                  {v.name.replace('Microsoft ', '').replace(' Online (Natural) - English (India)', ' (India)').substring(0, 28)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-xs">Speed: {rate}×</label>
            <input
              type="range" min={0.6} max={1.4} step={0.05}
              value={rate}
              onChange={e => setRate(parseFloat(e.target.value))}
              className="w-24 accent-brand-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

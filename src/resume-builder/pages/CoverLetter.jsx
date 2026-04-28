import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, Copy, Download, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';
import { useResume } from '../context/ResumeContext';
import { useToast } from '../context/ToastContext';
import { aiApi } from '../services/api';

const TONES = [
  { key: 'professional', label: 'Professional', emoji: '🏢', desc: 'Formal & polished' },
  { key: 'friendly',     label: 'Friendly',     emoji: '😊', desc: 'Warm & approachable' },
  { key: 'confident',    label: 'Confident',    emoji: '💪', desc: 'Bold & assertive' },
  { key: 'enthusiastic', label: 'Enthusiastic', emoji: '🚀', desc: 'Energetic & passionate' },
];

export default function CoverLetter() {
  const { resume } = useResume();
  const toast = useToast();
  const [jd, setJd] = useState('');
  const [company, setCompany] = useState('');
  const [tone, setTone] = useState('professional');
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!jd.trim()) return toast.warning('Please paste a job description.');
    setLoading(true);
    try {
      const { cover_letter } = await aiApi.coverLetter({
        resume_content: resume.content,
        job_description: jd,
        company_name: company,
        tone,
      });
      setLetter(cover_letter);
      toast.success('Cover letter generated!');
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([letter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cover_letter.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = letter.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <Mail size={16} className="text-white" />
          </div>
          Cover Letter Generator
        </h1>
        <p className="text-sm mt-1.5" style={{ color: '#4b5563' }}>
          AI crafts a personalised cover letter from your resume and job details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Input panel ── */}
        <div className="space-y-5">
          {/* Tone selector */}
          <div>
            <label className="rb-label">Writing Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(t => (
                <button key={t.key} onClick={() => setTone(t.key)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                    ${tone === t.key
                      ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                      : 'border-white/07 text-slate-400 hover:border-white/15 hover:text-slate-200'
                    }`}
                  style={{ borderColor: tone === t.key ? 'rgba(150,230,48,0.5)' : 'rgba(255,255,255,0.07)' }}>
                  <span className="text-base">{t.emoji}</span>
                  <div>
                    <div className="text-xs font-semibold">{t.label}</div>
                    <div className="text-xs" style={{ color: '#6b7280' }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="rb-label">Company Name <span style={{ color: '#4b5563' }}>(optional)</span></label>
            <input className="rb-input" value={company}
                   onChange={e => setCompany(e.target.value)}
                   placeholder="Google, Stripe, Acme Corp…" />
          </div>

          {/* Job description */}
          <div>
            <label className="rb-label">Job Description <span className="text-red-400">*</span></label>
            <textarea className="rb-textarea" rows={10} value={jd}
                      onChange={e => setJd(e.target.value)}
                      placeholder="Paste the full job posting here — including responsibilities and requirements…" />
            {jd && (
              <p className="text-xs mt-1" style={{ color: '#4b5563' }}>
                {jd.trim().split(/\s+/).length} words
              </p>
            )}
          </div>

          <button onClick={generate} disabled={loading || !jd.trim()}
            className="rb-btn-primary rb-btn w-full justify-center text-sm">
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
              : <><Sparkles size={15} /> Generate Cover Letter</>
            }
          </button>
        </div>

        {/* ── Output panel ── */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <label className="rb-label mb-0">Generated Letter</label>
            {letter && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#4b5563' }}>{wordCount} words</span>
                <button onClick={generate} disabled={loading}
                  className="rb-btn-ghost text-xs" style={{ padding: '0.375rem 0.625rem' }}>
                  <RefreshCw size={11} />
                </button>
                <button onClick={copy}
                  className={`rb-btn-ghost text-xs ${copied ? 'text-emerald-400 !border-emerald-500/40' : ''}`}
                  style={{ padding: '0.375rem 0.625rem' }}>
                  {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                </button>
                <button onClick={download}
                  className="rb-btn-ghost text-xs" style={{ padding: '0.375rem 0.625rem' }}>
                  <Download size={11} />
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 rb-card flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="relative">
                  <Loader2 size={36} className="animate-spin text-indigo-400" />
                  <div className="absolute inset-0 rounded-full"
                       style={{ background: 'radial-gradient(circle, rgba(150,230,48,0.2), transparent)' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Crafting your cover letter…</p>
                  <p className="text-xs mt-1" style={{ color: '#4b5563' }}>This takes about 10–20 seconds</p>
                </div>
              </motion.div>
            ) : letter ? (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex-1 rb-card overflow-y-auto min-h-[400px]">
                <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans" style={{ color: '#e2e8f0' }}>
                  {letter}
                </pre>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 rb-empty min-h-[400px]">
                <div className="text-5xl mb-4">✉️</div>
                <p className="text-sm font-semibold text-white mb-1">Your cover letter will appear here</p>
                <p className="text-xs" style={{ color: '#4b5563' }}>Fill in the form and click Generate</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

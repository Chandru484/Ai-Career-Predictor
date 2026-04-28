import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, BarChart3, Briefcase, Scissors, Upload, Loader2, X, ChevronRight, TrendingUp } from 'lucide-react';
import { useResume } from '../context/ResumeContext';
import { useToast } from '../context/ToastContext';
import { aiApi } from '../services/api';
import { Modal } from '../components/ui/Modal';

function ScoreRing({ score }) {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center w-28 h-28">
      <svg className="absolute" width="112" height="112" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="56" cy="56" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="56" cy="56" r={radius} fill="none" stroke={color} strokeWidth="8"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div className="text-center z-10">
        <div className="text-3xl font-black" style={{ color }}>{score}</div>
        <div className="text-xs font-semibold" style={{ color: '#6b7280' }}>/ 100</div>
      </div>
    </div>
  );
}

function ToolCard({ icon: Icon, title, description, color, onClick, loading, badge }) {
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className="rb-card text-left w-full group relative overflow-hidden"
      style={{ cursor: loading ? 'wait' : 'pointer' }}
    >
      {/* Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
           style={{ background: `radial-gradient(circle at 20% 50%, ${color}10, transparent 70%)` }} />

      <div className="flex items-start gap-4 relative z-10">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
             style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          {loading ? <Loader2 size={22} className="animate-spin" style={{ color }} />
                   : <Icon size={22} style={{ color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">{title}</h3>
            {badge && <span className="rb-badge text-xs">{badge}</span>}
          </div>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6b7280' }}>{description}</p>
        </div>
        <ChevronRight size={14} className="shrink-0 mt-1 opacity-0 group-hover:opacity-60 transition-opacity"
                      style={{ color: '#96e630' }} />
      </div>
    </motion.button>
  );
}

export default function CareerLab() {
  const { resume, setContent } = useResume();
  const toast = useToast();
  const [atsResult, setAtsResult] = useState(null);
  const [jobMatch, setJobMatch] = useState(null);
  const [jdInput, setJdInput] = useState('');
  const [showJdModal, setShowJdModal] = useState(false);
  const [loading, setLoading] = useState(null);

  const runAts = async () => {
    setLoading('ats');
    try {
      const res = await aiApi.analyze({ resume_content: resume.content });
      setAtsResult(res);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(null); }
  };

  const runJobMatch = async () => {
    if (!jdInput.trim()) return;
    setLoading('match');
    try {
      const res = await aiApi.jobMatch({ resume_content: resume.content, job_description: jdInput });
      setJobMatch(res);
      setShowJdModal(false);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(null); }
  };

  const runTrim = async () => {
    setLoading('trim');
    try {
      const res = await aiApi.trim({ resume_content: resume.content, max_words: 550 });
      if (res.words_removed > 0) {
        setContent(res.trimmed_content);
        toast.success(`Trimmed! Removed ~${res.words_removed} words.`);
      } else {
        toast.info('Already within the word limit — no trimming needed.');
      }
    } catch (e) { toast.error(e.message); }
    finally { setLoading(null); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
            <Wand2 size={16} className="text-white" />
          </div>
          Career Lab
        </h1>
        <p className="text-sm mt-1.5" style={{ color: '#4b5563' }}>
          AI-powered tools to supercharge your resume and job search
        </p>
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ToolCard icon={BarChart3} title="ATS Score Analyzer" color="#22c55e"
          description="Get an ATS compatibility score (0–100) with strengths, improvements, and missing keywords"
          badge="Free" onClick={runAts} loading={loading === 'ats'} />
        <ToolCard icon={Briefcase} title="Job Match Engine" color="#96e630"
          description="Paste a job description to get a match percentage and see exactly what keywords you're missing"
          onClick={() => setShowJdModal(true)} loading={loading === 'match'} />
        <ToolCard icon={Scissors} title="Resume Trimmer" color="#f59e0b"
          description="Intelligently shorten your resume to under 550 words — results applied instantly to the builder"
          onClick={runTrim} loading={loading === 'trim'} />
        <ToolCard icon={Upload} title="Import from PDF" color="#0ea5e9"
          description="Upload an existing resume PDF to auto-fill the builder — use the Import PDF button in the builder"
          onClick={() => toast.info('Use the "Import PDF" button in the Resume Builder')} loading={false} />
      </div>

      {/* ATS Result */}
      <AnimatePresence>
        {atsResult && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rb-card mb-5 relative">
            <button onClick={() => setAtsResult(null)}
              className="absolute top-4 right-4 rb-btn-icon">
              <X size={14} />
            </button>
            <h2 className="font-bold text-white text-base mb-5 flex items-center gap-2">
              <BarChart3 size={17} className="text-emerald-400" /> ATS Score Analysis
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
              <ScoreRing score={atsResult.score} />
              <div className="flex-1">
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{atsResult.summary}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <p className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp size={11} /> Strengths
                </p>
                <ul className="space-y-2">
                  {atsResult.strengths?.map((s, i) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#94a3b8' }}>
                      <span className="text-emerald-400 mt-0.5 shrink-0">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <p className="text-xs font-bold text-amber-400 mb-3 uppercase tracking-wide">↑ Improvements</p>
                <ul className="space-y-2">
                  {atsResult.improvements?.map((s, i) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#94a3b8' }}>
                      <span className="text-amber-400 mt-0.5 shrink-0">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {atsResult.keywords_missing?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wide">Missing Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {atsResult.keywords_missing.map((k, i) => (
                    <span key={i} className="rb-badge-danger rb-badge text-xs">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Match Result */}
      <AnimatePresence>
        {jobMatch && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rb-card relative">
            <button onClick={() => setJobMatch(null)} className="absolute top-4 right-4 rb-btn-icon">
              <X size={14} />
            </button>
            <h2 className="font-bold text-white text-base mb-5 flex items-center gap-2">
              <Briefcase size={17} className="text-indigo-400" /> Job Match Result
            </h2>
            <div className="flex items-center gap-5 mb-5">
              <div className="text-5xl font-black" style={{ color: '#96e630' }}>{jobMatch.match_percent}%</div>
              <div className="flex-1">
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div className="h-full rounded-full bg-indigo-500"
                    initial={{ width: 0 }} animate={{ width: `${jobMatch.match_percent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }} />
                </div>
                <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                  {jobMatch.match_percent >= 80 ? '🎉 Excellent match!' : jobMatch.match_percent >= 60 ? '👍 Good match' : '⚡ Needs improvement'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <p className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wide">✓ Matched Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatch.matched_keywords?.map((k, i) => (
                    <span key={i} className="rb-badge-success rb-badge text-xs">{k}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p className="text-xs font-bold text-red-400 mb-3 uppercase tracking-wide">✕ Missing Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatch.missing_keywords?.map((k, i) => (
                    <span key={i} className="rb-badge-danger rb-badge text-xs">{k}</span>
                  ))}
                </div>
              </div>
            </div>
            {jobMatch.suggestions?.length > 0 && (
              <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(150,230,48,0.06)', border: '1px solid rgba(150,230,48,0.15)' }}>
                <p className="text-xs font-bold text-indigo-400 mb-3 uppercase tracking-wide">💡 Suggestions</p>
                <ul className="space-y-2">
                  {jobMatch.suggestions.map((s, i) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#94a3b8' }}>
                      <span className="text-indigo-400 shrink-0 mt-0.5">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* JD modal */}
      <Modal open={showJdModal} onClose={() => setShowJdModal(false)} title="Paste Job Description" size="lg">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: '#6b7280' }}>
            Paste the complete job description below. We'll analyse keyword overlap with your resume.
          </p>
          <textarea className="rb-textarea w-full" rows={10} value={jdInput}
                    onChange={e => setJdInput(e.target.value)}
                    placeholder="Senior Software Engineer at Acme Corp…\n\nWe're looking for…" />
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowJdModal(false)} className="rb-btn-ghost rb-btn">Cancel</button>
            <button onClick={runJobMatch} disabled={loading === 'match' || !jdInput.trim()}
              className="rb-btn-primary rb-btn">
              {loading === 'match' ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : 'Analyze Match'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

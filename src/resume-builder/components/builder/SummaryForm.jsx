import { useState } from 'react';
import { Wand2, Sparkles } from 'lucide-react';
import { useResume } from '../../context/ResumeContext';
import { useToast } from '../../context/ToastContext';
import { aiApi } from '../../services/api';
import { Spinner } from '../ui/Spinner';

export default function SummaryForm() {
  const { resume, setContent } = useResume();
  const toast = useToast();
  const [enhancing, setEnhancing] = useState(false);
  const summary = resume.content.summary || '';

  const update = (val) => setContent({ summary: val });

  const enhance = async () => {
    if (!summary.trim()) return toast.warning('Write a summary first.');
    setEnhancing(true);
    try {
      const { enhanced } = await aiApi.enhance({
        text: summary,
        context: 'professional resume summary',
      });
      update(enhanced);
      toast.success('Summary enhanced!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnhancing(false);
    }
  };

  const charCount = summary.length;
  const isIdeal = charCount >= 150 && charCount <= 400;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">📝</span>
        <span className="rb-section-title mb-0">Professional Summary</span>
      </div>

      {/* Tips */}
      <div className="rounded-xl p-3 text-xs leading-relaxed"
           style={{ background: 'rgba(150,230,48,0.08)', border: '1px solid rgba(150,230,48,0.15)', color: '#8892a4' }}>
        <Sparkles size={11} className="inline mr-1.5 text-indigo-400" />
        Keep it <strong className="text-indigo-300">150–400 characters</strong> — 2–3 sentences highlighting your core strengths.
      </div>

      <textarea
        className="rb-textarea"
        rows={6}
        value={summary}
        onChange={e => update(e.target.value)}
        placeholder="Passionate software engineer with 3+ years building scalable web applications using React and Python…"
      />

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${isIdeal ? 'text-emerald-400' : charCount > 400 ? 'text-red-400' : 'text-slate-500'}`}>
          {charCount} / 400 chars {isIdeal && '✓'}
        </span>
        <button onClick={enhance} disabled={enhancing || !summary.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300"
          style={{
            background: (!summary.trim() || enhancing) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, rgba(150,230,48,0.2), rgba(200,240,62,0.1))',
            color: (!summary.trim() || enhancing) ? '#6b7280' : '#96e630',
            border: `1px solid ${(!summary.trim() || enhancing) ? 'rgba(255,255,255,0.05)' : 'rgba(150,230,48,0.3)'}`,
            boxShadow: (!summary.trim() || enhancing) ? 'none' : '0 0 10px rgba(150,230,48,0.15)',
            cursor: (!summary.trim() || enhancing) ? 'not-allowed' : 'pointer'
          }}>
          {enhancing ? <Spinner size="sm" /> : <Wand2 size={13} className="hover:scale-110 transition-transform" />}
          AI Enhance
        </button>
      </div>
    </div>
  );
}

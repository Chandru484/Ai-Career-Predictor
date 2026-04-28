import { useState } from 'react';
import { Plus, X, Zap } from 'lucide-react';
import { useResume } from '../../context/ResumeContext';

const SUGGESTIONS = [
  'JavaScript','Python','React','Node.js','TypeScript','SQL','AWS',
  'Docker','Git','GraphQL','Next.js','FastAPI','PostgreSQL','MongoDB',
  'Redis','Kubernetes','TensorFlow','PyTorch','Java','C++',
];

export default function SkillsForm() {
  const { resume, setContent } = useResume();
  const [input, setInput] = useState('');
  const skills = resume.content.skills || [];

  const add = (val) => {
    const trimmed = (val || input).trim();
    if (!trimmed || skills.includes(trimmed)) { setInput(''); return; }
    setContent({ skills: [...skills, trimmed] });
    setInput('');
  };

  const remove = (s) => setContent({ skills: skills.filter(x => x !== s) });

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !input && skills.length > 0) {
      remove(skills[skills.length - 1]);
    }
  };

  const suggestions = SUGGESTIONS.filter(s => !skills.includes(s));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">⚡</span>
        <span className="rb-section-title mb-0">Skills</span>
      </div>

      {/* Input area */}
      <div>
        <label className="rb-label">Add Skills</label>
        <div className="flex gap-2">
          <input
            className="rb-input flex-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Type a skill, press Enter or comma…"
          />
          <button onClick={() => add()} disabled={!input.trim()}
            className="rb-btn-primary rb-btn" style={{ padding: '0.5rem 0.875rem' }}>
            <Plus size={15} />
          </button>
        </div>
        <p className="text-xs mt-1.5" style={{ color: '#4b5563' }}>
          Press <kbd className="px-1.5 py-0.5 rounded text-xs bg-white/10 text-slate-400">Enter</kbd> or{' '}
          <kbd className="px-1.5 py-0.5 rounded text-xs bg-white/10 text-slate-400">,</kbd> to add · Backspace removes last
        </p>
      </div>

      {/* Current skills */}
      {skills.length > 0 && (
        <div>
          <label className="rb-label">Your Skills ({skills.length})</label>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={s} className="rb-skill-tag" onClick={() => remove(s)} title="Click to remove">
                {s} <X size={10} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick-add suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={11} className="text-amber-400" />
            <span className="rb-label mb-0">Quick Add</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 12).map(s => (
              <button key={s} onClick={() => add(s)}
                className="text-xs px-3 py-1.5 rounded-xl border font-medium transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#6b7280',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(150,230,48,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(150,230,48,0.35)';
                  e.currentTarget.style.color = '#a5b4fc';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#6b7280';
                }}>
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

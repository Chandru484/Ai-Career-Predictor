import { useState } from 'react';
import { Plus, Trash2, Wand2, GripVertical, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { useResume } from '../../context/ResumeContext';
import { useToast } from '../../context/ToastContext';
import { aiApi } from '../../services/api';
import { Spinner } from '../ui/Spinner';

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }
const EMPTY = () => ({ id: uid(), company: '', title: '', location: '', start_date: '', end_date: '', current: false, bullets: [''] });

export default function ExperienceForm() {
  const { resume, setContent } = useResume();
  const toast = useToast();
  const [open, setOpen] = useState({});
  const [enhancing, setEnhancing] = useState({});
  const items = resume.content.experience || [];

  const update = (list) => setContent({ experience: list });
  const add    = () => { const i = EMPTY(); update([...items, i]); setOpen(o => ({ ...o, [i.id]: true })); };
  const remove = (id) => update(items.filter(i => i.id !== id));
  const patch  = (id, field, val) => update(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  const toggle = (id) => setOpen(o => ({ ...o, [id]: !o[id] }));

  const patchBullet  = (id, bi, val) => update(items.map(i => i.id === id ? { ...i, bullets: i.bullets.map((b, x) => x === bi ? val : b) } : i));
  const addBullet    = (id) => update(items.map(i => i.id === id ? { ...i, bullets: [...i.bullets, ''] } : i));
  const removeBullet = (id, bi) => update(items.map(i => i.id === id ? { ...i, bullets: i.bullets.filter((_, x) => x !== bi) } : i));

  const enhance = async (id, bi) => {
    const exp = items.find(i => i.id === id);
    const bullet = exp?.bullets[bi];
    if (!bullet?.trim()) return;
    const key = `${id}-${bi}`;
    setEnhancing(e => ({ ...e, [key]: true }));
    try {
      const { enhanced } = await aiApi.enhance({
        text: bullet,
        context: `work experience bullet point for ${exp.title} at ${exp.company}`,
      });
      patchBullet(id, bi, enhanced);
      toast.success('Bullet enhanced!');
    } catch (err) { toast.error(err.message); }
    finally { setEnhancing(e => ({ ...e, [key]: false })); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💼</span>
          <span className="rb-section-title mb-0">Work Experience</span>
        </div>
        <button onClick={add} className="rb-btn-primary rb-btn text-xs">
          <Plus size={13} /> Add Job
        </button>
      </div>

      {items.length === 0 && (
        <div className="rb-empty">
          <Briefcase size={32} className="mb-3" style={{ color: '#374151' }} />
          <p className="text-sm font-medium" style={{ color: '#6b7280' }}>No experience added yet</p>
          <p className="text-xs mt-1" style={{ color: '#4b5563' }}>Click <strong className="text-indigo-400">Add Job</strong> to get started</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((exp) => {
          const isOpen = !!open[exp.id];
          return (
            <div key={exp.id} className={`rb-entry-card ${isOpen ? 'open' : ''}`}>
              {/* Header */}
              <button className="rb-entry-header group" onClick={() => toggle(exp.id)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                       style={{ background: 'rgba(150,230,48,0.15)', border: '1px solid rgba(150,230,48,0.2)' }}>
                    💼
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {exp.title || <span className="text-slate-500 font-normal">New Position</span>}
                    </div>
                    {exp.company && (
                      <div className="text-xs truncate" style={{ color: '#6b7280' }}>@ {exp.company}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button onClick={e => { e.stopPropagation(); remove(exp.id); }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/15 text-red-400">
                    <Trash2 size={13} />
                  </button>
                  {isOpen ? <ChevronUp size={14} style={{ color: '#4b5563' }} /> : <ChevronDown size={14} style={{ color: '#4b5563' }} />}
                </div>
              </button>

              {/* Body */}
              {isOpen && (
                <div className="rb-entry-body pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['title',      'Job Title',   'Software Engineer'],
                      ['company',    'Company',     'Acme Corp'],
                      ['location',   'Location',    'Remote'],
                      ['start_date', 'Start Date',  'Jan 2022'],
                    ].map(([key, label, ph]) => (
                      <div key={key}>
                        <label className="rb-label">{label}</label>
                        <input className="rb-input" value={exp[key] || ''} placeholder={ph}
                               onChange={e => patch(exp.id, key, e.target.value)} />
                      </div>
                    ))}

                    {/* End date — disabled when current */}
                    <div>
                      <label className="rb-label">End Date</label>
                      <input className="rb-input"
                             value={exp.current ? '' : (exp.end_date || '')}
                             placeholder={exp.current ? 'Present' : 'Dec 2024'}
                             disabled={exp.current}
                             onChange={e => patch(exp.id, 'end_date', e.target.value)} />
                    </div>

                    {/* Current checkbox */}
                    <div className="col-span-2 flex items-center gap-2.5 mt-1">
                      <input type="checkbox" id={`cur-${exp.id}`} checked={exp.current}
                             onChange={e => patch(exp.id, 'current', e.target.checked)}
                             className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                      <label htmlFor={`cur-${exp.id}`} className="text-sm cursor-pointer select-none"
                             style={{ color: '#94a3b8' }}>
                        I currently work here
                      </label>
                    </div>
                  </div>

                  {/* Bullet points */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rb-label mb-0">Achievement Bullets</span>
                      <button onClick={() => addBullet(exp.id)}
                        className="text-xs font-medium flex items-center gap-1 transition-colors"
                        style={{ color: '#96e630' }}
                        onMouseEnter={e => e.target.style.color = '#c8f03e'}
                        onMouseLeave={e => e.target.style.color = '#96e630'}>
                        <Plus size={11} /> Add bullet
                      </button>
                    </div>
                    <div className="space-y-2">
                      {exp.bullets.map((b, bi) => (
                        <div key={bi} className="flex gap-2 items-start">
                          <span className="mt-2.5 shrink-0 text-xs" style={{ color: '#374151' }}>•</span>
                          <textarea
                            className="rb-textarea flex-1 text-xs"
                            rows={2}
                            value={b}
                            placeholder="Led a project that increased performance by 40%…"
                            onChange={e => patchBullet(exp.id, bi, e.target.value)}
                          />
                          <div className="flex flex-col gap-1 pt-1 shrink-0">
                            <button onClick={() => enhance(exp.id, bi)}
                              disabled={enhancing[`${exp.id}-${bi}`] || !b.trim()}
                              className="flex items-center justify-center transition-all duration-300 rounded"
                              style={{
                                width: 26, height: 26,
                                background: (!b.trim() || enhancing[`${exp.id}-${bi}`]) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, rgba(150,230,48,0.2), rgba(200,240,62,0.1))',
                                color: (!b.trim() || enhancing[`${exp.id}-${bi}`]) ? '#6b7280' : '#96e630',
                                border: `1px solid ${(!b.trim() || enhancing[`${exp.id}-${bi}`]) ? 'rgba(255,255,255,0.05)' : 'rgba(150,230,48,0.3)'}`,
                                boxShadow: (!b.trim() || enhancing[`${exp.id}-${bi}`]) ? 'none' : '0 0 10px rgba(150,230,48,0.15)',
                                cursor: (!b.trim() || enhancing[`${exp.id}-${bi}`]) ? 'not-allowed' : 'pointer'
                              }}
                              title="AI Enhance">
                              {enhancing[`${exp.id}-${bi}`] ? <Spinner size="sm" /> : <Wand2 size={13} className="hover:scale-110 transition-transform" />}
                            </button>
                            <button onClick={() => removeBullet(exp.id, bi)}
                              className="rb-btn-icon text-red-400 hover:text-red-300">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

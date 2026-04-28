import { useState } from 'react';
import { Plus, Trash2, Wand2, ChevronDown, ChevronUp, ExternalLink, GitBranch } from 'lucide-react';
import { useResume } from '../../context/ResumeContext';
import { useToast } from '../../context/ToastContext';
import { aiApi } from '../../services/api';
import { Spinner } from '../ui/Spinner';

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }
const EMPTY = () => ({ id: uid(), name: '', description: '', technologies: '', url: '', github_url: '', bullets: [] });

export default function ProjectsForm() {
  const { resume, setContent } = useResume();
  const toast = useToast();
  const [open, setOpen] = useState({});
  const [enhancing, setEnhancing] = useState(null);

  const items = resume.content.projects || [];
  const update      = (list) => setContent({ projects: list });
  const add         = () => { const i = EMPTY(); update([...items, i]); setOpen(o => ({ ...o, [i.id]: true })); };
  const remove      = (id) => update(items.filter(i => i.id !== id));
  const patch       = (id, k, v) => update(items.map(i => i.id === id ? { ...i, [k]: v } : i));
  const toggle      = (id) => setOpen(o => ({ ...o, [id]: !o[id] }));
  const addBullet   = (id) => update(items.map(i => i.id === id ? { ...i, bullets: [...(i.bullets||[]), ''] } : i));
  const patchBullet = (id, bi, v) => update(items.map(i => i.id === id ? { ...i, bullets: i.bullets.map((b,x) => x===bi ? v : b) } : i));
  const removeBullet= (id, bi) => update(items.map(i => i.id === id ? { ...i, bullets: i.bullets.filter((_,x) => x!==bi) } : i));

  const enhance = async (id) => {
    const proj = items.find(i => i.id === id);
    if (!proj?.description?.trim()) return toast.warning('Add a description first.');
    setEnhancing(id);
    try {
      const { enhanced } = await aiApi.enhance({ text: proj.description, context: `project description for ${proj.name}` });
      patch(id, 'description', enhanced);
      toast.success('Description enhanced!');
    } catch (err) { toast.error(err.message); }
    finally { setEnhancing(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚀</span>
          <span className="rb-section-title mb-0">Projects</span>
        </div>
        <button onClick={add} className="rb-btn-primary rb-btn text-xs">
          <Plus size={13} /> Add Project
        </button>
      </div>

      {items.length === 0 && (
        <div className="rb-empty">
          <div className="text-3xl mb-3">🚀</div>
          <p className="text-sm font-medium" style={{ color: '#6b7280' }}>No projects added yet</p>
          <p className="text-xs mt-1" style={{ color: '#4b5563' }}>Showcase your best work</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map(proj => {
          const isOpen = !!open[proj.id];
          return (
            <div key={proj.id} className={`rb-entry-card ${isOpen ? 'open' : ''}`}>
              <button className="rb-entry-header group" onClick={() => toggle(proj.id)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                       style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    🚀
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {proj.name || <span className="text-slate-500 font-normal">New Project</span>}
                    </div>
                    {proj.technologies && (
                      <div className="text-xs truncate" style={{ color: '#6b7280' }}>{proj.technologies}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button onClick={e => { e.stopPropagation(); remove(proj.id); }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/15 text-red-400">
                    <Trash2 size={13} />
                  </button>
                  {isOpen ? <ChevronUp size={14} style={{ color: '#4b5563' }} /> : <ChevronDown size={14} style={{ color: '#4b5563' }} />}
                </div>
              </button>

              {isOpen && (
                <div className="rb-entry-body pt-4 space-y-3">
                  {/* Name & Tech */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="rb-label">Project Name</label>
                      <input className="rb-input" value={proj.name||''} placeholder="My Awesome App"
                             onChange={e => patch(proj.id, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label className="rb-label">Technologies</label>
                      <input className="rb-input" value={proj.technologies||''} placeholder="React, Node.js"
                             onChange={e => patch(proj.id, 'technologies', e.target.value)} />
                    </div>
                  </div>

                  {/* URLs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="rb-label flex items-center gap-1"><ExternalLink size={10} /> Live URL</label>
                      <input className="rb-input" value={proj.url||''} placeholder="https://myapp.com"
                             onChange={e => patch(proj.id, 'url', e.target.value)} />
                    </div>
                    <div>
                      <label className="rb-label flex items-center gap-1"><GitBranch size={10} /> GitHub</label>
                      <input className="rb-input" value={proj.github_url||''} placeholder="github.com/you/repo"
                             onChange={e => patch(proj.id, 'github_url', e.target.value)} />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="rb-label mb-0">Description</label>
                      <button onClick={() => enhance(proj.id)} disabled={enhancing === proj.id || !proj.description?.trim()}
                        className="text-xs flex items-center gap-1 font-medium transition-colors"
                        style={{ color: '#96e630' }}>
                        {enhancing === proj.id ? <Spinner size="sm" /> : <Wand2 size={11} />}
                        AI Enhance
                      </button>
                    </div>
                    <textarea className="rb-textarea" rows={3}
                              value={proj.description||''} placeholder="What does this project do and why does it matter?"
                              onChange={e => patch(proj.id, 'description', e.target.value)} />
                  </div>

                  {/* Bullet key points */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="rb-label mb-0">Key Points (optional)</label>
                      <button onClick={() => addBullet(proj.id)}
                        className="text-xs flex items-center gap-1 font-medium"
                        style={{ color: '#96e630' }}>
                        <Plus size={11} /> Add
                      </button>
                    </div>
                    {(proj.bullets||[]).map((b, bi) => (
                      <div key={bi} className="flex gap-2 mb-2 items-center">
                        <span className="text-xs shrink-0" style={{ color: '#374151' }}>•</span>
                        <input className="rb-input flex-1 text-xs" value={b}
                               placeholder="Key feature or achievement…"
                               onChange={e => patchBullet(proj.id, bi, e.target.value)} />
                        <button onClick={() => removeBullet(proj.id, bi)} className="rb-btn-icon shrink-0 text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
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

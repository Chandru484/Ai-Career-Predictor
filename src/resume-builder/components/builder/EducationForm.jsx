import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { useResume } from '../../context/ResumeContext';

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }
const EMPTY = () => ({ id: uid(), institution: '', degree: '', field: '', location: '', start_date: '', end_date: '', gpa: '' });

const FIELDS = [
  ['degree',      'Degree',         'Bachelor of Science', 1],
  ['field',       'Field of Study', 'Computer Science',    1],
  ['institution', 'Institution',    'MIT',                 2],
  ['location',    'Location',       'Cambridge, MA',       2],
  ['start_date',  'Start Date',     'Sep 2018',            1],
  ['end_date',    'End Date',       'Jun 2022',            1],
  ['gpa',         'GPA (optional)', '3.9',                 1],
];

export default function EducationForm() {
  const { resume, setContent } = useResume();
  const [open, setOpen] = useState({});
  const items = resume.content.education || [];

  const update = (list) => setContent({ education: list });
  const add    = () => { const i = EMPTY(); update([...items, i]); setOpen(o => ({ ...o, [i.id]: true })); };
  const remove = (id) => update(items.filter(i => i.id !== id));
  const patch  = (id, k, v) => update(items.map(i => i.id === id ? { ...i, [k]: v } : i));
  const toggle = (id) => setOpen(o => ({ ...o, [id]: !o[id] }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎓</span>
          <span className="rb-section-title mb-0">Education</span>
        </div>
        <button onClick={add} className="rb-btn-primary rb-btn text-xs">
          <Plus size={13} /> Add Education
        </button>
      </div>

      {items.length === 0 && (
        <div className="rb-empty">
          <GraduationCap size={32} className="mb-3" style={{ color: '#374151' }} />
          <p className="text-sm font-medium" style={{ color: '#6b7280' }}>No education added yet</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map(edu => {
          const isOpen = !!open[edu.id];
          return (
            <div key={edu.id} className={`rb-entry-card ${isOpen ? 'open' : ''}`}>
              <button className="rb-entry-header group" onClick={() => toggle(edu.id)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                       style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.2)' }}>
                    🎓
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {edu.institution || <span className="text-slate-500 font-normal">New Education</span>}
                    </div>
                    {edu.degree && (
                      <div className="text-xs truncate" style={{ color: '#6b7280' }}>
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button onClick={e => { e.stopPropagation(); remove(edu.id); }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/15 text-red-400">
                    <Trash2 size={13} />
                  </button>
                  {isOpen ? <ChevronUp size={14} style={{ color: '#4b5563' }} /> : <ChevronDown size={14} style={{ color: '#4b5563' }} />}
                </div>
              </button>

              {isOpen && (
                <div className="rb-entry-body pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {FIELDS.map(([key, label, ph, span]) => (
                      <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                        <label className="rb-label">{label}</label>
                        <input className="rb-input" value={edu[key] || ''} placeholder={ph}
                               onChange={e => patch(edu.id, key, e.target.value)} />
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

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Save, Eye, Upload, GripVertical, Palette,
  Wand2, ChevronRight, FileDown, X, Maximize2, LayoutTemplate, AlertTriangle
} from 'lucide-react';
import { useResume } from '../context/ResumeContext';
import { useToast } from '../context/ToastContext';
import { exportApi, aiApi } from '../services/api';
import { usePdfExport } from '../hooks/usePdfExport';
import ResumePreview from '../components/preview/ResumePreview';
import PersonalInfoForm from '../components/builder/PersonalInfoForm';
import SummaryForm from '../components/builder/SummaryForm';
import ExperienceForm from '../components/builder/ExperienceForm';
import EducationForm from '../components/builder/EducationForm';
import SkillsForm from '../components/builder/SkillsForm';
import ProjectsForm from '../components/builder/ProjectsForm';
import { Spinner } from '../components/ui/Spinner';
import ScoreRing from '../components/builder/ScoreRing';

const SECTION_FORMS = {
  personal:   { label: 'Personal Info',  icon: '👤', component: PersonalInfoForm },
  summary:    { label: 'Summary',        icon: '📝', component: SummaryForm },
  experience: { label: 'Experience',     icon: '💼', component: ExperienceForm },
  education:  { label: 'Education',      icon: '🎓', component: EducationForm },
  skills:     { label: 'Skills',         icon: '⚡', component: SkillsForm },
  projects:   { label: 'Projects',       icon: '🚀', component: ProjectsForm },
};

const COLORS = [
  { hex: '#1e3a8a', name: 'Royal Blue' },
  { hex: '#0f766e', name: 'Teal' },
  { hex: '#334155', name: 'Slate' },
  { hex: '#7c3aed', name: 'Violet' },
  { hex: '#be123c', name: 'Rose' },
  { hex: '#b45309', name: 'Amber' },
  { hex: '#166534', name: 'Forest' },
  { hex: '#1e3a5f', name: 'Navy' },
];

export default function ResumeBuilder() {
  const { resume, setField, setContent, saveNow, isSaving, isDirty } = useResume();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef();
  // This ref is passed to the live preview so we can screenshot it for PDF
  const previewRef = useRef();

  const [activeSection, setActiveSection] = useState('personal');
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [previewMetrics, setPreviewMetrics] = useState({ fitsA4: true, overflowY: 0, overflowX: 0 });

  // html2canvas → jsPDF (pixel-perfect, matches what you see)
  const { exportPdf } = usePdfExport();

  const order = resume.section_order || Object.keys(SECTION_FORMS);

  const onDragEnd = ({ source, destination }) => {
    if (!destination || source.index === destination.index) return;
    const next = [...order];
    const [moved] = next.splice(source.index, 1);
    next.splice(destination.index, 0, moved);
    setField('section_order', next);
  };

  const handleExport = async (format) => {
    if (format === 'pdf') {
      // Use the browser print API to generate a pixel-perfect PDF
      try {
        setExporting('pdf');
        toast.info('A print dialog will open — select "Save as PDF" as the destination.', { duration: 6000 });
        await exportPdf(previewRef, resume.title);
      } catch (e) { toast.error('PDF failed: ' + e.message); }
      finally { setExporting(null); }
      return;
    }
    // DOCX — backend text export (editable format)
    setExporting(format);
    try {
      const payload = {
        title: resume.title, template_name: resume.template_name,
        theme_color: resume.theme_color, font_size: resume.font_size,
        spacing: resume.spacing, show_decorations: resume.show_decorations,
        section_order: resume.section_order, content: resume.content,
      };
      const blob = await exportApi.docx(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${resume.title}.${format}`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} exported!`);
    } catch (e) { toast.error(e.message); }
    finally { setExporting(null); }
  };

  const handleParsePDF = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const data = await aiApi.parse(file);
      const withIds = {
        ...data,
        experience: (data.experience || []).map((x, i) => ({ ...x, id: x.id || `exp-${Date.now()}-${i}` })),
        education:  (data.education  || []).map((x, i) => ({ ...x, id: x.id || `edu-${Date.now()}-${i}` })),
        projects:   (data.projects   || []).map((x, i) => ({ ...x, id: x.id || `proj-${Date.now()}-${i}` })),
      };
      setContent(withIds);
      if (data.personal?.name && resume.title === 'Untitled Resume') {
        setField('title', `${data.personal.name}'s Resume`);
      }
      toast.success('PDF imported! Review each section.');
    } catch (err) {
      toast.error(err.message || 'Failed to parse PDF');
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleAutoFitA4 = () => {
    let changed = false;

    if (resume.spacing !== 'compact') {
      setField('spacing', 'compact');
      changed = true;
    }

    if (resume.font_size === 'large') {
      setField('font_size', 'medium');
      changed = true;
    } else if (resume.font_size === 'medium' && (previewMetrics?.overflowY || 0) > 120) {
      setField('font_size', 'small');
      changed = true;
    }

    if (changed) {
      toast.success('Applied A4 fit optimization settings.');
    } else {
      toast.info('Your resume is already using compact A4-friendly settings.');
    }
  };

  const ActiveForm = SECTION_FORMS[activeSection]?.component;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--rb-bg)' }}>

      {/* ════════════════════════════════════════
          LEFT PANEL — form editor
      ════════════════════════════════════════ */}
      <div className="w-[320px] xl:w-[360px] shrink-0 flex flex-col h-full overflow-hidden"
           style={{ background: 'var(--rb-surface)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* ── Toolbar ── */}
        <div className="px-4 pt-4 pb-3 space-y-3"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                value={resume.title}
                onChange={e => setField('title', e.target.value)}
                className="bg-transparent text-white font-bold text-lg border-b border-transparent hover:border-white/10 focus:border-[#96e630] focus:outline-none transition-colors px-1 pb-1 w-full"
                placeholder="Resume title…"
              />
              <ScoreRing />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveNow} disabled={isSaving}
              className="rb-btn-primary rb-btn text-xs flex-1 justify-center">
              {isSaving ? <Spinner size="sm" /> : <Save size={13} />}
              {isSaving ? 'Saving…' : isDirty ? 'Save*' : 'Saved'}
            </button>
            <button onClick={() => navigate('/resume-builder/preview')}
              className="rb-btn-ghost text-xs" style={{ padding: '0.5rem 0.75rem', borderRadius: 10 }}
              title="Full preview">
              <Maximize2 size={14} />
            </button>
            <button onClick={() => setShowMobilePreview(true)}
              className="rb-btn-ghost text-xs lg:hidden" style={{ padding: '0.5rem 0.75rem', borderRadius: 10 }}
              title="Preview">
              <Eye size={14} />
            </button>
          </div>

          {/* Action buttons row 2 */}
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={parsing}
              className="rb-btn-ghost text-xs flex-1 justify-center">
              {parsing ? <Spinner size="sm" /> : <Upload size={13} />}
              {parsing ? 'Parsing…' : 'Import PDF'}
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleParsePDF} />
            <button onClick={() => handleExport('pdf')} disabled={!!exporting}
              className="rb-btn-ghost text-xs" style={{ padding: '0.5rem 0.75rem', borderRadius: 10 }}
              title="Export PDF">
              {exporting === 'pdf' ? <Spinner size="sm" /> : <FileDown size={14} />}
              <span className="text-xs">PDF</span>
            </button>
            <button onClick={() => handleExport('docx')} disabled={!!exporting}
              className="rb-btn-ghost text-xs" style={{ padding: '0.5rem 0.75rem', borderRadius: 10 }}
              title="Export DOCX">
              {exporting === 'docx' ? <Spinner size="sm" /> : <FileDown size={14} />}
              <span className="text-xs">DOCX</span>
            </button>
            <button onClick={() => setShowSettings(s => !s)}
              className={`rb-btn-ghost text-xs ${showSettings ? 'text-indigo-400 !border-indigo-500/40 !bg-indigo-500/10' : ''}`}
              style={{ padding: '0.5rem 0.75rem', borderRadius: 10 }}
              title="Appearance">
              <Palette size={14} />
            </button>
          </div>
        </div>

        {/* ── Appearance panel ── */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="px-4 py-4 space-y-4">
                {/* Theme color */}
                <div>
                  <div className="rb-label">Theme Color</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {COLORS.map(({ hex, name }) => (
                      <button key={hex} onClick={() => setField('theme_color', hex)}
                        title={name}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                        style={{
                          background: hex,
                          outline: resume.theme_color === hex ? `2px solid ${hex}` : 'none',
                          outlineOffset: 2,
                          boxShadow: resume.theme_color === hex ? `0 0 10px ${hex}80` : 'none',
                        }} />
                    ))}
                    <input type="color" value={resume.theme_color}
                      onChange={e => setField('theme_color', e.target.value)}
                      className="w-7 h-7 rounded-full cursor-pointer border-0"
                      style={{ background: 'transparent' }} title="Custom" />
                  </div>
                </div>

                {/* Font size + Spacing in a row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="rb-label">Font Size</div>
                    <div className="flex gap-1">
                      {['small', 'medium', 'large'].map(s => (
                        <button key={s} onClick={() => setField('font_size', s)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                            ${resume.font_size === s
                              ? 'text-[#96e630] border border-[#96e630]/50'
                              : 'text-slate-500 border border-white/10 hover:text-slate-300'}`}
                          style={{ background: resume.font_size === s ? 'rgba(150,230,48,0.15)' : 'transparent' }}>
                          {s[0].toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="rb-label">Spacing</div>
                    <div className="flex gap-1">
                      {['compact', 'normal', 'relaxed'].map(s => (
                        <button key={s} onClick={() => setField('spacing', s)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                            ${resume.spacing === s
                              ? 'text-[#96e630] border border-[#96e630]/50'
                              : 'text-slate-500 border border-white/10 hover:text-slate-300'}`}
                          style={{ background: resume.spacing === s ? 'rgba(150,230,48,0.15)' : 'transparent' }}>
                          {s === 'compact' ? 'S' : s === 'normal' ? 'M' : 'L'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Font Family selector */}
                <div>
                  <div className="rb-label">Font Family</div>
                  <div className="flex gap-2">
                    {[
                      { id: 'sans', label: 'Sans' },
                      { id: 'serif', label: 'Serif' },
                      { id: 'mono', label: 'Mono' }
                    ].map(f => (
                      <button key={f.id} onClick={() => setField('font_family', f.id)}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors
                          ${resume.font_family === f.id
                            ? 'text-[#96e630] border border-[#96e630]/50'
                            : 'text-slate-500 border border-white/10 hover:text-slate-300'}`}
                        style={{ background: resume.font_family === f.id ? 'rgba(150,230,48,0.15)' : 'transparent' }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template shortcut */}
                <button onClick={() => navigate('/resume-builder/templates')}
                  className="rb-btn-ghost text-xs w-full justify-center">
                  <LayoutTemplate size={13} /> Change Template
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Section navigator ── */}
        <div className="px-3 py-3 shrink-0"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="rb-section-title mb-0">Sections</span>
            <span className="text-xs text-slate-600">drag to reorder</span>
          </div>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sections" direction="vertical">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-0.5">
                  {order.map((key, i) => {
                    const def = SECTION_FORMS[key];
                    if (!def) return null;
                    const isActive = activeSection === key;
                    return (
                      <Draggable key={key} draggableId={key} index={i}>
                        {(prov, snap) => (
                          <div ref={prov.innerRef} {...prov.draggableProps}
                            className={`rb-drag-item ${isActive ? 'active' : ''}`}
                            style={{
                              ...prov.draggableProps.style,
                              opacity: snap.isDragging ? 0.85 : 1,
                              boxShadow: snap.isDragging ? '0 8px 24px rgba(0,0,0,0.5)' : undefined,
                              background: snap.isDragging ? 'rgba(150,230,48,0.25)' : undefined,
                            }}
                            onClick={() => setActiveSection(key)}
                          >
                            <span {...prov.dragHandleProps}
                              className="shrink-0 opacity-30 hover:opacity-70 cursor-grab active:cursor-grabbing">
                              <GripVertical size={14} />
                            </span>
                            <span className="text-base leading-none">{def.icon}</span>
                            <span className="flex-1 text-sm font-medium">{def.label}</span>
                            <ChevronRight size={12} className={isActive ? 'opacity-60' : 'opacity-20'} />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* ── Active form ── */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              {ActiveForm && <ActiveForm />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT PANEL — live preview (desktop)
      ════════════════════════════════════════ */}
      <div className="flex-1 hidden lg:flex flex-col overflow-hidden"
           style={{ background: 'linear-gradient(160deg, #0a0a16 0%, #0f0f20 60%, #080812 100%)' }}>
        {/* Preview header */}
        <div className="flex items-center justify-between px-6 py-3.5 shrink-0"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold" style={{ color: '#4b5563' }}>LIVE PREVIEW</span>
            <span className="rb-badge text-xs capitalize">
              {resume.template_name.replace('_', ' ')}
            </span>
            <span
              className="rb-badge text-[11px]"
              style={previewMetrics?.fitsA4
                ? {}
                : { background: 'rgba(245,158,11,0.16)', borderColor: 'rgba(245,158,11,0.35)', color: '#facc15' }}
            >
              {previewMetrics?.fitsA4
                ? 'A4 ready'
                : `A4 overflow +${Math.ceil((previewMetrics?.overflowY || 0) / 3.78)}mm`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!previewMetrics?.fitsA4 && (
              <button
                onClick={handleAutoFitA4}
                className="rb-btn-ghost text-xs gap-1.5"
                style={{ padding: '0.375rem 0.75rem' }}
                title="Reduce spacing and font size to fit one A4 page"
              >
                <Wand2 size={13} /> Auto-fit A4
              </button>
            )}
            <button onClick={() => navigate('/resume-builder/preview')}
              className="rb-btn-ghost text-xs gap-1.5" style={{ padding: '0.375rem 0.75rem' }}>
              <Maximize2 size={13} /> Full Preview
            </button>
          </div>
        </div>

        {/* Preview canvas */}
        <div className="flex-1 overflow-auto flex items-start justify-center pt-8 pb-12 px-4">
          <ResumePreview scale={0.6} printRef={previewRef} onMetricsChange={setPreviewMetrics} />
        </div>

        {!previewMetrics?.fitsA4 && (
          <div
            className="px-6 py-2 text-xs flex items-center gap-2"
            style={{ borderTop: '1px solid rgba(245,158,11,0.2)', color: '#facc15', background: 'rgba(245,158,11,0.08)' }}
          >
            <AlertTriangle size={13} />
            Content exceeds one A4 page. Use Auto-fit A4 or remove some content for a single-page resume.
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          MOBILE PREVIEW OVERLAY
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showMobilePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 flex flex-col"
            style={{ background: 'rgba(8,8,16,0.97)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 shrink-0"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm font-semibold text-white">Preview</span>
              <button onClick={() => setShowMobilePreview(false)} className="rb-btn-icon">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-start justify-center pt-6 pb-10">
              <ResumePreview scale={0.5} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

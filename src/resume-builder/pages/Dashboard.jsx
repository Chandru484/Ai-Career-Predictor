import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FileText, Copy, Trash2, Download, Edit3, Clock,
  Sparkles, Loader2, FileDown, LayoutTemplate, TrendingUp
} from 'lucide-react';
import { resumeApi, exportApi } from '../services/api';
import { useResume } from '../context/ResumeContext';
import { useToast } from '../context/ToastContext';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ConfirmModal } from '../components/ui/Modal';

const TEMPLATE_META = {
  universal:       { label: 'Universal',       color: '#96e630', emoji: '🌐' },
  professional:    { label: 'Professional',    color: '#1e40af', emoji: '💼' },
  creative:        { label: 'Creative',        color: '#7c3aed', emoji: '🎨' },
  business_insider:{ label: 'Business Insider',color: '#1e3a5f', emoji: '📊' },
};

function ResumeCard({ doc, onEdit, onDelete, onDuplicate, onExport, exporting }) {
  const updated = new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const meta = TEMPLATE_META[doc.template_name] ?? { label: doc.template_name, color: '#96e630', emoji: '📄' };
  const isExporting = exporting && exporting.startsWith(doc.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="rb-card flex flex-col gap-4 group"
      style={{ minHeight: 180 }}
    >
      {/* Top accent bar */}
      <div className="h-1 rounded-full -mt-1 -mx-1"
           style={{ background: `linear-gradient(to right, ${meta.color}, ${meta.color}55)` }} />

      <div className="flex-1">
        <div className="flex items-start gap-3">
          {/* Emoji icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
               style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}35` }}>
            {meta.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white truncate leading-tight">{doc.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="rb-badge text-xs">{meta.label}</span>
            </div>
          </div>
        </div>
        <p className="text-xs flex items-center gap-1 mt-3" style={{ color: '#4b5563' }}>
          <Clock size={10} /> Updated {updated}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => onEdit(doc)}
          className="rb-btn-primary rb-btn text-xs flex-1 justify-center">
          <Edit3 size={12} /> Edit
        </button>
        <button onClick={() => onDuplicate(doc.id)} className="rb-btn-icon" title="Duplicate">
          <Copy size={13} />
        </button>
        <button onClick={() => onExport(doc, 'pdf')} disabled={isExporting} className="rb-btn-icon" title="Export PDF">
          {exporting === `${doc.id}-pdf` ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
        </button>
        <button onClick={() => onExport(doc, 'docx')} disabled={isExporting} className="rb-btn-icon" title="Export DOCX">
          {exporting === `${doc.id}-docx` ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        </button>
        <button onClick={() => onDelete(doc.id)}
          className="rb-btn-icon text-red-400 hover:!text-red-300 hover:!bg-red-500/10 hover:!border-red-500/30"
          title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [exporting, setExporting] = useState(null);
  const { loadResume, newResume } = useResume();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    resumeApi.list()
      .then(setResumes)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleNew = () => { newResume(); navigate('/resume-builder/templates'); };
  const handleEdit = (doc) => { loadResume(doc); navigate('/resume-builder/builder'); };

  const handleDelete = async () => {
    try {
      await resumeApi.delete(deleteId);
      setResumes(r => r.filter(d => d.id !== deleteId));
      toast.success('Resume deleted');
    } catch (e) { toast.error(e.message); }
    setDeleteId(null);
  };

  const handleDuplicate = async (id) => {
    try {
      const clone = await resumeApi.duplicate(id);
      setResumes(r => [clone, ...r]);
      toast.success('Resume duplicated!');
    } catch (e) { toast.error(e.message); }
  };

  const handleExport = async (doc, format) => {
    if (format === 'pdf') {
      // Load the resume into context, then open Full Preview where PDF is pixel-perfect
      loadResume(doc);
      navigate('/resume-builder/preview');
      toast.info('Use the PDF button in Full Preview for a pixel-perfect export.');
      return;
    }
    // DOCX — backend editable export
    const key = `${doc.id}-${format}`;
    setExporting(key);
    try {
      const payload = {
        title: doc.title, template_name: doc.template_name,
        theme_color: doc.theme_color, font_size: doc.font_size,
        spacing: doc.spacing, show_decorations: doc.show_decorations,
        section_order: doc.section_order, content: doc.content,
      };
      const blob = await exportApi.docx(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${doc.title}.${format}`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} exported!`);
    } catch (e) { toast.error(e.message); }
    finally { setExporting(null); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#96e630,#c8f03e)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            My Resumes
          </h1>
          {!loading && (
            <p className="text-sm mt-1.5 flex items-center gap-1.5" style={{ color: '#4b5563' }}>
              <TrendingUp size={12} />
              {resumes.length} resume{resumes.length !== 1 ? 's' : ''} saved
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/resume-builder/templates')}
            className="rb-btn-ghost text-sm gap-2">
            <LayoutTemplate size={15} /> Templates
          </button>
          <button onClick={handleNew} className="rb-btn-primary rb-btn text-sm">
            <Plus size={16} /> New Resume
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : resumes.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rb-empty py-24 max-w-md mx-auto">
          <div className="text-5xl mb-5">📄</div>
          <h2 className="text-xl font-bold text-white mb-2">No resumes yet</h2>
          <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
            Create your first AI-powered resume in minutes
          </p>
          <button onClick={handleNew} className="rb-btn-primary rb-btn text-sm">
            <Plus size={16} /> Create Your First Resume
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {resumes.map(doc => (
              <ResumeCard key={doc.id} doc={doc}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteId(id)}
                onDuplicate={handleDuplicate}
                onExport={handleExport}
                exporting={exporting}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Resume"
        message="This action cannot be undone. The resume will be permanently deleted."
        danger
      />
    </div>
  );
}

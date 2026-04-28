import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
  ArrowLeft, Printer, Download, FileDown,
  Loader2, ZoomIn, ZoomOut, CheckCircle2, Info, AlertTriangle,
} from 'lucide-react';
import { useResume } from '../context/ResumeContext';
import { useToast } from '../context/ToastContext';
import { usePdfExport } from '../hooks/usePdfExport';
import { exportApi } from '../services/api';
import ResumePreview from '../components/preview/ResumePreview';

export default function FullPreview() {
  const { resume } = useResume();
  const navigate = useNavigate();
  const toast = useToast();
  const printRef = useRef();
  const [scale, setScale] = useState(0.85);
  const [a4Metrics, setA4Metrics] = useState({ fitsA4: true, overflowY: 0, overflowX: 0 });

  // ── Browser print (exact visual match via browser print dialog) ──
  const handlePrint = useReactToPrint({ contentRef: printRef });

  // ── Browser print-to-PDF via hidden iframe (pixel-perfect) ──
  const { exportPdf, exporting: pdfExporting } = usePdfExport();

  const handleExportPDF = async () => {
    toast.info(
      'A print dialog will open — select "Save as PDF" as the destination.',
      { duration: 6000 }
    );
    try {
      await exportPdf(printRef, resume.title);
    } catch (e) {
      toast.error('PDF export failed: ' + e.message);
    }
  };

  // ── DOCX still goes to backend (editable format) ──
  const [docxExporting, setDocxExporting] = useState(false);
  const handleExportDocx = async () => {
    setDocxExporting(true);
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
      a.href = url; a.download = `${resume.title}.docx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('DOCX downloaded (editable format)');
    } catch (e) { toast.error(e.message); }
    finally { setDocxExporting(false); }
  };

  const anyExporting = pdfExporting || docxExporting;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--rb-bg)' }}>
      {/* ── Topbar ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3 shrink-0"
           style={{
             background: 'rgba(8,8,16,0.92)',
             backdropFilter: 'blur(16px)',
             borderBottom: '1px solid rgba(255,255,255,0.06)',
           }}>
        <button onClick={() => navigate(-1)} className="rb-btn-ghost rb-btn text-sm">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{resume.title}</p>
          <p className="text-xs capitalize" style={{ color: '#4b5563' }}>
            {resume.template_name.replace('_', ' ')} template
          </p>
        </div>

        <span
          className="rb-badge text-[11px] hidden md:inline-flex"
          style={a4Metrics?.fitsA4
            ? {}
            : { background: 'rgba(245,158,11,0.16)', borderColor: 'rgba(245,158,11,0.35)', color: '#facc15' }}
        >
          {a4Metrics?.fitsA4
            ? 'A4 ready'
            : `A4 overflow +${Math.ceil((a4Metrics?.overflowY || 0) / 3.78)}mm`}
        </span>

        {/* Zoom controls */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl"
             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => setScale(s => Math.max(0.4, +(s - 0.1).toFixed(1)))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            disabled={scale <= 0.4}>
            <ZoomOut size={14} />
          </button>
          <span className="text-xs font-medium px-2" style={{ color: '#6b7280' }}>
            {Math.round(scale * 100)}%
          </span>
          <button onClick={() => setScale(s => Math.min(1.2, +(s + 0.1).toFixed(1)))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            disabled={scale >= 1.2}>
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setScale(1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Reset zoom to 100%"
          >
            1:1
          </button>
        </div>

        {/* Print — exact match via browser */}
        <button onClick={handlePrint} disabled={anyExporting}
          className="rb-btn-ghost rb-btn text-sm gap-2" title="Print">
          <Printer size={14} /> Print
        </button>

        {/* PDF — browser print-to-PDF (pixel-perfect) */}
        <button onClick={handleExportPDF} disabled={anyExporting}
          className="rb-btn-primary rb-btn text-sm gap-2"
          title="Save as PDF via browser print dialog">
          {pdfExporting
            ? <><Loader2 size={14} className="animate-spin" /> Opening…</>
            : <><FileDown size={14} /> PDF</>
          }
        </button>

        {/* DOCX — backend, editable */}
        <button onClick={handleExportDocx} disabled={anyExporting}
          className="rb-btn-ghost rb-btn text-sm gap-2" title="Export editable DOCX">
          {docxExporting
            ? <><Loader2 size={14} className="animate-spin" /> Exporting…</>
            : <><Download size={14} /> DOCX</>
          }
        </button>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-center justify-center gap-2 py-2 text-xs"
           style={{ background: 'rgba(150,230,48,0.08)', borderBottom: '1px solid rgba(150,230,48,0.15)', color: '#c8f03e' }}>
        <Info size={12} />
        <span>
          <strong>PDF</strong> — select <em>"Save as PDF"</em> in the print dialog for a pixel-perfect export ·
          <strong className="ml-1">DOCX</strong> — editable document (layout may differ)
        </span>
      </div>

      {!a4Metrics?.fitsA4 && (
        <div className="flex items-center justify-center gap-2 py-2 px-3 text-xs"
             style={{ background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.2)', color: '#facc15' }}>
          <AlertTriangle size={12} />
          <span>
            Resume content is longer than one A4 page. PDF export now auto-fits to one page, but text may shrink slightly.
          </span>
        </div>
      )}

      {/* ── Preview canvas ── */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-10 px-4"
           style={{ background: 'radial-gradient(ellipse at center top, #0f0f28 0%, #080810 60%)' }}>
        <ResumePreview scale={scale} printRef={printRef} onMetricsChange={setA4Metrics} />
      </div>
    </div>
  );
}

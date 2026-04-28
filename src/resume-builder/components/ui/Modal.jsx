import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className={`relative w-full ${widths[size] ?? widths.md} rounded-2xl border border-white/10 shadow-2xl animate-slide-up`}
           style={{ background: 'rgba(22,24,42,0.97)' }}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-slate-300 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="rb-btn-ghost rb-btn">Cancel</button>
        <button
          onClick={onConfirm}
          className={`rb-btn ${danger ? 'rb-btn-danger' : 'rb-btn-primary'}`}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}

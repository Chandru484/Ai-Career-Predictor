import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-dismiss if duration is not 0
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Memoize to prevent infinite loops in useEffects
  const toast = useMemo(() => ({
    success: (msg, opts) => add(msg, 'success', opts?.duration ?? 4000),
    error:   (msg, opts) => add(msg, 'error', opts?.duration ?? 6000),
    info:    (msg, opts) => add(msg, 'info', opts?.duration ?? 4000),
    warning: (msg, opts) => add(msg, 'warning', opts?.duration ?? 5000),
  }), [add]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-4 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium animate-slide-up
              ${t.type === 'success' ? 'bg-[#96e630]/90 text-black' :
                t.type === 'error'   ? 'bg-[#ff4d4d]/90 text-white' :
                t.type === 'warning' ? 'bg-[#c8f03e]/90 text-black' :
                'bg-[#242424]/90 text-white border border-white/10'} backdrop-blur-xl shadow-black/50`}
          >
            <div className="flex items-center gap-3">
              <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}</span>
              {t.message}
            </div>
            <button 
              onClick={() => remove(t.id)}
              className="opacity-70 hover:opacity-100 transition-opacity ml-2 shrink-0"
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
};

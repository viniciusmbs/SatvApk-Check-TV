import React from 'react';
import { CheckCircle2, Info, X, Zap, BellOff } from 'lucide-react';

export interface SilentToastMessage {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type?: 'success' | 'info' | 'warning';
}

interface SilentToastProps {
  toasts: SilentToastMessage[];
  onDismiss: (id: string) => void;
}

export const SilentToast: React.FC<SilentToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="silent-toasts-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-neutral-900/95 backdrop-blur-md border border-emerald-500/50 shadow-2xl shadow-black/80 rounded-2xl p-3.5 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <Zap className="w-4 h-4 fill-emerald-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                {toast.title}
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 flex items-center gap-0.5" title="Notificação 100% silenciosa sem áudio">
                  <BellOff className="w-2.5 h-2.5" /> silencioso
                </span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">{toast.timestamp}</span>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5 leading-snug">{toast.message}</p>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Fechar"
            aria-label="Fechar notificação"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

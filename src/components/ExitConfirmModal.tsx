import React, { useEffect, useRef } from 'react';
import { soundService } from '../services/soundService';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmExit: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirmExit,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const exitBtnRef = useRef<HTMLButtonElement>(null);

  // Foco inicial padrão no 'Não' por segurança
  useEffect(() => {
    if (!isOpen) return;
    soundService.playNav();
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Suporte ao botão Voltar do controle remoto para cancelar
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.keyCode || e.which;

      const isBack =
        key === 'Escape' ||
        key === 'Backspace' ||
        key === 'GoBack' ||
        key === 'BrowserBack' ||
        key === 'Back' ||
        e.code === 'BrowserBack' ||
        code === 27 ||
        code === 8 ||
        code === 4 ||
        code === 216 ||
        code === 166 ||
        code === 10009 ||
        code === 461;

      if (isBack) {
        e.preventDefault();
        e.stopPropagation();
        soundService.playSelect();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#151923] border border-white/10 rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center space-y-5"
      >
        {/* Pergunta direta e sem rodeios */}
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Você deseja mesmo sair?
          </h2>
        </div>

        {/* Botões Sim / Não limpos */}
        <div className="flex gap-2.5">
          {/* Botão Não */}
          <button
            ref={cancelBtnRef}
            type="button"
            tabIndex={0}
            onClick={() => {
              soundService.playSelect();
              onCancel();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#222938] hover:bg-[#2c3548] text-white text-xs font-bold transition cursor-pointer outline-none border border-white/10 focus:ring-2 focus:ring-white"
          >
            Não
          </button>

          {/* Botão Sim com a cor exata #4f090d */}
          <button
            ref={exitBtnRef}
            type="button"
            tabIndex={0}
            onClick={() => {
              soundService.playSelect();
              onConfirmExit();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#4f090d] hover:bg-[#680c12] text-white text-xs font-bold transition cursor-pointer outline-none border border-red-900/50 focus:ring-2 focus:ring-red-400"
          >
            Sim
          </button>
        </div>
      </div>
    </div>
  );
};
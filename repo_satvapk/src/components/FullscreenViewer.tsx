import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Channel } from '../types';

interface FullscreenViewerProps {
  channel: Channel | null;
  onClose: () => void;
  onPrevChannel?: () => void;
  onNextChannel?: () => void;
}

export const FullscreenViewer: React.FC<FullscreenViewerProps> = ({
  channel,
  onClose,
  onPrevChannel,
  onNextChannel,
}) => {
  const [showControls, setShowControls] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const hideTimerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls when idle
  const wakeControls = () => {
    setShowControls(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  useEffect(() => {
    if (channel) {
      wakeControls();
      // Auto-focus back button for instant TV remote control & keyboard response
      const timer = setTimeout(() => {
        const backBtn = document.getElementById('viewer-back-btn');
        backBtn?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [channel]);

  useEffect(() => {
    const handleActivity = () => wakeControls();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [channel]);

  // Keyboard and TV remote control (D-Pad, Back key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      wakeControls();

      // Back button on TV remote (Escape, Backspace, Android Back key)
      if (
        e.key === 'Escape' ||
        e.key === 'Backspace' ||
        (e as any).keyCode === 10009 ||
        (e as any).keyCode === 4
      ) {
        e.preventDefault();
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleBrowserFullscreen();
      } else if ((e.key === 'ArrowLeft' || e.key === 'MediaTrackPrevious') && onPrevChannel) {
        e.preventDefault();
        onPrevChannel();
      } else if ((e.key === 'ArrowRight' || e.key === 'MediaTrackNext') && onNextChannel) {
        e.preventDefault();
        onNextChannel();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        setShowControls((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevChannel, onNextChannel]);

  if (!channel) return null;

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(channel.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      id="satv-fullscreen-viewer"
      className={`fixed inset-0 z-50 bg-black w-screen h-screen flex flex-col overflow-hidden ${
        !showControls ? 'cursor-none' : 'cursor-default'
      }`}
      onMouseMove={wakeControls}
    >
      {/* Top Floating Control Bar */}
      <header
        className={`absolute top-0 left-0 right-0 z-30 transition-all duration-300 transform ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        } bg-gradient-to-b from-black/95 via-black/75 to-transparent px-4 py-3 flex items-center justify-between`}
      >
        {/* BIG BACK BUTTON */}
        <div className="flex items-center space-x-3">
          <button
            id="viewer-back-btn"
            onClick={onClose}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-sm shadow-xl transition focus:ring-2 focus:ring-white outline-none"
            title="Voltar para a Lista de Canais (Voltar / Esc)"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar aos Canais</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2 pl-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center p-1 shrink-0">
              <img
                src={channel.logo}
                alt=""
                className="max-w-full max-h-full object-contain"
                onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
              />
            </div>
            <div>
              <span className="text-white font-bold text-sm drop-shadow">{channel.name}</span>
              <span className="ml-2 text-[10px] bg-red-600/80 text-white font-semibold px-2 py-0.5 rounded-full">
                {channel.group}
              </span>
            </div>
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center space-x-2">
          {/* Reload Frame */}
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition shadow"
            title="Recarregar canal"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Open In New Tab */}
          <a
            href={channel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 rounded-xl transition shadow"
            title="Abrir diretamente em nova aba do navegador"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Nova Aba</span>
          </a>

          {/* Browser Fullscreen Toggle */}
          <button
            onClick={toggleBrowserFullscreen}
            className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition shadow"
            title="Tela cheia total do navegador (F)"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Fullscreen Channel View */}
      <main className="flex-1 w-full h-full relative bg-black">
        <iframe
          key={`frame-${channel.url}-${reloadKey}`}
          src={channel.url}
          title={channel.name}
          className="w-full h-full border-0 bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      </main>

      {/* Bottom Floating Control Bar */}
      <footer
        className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 transform ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
        } bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 py-3 flex items-center justify-between`}
      >
        {/* Channel Navigation Buttons */}
        <div className="flex items-center space-x-2">
          {onPrevChannel && (
            <button
              onClick={onPrevChannel}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white shadow-lg transition"
              title="Canal Anterior (Seta Esquerda do controle)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Canal Anterior</span>
            </button>
          )}

          {onNextChannel && (
            <button
              onClick={onNextChannel}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white shadow-lg transition"
              title="Próximo Canal (Seta Direita do controle)"
            >
              <span>Próximo Canal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick info / Copy */}
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <button
            onClick={copyUrl}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition"
            title="Copiar URL"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Copiar Link</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
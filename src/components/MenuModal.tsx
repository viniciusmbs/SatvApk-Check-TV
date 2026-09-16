import React, { useEffect, useRef } from 'react';
import {
  X,
  Rows3,
  LayoutGrid,
  CalendarDays,
  Star,
  Download,
  ExternalLink,
  Check,
  LogOut,
} from 'lucide-react';
import { ViewMode } from '../types';
import { soundService } from '../services/soundService';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenFavorites: () => void;
  favoritesCount: number;
  totalChannels: number;
  onOpenExit?: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  viewMode,
  setViewMode,
  onOpenFavorites,
  favoritesCount,
  totalChannels,
  onOpenExit,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Focus inicial inteligente ao abrir o menu
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      // Tenta focar no botão do modo atual ou no primeiro item do menu
      let targetToFocus: HTMLElement | null = null;
      if (viewMode === 'rows') {
        targetToFocus = document.getElementById('menu-opt-rows');
      } else if (viewMode === 'grid') {
        targetToFocus = document.getElementById('menu-opt-grid');
      } else if (viewMode === 'epg') {
        targetToFocus = document.getElementById('menu-opt-epg');
      }

      if (!targetToFocus) {
        targetToFocus = modalRef.current?.querySelector<HTMLElement>('[data-menu-item="true"]') || null;
      }

      if (targetToFocus) {
        targetToFocus.focus();
        targetToFocus.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen, viewMode]);

  // Navegação D-Pad (Cima / Baixo / Enter / Voltar) exclusiva do Fire TV e Controle Remoto
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.keyCode || e.which;

      const isUp = key === 'ArrowUp' || code === 38 || code === 19;
      const isDown = key === 'ArrowDown' || code === 40 || code === 20;
      const isEnter =
        key === 'Enter' ||
        key === ' ' ||
        code === 13 ||
        code === 23 || // KEYCODE_DPAD_CENTER
        code === 66; // KEYCODE_ENTER
      const isBack =
        key === 'Escape' ||
        code === 27 ||
        code === 4 || // KEYCODE_BACK no Android / Fire TV
        code === 10009; // Samsung Tizen Return

      // 1. Fechar modal no Voltar do controle ou ESC
      if (isBack) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        // Devolve o foco para o botão de Menu da barra superior
        setTimeout(() => {
          document.getElementById('btn-three-dots-menu')?.focus();
        }, 50);
        return;
      }

      // 2. Navegação vertical (Cima / Baixo) entre os itens do menu
      if (isUp || isDown) {
        e.preventDefault();
        e.stopPropagation();

        const elements = (modalRef.current ? Array.from(modalRef.current.querySelectorAll('[data-menu-item="true"]')) : []) as HTMLElement[];
        const menuItems = elements.filter((el) => el.offsetParent !== null && !el.hasAttribute('disabled'));

        if (menuItems.length === 0) return;

        const currentActive = document.activeElement as HTMLElement | null;
        let currentIndex = currentActive ? menuItems.indexOf(currentActive) : -1;

        let nextIndex = 0;
        if (isDown) {
          nextIndex = currentIndex >= 0 && currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
        } else if (isUp) {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
        }

        const nextTarget = menuItems[nextIndex];
        if (nextTarget) {
          soundService.playNav();
          nextTarget.focus();
          nextTarget.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        return;
      }

      // 3. Enter / OK no controle remoto
      if (isEnter) {
        const currentActive = document.activeElement as HTMLElement | null;
        if (currentActive && currentActive.getAttribute('data-menu-item') === 'true') {
          e.preventDefault();
          e.stopPropagation();
          soundService.playSelect();
          currentActive.click();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#11141c] border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-gray-200 flex flex-col text-sm"
      >
        {/* Cabeçalho Minimalista e Compacto */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#161a24]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Menu Principal
              </h2>
              <span className="text-[11px] text-emerald-400 font-semibold">
                {totalChannels > 0 ? `${totalChannels} canais online` : '131 canais online'}
              </span>
            </div>
          </div>
          <button
            id="menu-btn-close-top"
            data-menu-item="true"
            type="button"
            tabIndex={0}
            onClick={onClose}
            aria-label="Fechar menu"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 focus:ring-2 focus:ring-amber-400 focus:bg-white/20 focus:text-white transition cursor-pointer outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo do Menu com Scroll suave */}
        <div
          ref={scrollContainerRef}
          className="p-4 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar scroll-smooth"
        >
          {/* 1. Modo de Exibição */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Modo de Exibição
            </span>
            <div className="grid grid-cols-1 gap-2 pt-0.5">
              {/* Fileiras Horizontais (TV) */}
              <button
                id="menu-opt-rows"
                data-menu-item="true"
                type="button"
                tabIndex={0}
                onClick={() => {
                  setViewMode('rows');
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:bg-[#222838] ${
                  viewMode === 'rows'
                    ? 'bg-red-600/20 border-red-500/80 text-white font-bold'
                    : 'bg-[#171a23] hover:bg-[#1f2330] border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Rows3
                    className={`w-4 h-4 shrink-0 ${
                      viewMode === 'rows' ? 'text-red-400' : 'text-slate-400'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold text-white">Fileiras Horizontais (TV)</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Navegação por categoria estilo Smart TV
                    </div>
                  </div>
                </div>
                {viewMode === 'rows' && <Check className="w-4 h-4 text-red-400 shrink-0 ml-2" />}
              </button>

              {/* Mosaico (Grade Vertical) */}
              <button
                id="menu-opt-grid"
                data-menu-item="true"
                type="button"
                tabIndex={0}
                onClick={() => {
                  setViewMode('grid');
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:bg-[#222838] ${
                  viewMode === 'grid'
                    ? 'bg-red-600/20 border-red-500/80 text-white font-bold'
                    : 'bg-[#171a23] hover:bg-[#1f2330] border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LayoutGrid
                    className={`w-4 h-4 shrink-0 ${
                      viewMode === 'grid' ? 'text-red-400' : 'text-slate-400'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold text-white">Mosaico (Grade Vertical)</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Todos os canais em grade compacta
                    </div>
                  </div>
                </div>
                {viewMode === 'grid' && <Check className="w-4 h-4 text-red-400 shrink-0 ml-2" />}
              </button>

              {/* Guia de Programação (EPG) */}
              <button
                id="menu-opt-epg"
                data-menu-item="true"
                type="button"
                tabIndex={0}
                onClick={() => {
                  setViewMode('epg');
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:bg-[#222838] ${
                  viewMode === 'epg'
                    ? 'bg-red-600/20 border-red-500/80 text-white font-bold'
                    : 'bg-[#171a23] hover:bg-[#1f2330] border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CalendarDays
                    className={`w-4 h-4 shrink-0 ${
                      viewMode === 'epg' ? 'text-red-400' : 'text-slate-400'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold text-white">Guia de Programação (EPG)</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Grade com horários e programas ao vivo
                    </div>
                  </div>
                </div>
                {viewMode === 'epg' && <Check className="w-4 h-4 text-red-400 shrink-0 ml-2" />}
              </button>
            </div>
          </div>

          {/* 2. Meus Favoritos */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Favoritos
            </span>
            <button
              id="menu-opt-favorites"
              data-menu-item="true"
              type="button"
              tabIndex={0}
              onClick={() => {
                onOpenFavorites();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-left cursor-pointer outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:bg-amber-500/25"
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-300">Meus Favoritos</div>
                  <div className="text-[11px] text-slate-400">
                    Aperte <strong className="text-slate-200">[ 0 ]</strong> ou <strong className="text-slate-200">Play/Pause</strong> para favoritar
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[11px] font-black">
                {favoritesCount}
              </span>
            </button>
          </div>

          {/* 3. Programa para Baixar (MX Player Pro) - Posicionado embaixo */}
          <div className="p-3.5 rounded-xl bg-[#151924] border border-white/15 space-y-2.5">
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Para visualizar certos canais IPTV (como transmissões em formato <strong className="text-white">.TS</strong>), é necessário ter o aplicativo <strong className="text-blue-300">MX Player Pro v3.1.1</strong> instalado. Basta clicar no botão abaixo para baixar o APK:
            </p>
            <a
              id="menu-opt-download-mx"
              data-menu-item="true"
              href="https://files-2.modyolo.com/MX%20Player%20Pro/MX%20Player%20Pro_v3_1_1.apk"
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={0}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all outline-none cursor-pointer shadow-lg focus:ring-2 focus:ring-amber-400 focus:border-white focus:bg-blue-500"
            >
              <Download className="w-4 h-4" />
              <span>Baixar MX Player Pro v3.1.1 (APK)</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
            </a>
          </div>

          {/* 4. Sair do aplicativo */}
          {onOpenExit && (
            <div className="pt-1">
              <button
                id="menu-opt-exit"
                data-menu-item="true"
                type="button"
                tabIndex={0}
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    onOpenExit();
                  }, 50);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-red-950/20 hover:bg-red-900/40 border border-red-500/20 transition-all text-left cursor-pointer outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 focus:bg-red-900/60"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-xs font-bold text-red-300">Sair do Aplicativo</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Rodapé com Fechar */}
        <div className="px-4 py-2.5 bg-[#0e1118] border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">D-Pad / OK / Voltar</span>
          <button
            id="menu-opt-close-bottom"
            data-menu-item="true"
            type="button"
            tabIndex={0}
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer outline-none focus:ring-2 focus:ring-amber-400 focus:bg-red-600"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

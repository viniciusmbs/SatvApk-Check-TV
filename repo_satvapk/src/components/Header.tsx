import React, { useState, useEffect } from 'react';
import { LayoutGrid, Menu, Rows3, Clock, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  totalChannels: number;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  favoritesCount?: number;
  onOpenFavorites?: () => void;
  onOpenMenu?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  totalChannels,
  viewMode,
  setViewMode,
  favoritesCount = 0,
  onOpenFavorites,
  onOpenMenu,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  // Atalho do controle remoto (Avançar / Play / F12) agora aciona a Guia EPG (setViewMode('epg'))
  useEffect(() => {
    const handleRemoteGuideKey = (e: KeyboardEvent) => {
      const isGuideKey =
        e.key === 'MediaFastForward' ||
        e.key === 'MediaPlayPause' ||
        e.key === 'F12' ||
        e.keyCode === 415 ||
        e.keyCode === 417;

      if (isGuideKey) {
        e.preventDefault();
        setViewMode('epg');
      }
    };

    window.addEventListener('keydown', handleRemoteGuideKey);
    return () => {
      window.removeEventListener('keydown', handleRemoteGuideKey);
    };
  }, [setViewMode]);

  const toggleSound = () => {
    setIsMuted((prev) => !prev);
    document.querySelectorAll('video, audio').forEach((el) => {
      (el as HTMLMediaElement).muted = !isMuted;
    });
  };

  return (
    <header className="w-full bg-gradient-to-r from-[#5f0d0d] via-[#851616] to-[#4e0909] text-white shadow-lg border-b border-black/30 select-none">
      <div className="tv-safe-container">
        <div className="flex items-center justify-between h-13 sm:h-14">
          {/* Logo & Calligraphic Slogan */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="relative flex items-center justify-center shrink-0">
              <img
                src="https://i.imgur.com/VWtF2t5.jpeg"
                alt="SATV Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white/90 shadow-md object-cover bg-black"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="sr-only">SATV</span>
            </div>

            <div className="flex items-baseline gap-2 min-w-0">
              <h1
                style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                className="text-xl sm:text-2xl text-white font-normal tracking-wide drop-shadow-md truncate py-0.5"
              >
                Aqui você é a nossa atração
              </h1>
            </div>
          </div>

          {/* Navigation Tabs, Audio, Clock & Menu Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 sm:p-1 bg-black/50 rounded-full border border-white/15 shadow-inner">
              <button
                id="tab-btn-fileiras"
                type="button"
                data-tv-nav="tab"
                tabIndex={0}
                onClick={() => setViewMode('rows')}
                className={`tv-nav-focus flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.2 rounded-full text-xs font-bold transition-all cursor-pointer outline-none ${
                  viewMode === 'rows'
                    ? 'bg-white text-[#851616] shadow-md'
                    : 'text-gray-200 hover:text-white hover:bg-white/10'
                }`}
                title="Modo TV: fileiras horizontais"
              >
                <Rows3 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Fileiras</span>
              </button>

              <button
                id="tab-btn-canais"
                type="button"
                data-tv-nav="tab"
                tabIndex={0}
                onClick={() => setViewMode('grid')}
                className={`tv-nav-focus flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.2 rounded-full text-xs font-bold transition-all cursor-pointer outline-none ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#851616] shadow-md'
                    : 'text-gray-200 hover:text-white hover:bg-white/10'
                }`}
                title="Modo Mosaico"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Mosaico</span>
              </button>

              {/* Guia EPG (Tab) - Agora acionada pelo botão avançar do controle */}
              <button
                id="tab-btn-guia-epg"
                type="button"
                data-tv-nav="tab"
                tabIndex={0}
                onClick={() => setViewMode('epg')}
                className={`tv-nav-focus flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.2 rounded-full text-xs font-bold transition-all cursor-pointer outline-none ${
                  viewMode === 'epg'
                    ? 'bg-white text-[#851616] shadow-md font-extrabold'
                    : 'text-gray-200 hover:text-white hover:bg-white/10'
                }`}
                title="Guia EPG de canais e programação ao vivo"
              >
                <Menu className={`w-3.5 h-3.5 ${viewMode === 'epg' ? 'text-amber-500' : 'text-gray-200'}`} />
                <span>Guia</span>
              </button>
            </div>

            {/* Volume / Áudio Button */}
            <button
              id="btn-header-volume"
              type="button"
              data-tv-nav="tab"
              tabIndex={0}
              onClick={toggleSound}
              className="tv-nav-focus flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/60 text-gray-200 hover:text-white border border-white/15 shadow-inner transition cursor-pointer outline-none"
              title={isMuted ? 'Ativar Som' : 'Desativar Som (Mudo)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-gray-200" />}
            </button>

            {/* Smart TV Real-Time Clock */}
            {timeStr && (
              <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-black/40 border border-white/15 text-xs font-mono font-bold text-white shadow-inner">
                <Clock className="w-3.5 h-3.5 text-gray-300" />
                <span>{timeStr}</span>
              </div>
            )}

            {/* Botão de Menu Principal (Cor da barra, sem moldura amarela, pontinhos brancos) */}
            {onOpenMenu && (
              <button
                id="btn-three-dots-menu"
                type="button"
                data-tv-nav="tab"
                tabIndex={0}
                onClick={onOpenMenu}
                className="tv-nav-focus flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#540b0b] hover:bg-[#6b0f0f] active:bg-[#430808] text-white transition cursor-pointer outline-none border-0 shadow-inner"
                title="Abrir Menu Principal"
                aria-label="Menu Principal"
              >
                <MoreVertical className="w-5 h-5 text-white stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
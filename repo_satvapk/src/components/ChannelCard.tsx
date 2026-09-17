import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Channel, UiDensity } from '../types';
import { getChannelLogo } from '../data/channelLogos';
import { soundService } from '../services/soundService';

interface ChannelCardProps {
  channel: Channel;
  index: number;
  isFavorite?: boolean;
  onToggleFavorite?: (channelName: string) => void;
  onSelect?: (channel: Channel) => void;
  density?: UiDensity;
}

// Normalização inteligente de títulos de canais para caberem perfeitamente nos botões estando se foi
export function formatChannelDisplayName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const upper = trimmed.toUpperCase();

  // Caso específico apontado: Integração Juiz de Fora -> TV Integração
  if (upper.includes('INTEGRAÇÃO') || upper.includes('INTEGRACAO')) {
    return 'TV Integração';
  }

  // Caso específico: SBT MG Alterosa -> SBT Alterosa
  if (upper.includes('ALTEROSA')) {
    return 'SBT Alterosa';
  }

  // Record: padroniza nomes como Record TV, Record News, etc.
  if (upper === 'RECORD' || upper === 'RECORD TV') {
    return 'Record TV';
  }

  // Limpeza de ruídos técnicos de M3U como [FHD], (HD), etc.
  return trimmed
    .replace(/\s*\[(FHD|HD|SD|4K|HEVC|H\.265)\]/gi, '')
    .replace(/\s*\((FHD|HD|SD|4K|HEVC|H\.265)\)/gi, '')
    .replace(/\s*-\s*(FHD|HD|SD|4K)/gi, '')
    .replace(/\s+(FHD|HD|SD|4K)$/gi, '')
    .trim();
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  index,
  isFavorite = false,
  onToggleFavorite,
  onSelect,
  density = 'compact',
}) => {
  const [imgError, setImgError] = useState(false);
  const displayName = formatChannelDisplayName(channel.name);

  // Fallback to official high-quality logo mapping or styled SVG badge
  const officialLogo = getChannelLogo(channel.name);
  const genericBadge = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" width="100%" height="100%"><rect width="160" height="90" rx="12" fill="%23131b2c"/><rect x="8" y="8" width="144" height="74" rx="8" fill="%231a2438" stroke="%23334155" stroke-width="2"/><text x="80" y="52" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="%23e2e8f0" text-anchor="middle" letter-spacing="1">${encodeURIComponent(channel.name.slice(0, 10).toUpperCase())}</text></svg>`;
  const logoSrc = imgError ? genericBadge : (channel.logo || officialLogo);

  // Ação 1: Abrir o canal com o som BotaoRadio.mp3 (Enter / OK / Clique)
  const handleOpenChannel = () => {
    soundService.playSelect();
    try {
      const channelId = channel.id || encodeURIComponent(channel.name);
      localStorage.setItem('satv_last_focused_channel_name', channel.name);
      localStorage.setItem('satv_last_focused_channel_id', channelId);
      localStorage.setItem('satv_last_scroll_y', String(window.scrollY));
      localStorage.setItem('satv_should_restore_channel', 'true');
      sessionStorage.setItem('satv_last_focused_channel_name', channel.name);
      sessionStorage.setItem('satv_last_focused_channel_id', channelId);
      sessionStorage.setItem('satv_last_scroll_y', String(window.scrollY));
      sessionStorage.setItem('satv_should_restore_channel', 'true');
    } catch {
      // ignore
    }
    if (onSelect) {
      onSelect(channel);
    }
    window.open(channel.url, '_blank', 'noopener,noreferrer');
  };

  // Ação 2: Alternar Favorito
  const handleToggleFavoriteAction = () => {
    soundService.playSelect();
    if (onToggleFavorite) {
      onToggleFavorite(channel.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const code = e.keyCode || e.which;
    const key = e.key;

    // 1. Botão Play / Pause do controle do Fire TV / Android TV (KeyCode 85 / MediaPlayPause)
    const isPlayPauseKey =
      code === 85 ||
      code === 126 ||
      code === 127 ||
      key === 'MediaPlayPause' ||
      e.code === 'MediaPlayPause' ||
      key === 'Play' ||
      key === 'Pause' ||
      key === 'p' ||
      key === 'P';

    if (isPlayPauseKey) {
      e.preventDefault();
      e.stopPropagation();
      handleToggleFavoriteAction();
      return;
    }

    // 2. Botão OK / ENTER no meio do D-Pad do controle
    const isOkEnterKey =
      key === 'Enter' ||
      key === ' ' ||
      code === 13 ||
      code === 23 ||
      code === 66;

    if (isOkEnterKey) {
      e.preventDefault();
      e.stopPropagation();
      handleOpenChannel();
      return;
    }

    // 3. Tecla 'f' / 'F' ou '0' para alternar favorito pelo teclado
    if (key === 'f' || key === 'F' || key === '0' || code === 48 || code === 96) {
      e.preventDefault();
      e.stopPropagation();
      handleToggleFavoriteAction();
      return;
    }
  };

  return (
    <a
      id={`channel-card-${channel.id || encodeURIComponent(channel.name)}`}
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={0}
      role="button"
      aria-label={`Canal ${channel.name} - Abrir canal. Pressione Play/Pause para favoritar.`}
      data-tv-card="true"
      data-channel-name={channel.name}
      data-channel-index={index}
      onClick={(e) => {
        e.preventDefault();
        handleOpenChannel();
      }}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        soundService.playNav();
        try {
          const channelId = channel.id || encodeURIComponent(channel.name);
          localStorage.setItem('satv_last_focused_channel_name', channel.name);
          localStorage.setItem('satv_last_focused_channel_id', channelId);
          localStorage.setItem('satv_last_scroll_y', String(window.scrollY));
          sessionStorage.setItem('satv_last_focused_channel_name', channel.name);
          sessionStorage.setItem('satv_last_focused_channel_id', channelId);
          sessionStorage.setItem('satv_last_scroll_y', String(window.scrollY));
        } catch {
          // ignore
        }
      }}
      className={`group tv-card-focus relative aspect-square bg-[#131620] hover:bg-[#1b1f2c] focus:bg-[#1b1f2c] border rounded-lg sm:rounded-xl p-1 sm:p-1.5 flex flex-col items-center justify-between text-center transition-all duration-150 cursor-pointer outline-none select-none shadow-sm hover:shadow-md shrink-0 ${
        isFavorite
          ? 'border-amber-400/60 hover:border-amber-400 focus:border-amber-400'
          : 'border-white/10 hover:border-red-500 focus:border-red-500'
      }`}
    >
      {/* Estrelinha indicadora de Favorito */}
      {onToggleFavorite && (
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggleFavoriteAction();
          }}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          title={isFavorite ? 'Favorito ativo' : 'Favoritar'}
          className={`absolute top-1 right-1 z-10 p-0.5 sm:p-1 rounded-md transition-all ${
            isFavorite
              ? 'text-amber-400 bg-black/75 shadow-sm opacity-100 scale-100'
              : 'text-white/40 hover:text-amber-300 bg-black/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100'
          }`}
        >
          <Star className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      )}

      {/* Auto-responsive Channel Logo Cradle */}
      <div className="relative w-full flex-1 min-h-0 flex items-center justify-center p-1 sm:p-1.5 channel-logo-cradle rounded-md sm:rounded-lg overflow-hidden transition">
        <img
          src={logoSrc}
          alt={`${channel.name} logo`}
          className="max-w-[85%] max-h-[75%] object-contain channel-logo-img drop-shadow-sm transition-transform duration-150 group-hover:scale-105 group-focus:scale-105"
          onError={() => setImgError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Auto-responsive Channel Title with 2-line standardized alignment */}
      <div className="w-full h-[2.5em] flex items-center justify-center px-1 pb-0.5 overflow-hidden">
        <p
          className={`w-full text-center font-bold leading-tight line-clamp-2 break-words transition-colors text-[clamp(8px,1.9vw,11px)] sm:text-[clamp(9px,1.1vw,12px)] ${
            isFavorite ? 'text-amber-200' : 'text-gray-100 group-hover:text-red-400 group-focus:text-red-400'
          }`}
          title={channel.name}
        >
          {displayName}
        </p>
      </div>
    </a>
  );
};

export default ChannelCard;
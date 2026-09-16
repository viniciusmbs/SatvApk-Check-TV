import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Channel, GroupedChannels, UiDensity } from '../types';
import ChannelCard from './ChannelCard';
import { soundService } from '../services/soundService';

interface ChannelRowsProps {
  groupedChannels: GroupedChannels;
  favorites: string[];
  onToggleFavorite: (channelName: string) => void;
  onSelectChannel: (channel: Channel) => void;
  onClearFilters: () => void;
  density?: UiDensity;
}

const CATEGORY_ORDER: Record<string, number> = {
  'FAVORITOS': 0,
  'CANAL': 1,
  'DOCUMENTÁRIOS': 2,
  'FILMES & SÉRIES': 3,
  'FILMES E SÉRIES': 3,
  'VARIEDADES': 4,
  'ESPORTES': 5,
  'ESPN': 6,
  'PREMIERE': 7,
  'ESPORTES PPV': 8,
  'HBO': 9,
  'NOTÍCIAS': 10,
  'INFANTIS': 11,
  'MÚSICA': 12,
  'RELIGIOSOS': 13,
};

const RowSection: React.FC<{
  title: string;
  isFavRow?: boolean;
  channels: Channel[];
  favorites: string[];
  startIndex: number;
  onToggleFavorite: (channelName: string) => void;
  onSelectChannel: (channel: Channel) => void;
  density: UiDensity;
}> = ({
  title,
  isFavRow = false,
  channels,
  favorites,
  startIndex,
  onToggleFavorite,
  onSelectChannel,
  density,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    soundService.playNav();
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Fluid auto-scaling card width across mobile and TV screens with comfortable spacing
  const cardWidthClass =
    density === 'large'
      ? 'w-[82px] min-[360px]:w-[90px] sm:w-[102px] md:w-[112px] lg:w-[122px] xl:w-[130px] shrink-0'
      : density === 'normal'
      ? 'w-[72px] min-[360px]:w-[80px] sm:w-[90px] md:w-[100px] lg:w-[108px] xl:w-[116px] shrink-0'
      : 'w-[66px] min-[360px]:w-[74px] sm:w-[84px] md:w-[92px] lg:w-[100px] xl:w-[108px] shrink-0';

  return (
    <section className="space-y-2">
      {/* Category Header with Scroll Arrows */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <div className="flex items-center space-x-2">
          {isFavRow ? (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50" />
          )}
          <h2 className={`text-xs sm:text-sm font-bold tracking-wide uppercase ${isFavRow ? 'text-amber-300' : 'text-gray-100'}`}>
            {title}
          </h2>
          <span className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.2 rounded-full border ${
            isFavRow
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-[#171a23] text-slate-400 border-white/5'
          }`}>
            {channels.length} {channels.length === 1 ? 'canal' : 'canais'}
          </span>
        </div>

        {/* Horizontal Navigation Buttons */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => handleScroll('left')}
            aria-label="Rolar para a esquerda"
            className="p-1 rounded-lg bg-[#171a23] hover:bg-[#222736] text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => handleScroll('right')}
            aria-label="Rolar para a direita"
            className="p-1 rounded-lg bg-[#171a23] hover:bg-[#222736] text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
      >
        {channels.map((channel, i) => (
          <div
            key={`${channel.name}-${channel.url}`}
            className={cardWidthClass}
          >
            <ChannelCard
              channel={channel}
              index={startIndex + i}
              isFavorite={favorites.includes(channel.name)}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectChannel}
              density={density}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

const ChannelRows: React.FC<ChannelRowsProps> = ({
  groupedChannels,
  favorites,
  onToggleFavorite,
  onSelectChannel,
  onClearFilters,
  density = 'compact',
}) => {
  const sortedGroupNames = Object.keys(groupedChannels).sort((a, b) => {
    const upperA = a.toUpperCase();
    const upperB = b.toUpperCase();

    const orderA = CATEGORY_ORDER[upperA] ?? 50;
    const orderB = CATEGORY_ORDER[upperB] ?? 50;

    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b, 'pt-BR');
  });

  if (sortedGroupNames.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500 border border-slate-700/60">
          <Star className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-200 mb-1">
          Nenhum canal encontrado
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-5">
          Para favoritar um canal, clique na estrelinha no canto superior de qualquer canal.
        </p>
        <button
          onClick={onClearFilters}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition shadow-md cursor-pointer"
        >
          Limpar Filtros e Ver Todos
        </button>
      </div>
    );
  }

  let globalIndex = 0;

  return (
    <div className="tv-safe-container py-3 sm:py-4 space-y-3.5 sm:space-y-4">
      {sortedGroupNames.map((groupName) => {
        const channels = groupedChannels[groupName];
        if (!channels || channels.length === 0) return null;

        const isFavRow = groupName === 'FAVORITOS';
        const startIndex = globalIndex;
        globalIndex += channels.length;

        return (
          <RowSection
            key={groupName}
            title={groupName}
            isFavRow={isFavRow}
            channels={channels}
            favorites={favorites}
            startIndex={startIndex}
            onToggleFavorite={onToggleFavorite}
            onSelectChannel={onSelectChannel}
            density={density}
          />
        );
      })}
    </div>
  );
};

export default ChannelRows;

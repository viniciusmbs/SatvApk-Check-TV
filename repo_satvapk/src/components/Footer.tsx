import React from 'react';

interface FooterProps {
  totalChannels?: number;
  favoritesCount?: number;
}

const Footer: React.FC<FooterProps> = ({ totalChannels = 0, favoritesCount = 0 }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      style={{ backgroundColor: '#330303' }}
      className="w-full border-t border-[#4d0707] bg-[#330303] py-2 sm:py-2.5 text-red-200/80 mt-auto transition-all select-none shadow-md"
    >
      <div className="tv-safe-container flex flex-col items-center justify-center text-center gap-1">
        
        {/* Linha superior: Sistema Online e Canais */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-red-200/90 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sistema Online {totalChannels > 0 && `• ${totalChannels} Canais`}
          </span>
          {favoritesCount > 0 && (
            <>
              <span className="text-white/30">&bull;</span>
              <span className="text-amber-300 font-semibold">
                ⭐ {favoritesCount} {favoritesCount === 1 ? 'favorito' : 'favoritos'}
              </span>
            </>
          )}
          <span className="text-white/30 hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline text-red-200/80">Fire TV D-Pad 4K</span>
        </div>

        {/* Linha única com o Logo e o texto esticado na mesma cor e tamanho */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-red-200/80">
          <img
            src="https://i.imgur.com/VWtF2t5.jpeg"
            alt="SATV Logo"
            className="w-4 h-4 rounded-full border border-white/40 object-cover shadow-sm opacity-90"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span>Vinícius Mendes &reg; {currentYear}</span>
          <span className="text-red-300/40">&bull;</span>
          <span>Todos os direitos reservados</span>
          <span className="text-red-300/40">&bull;</span>
          <span>Contato:</span>
          <a
            href="mailto:vini©¿©ius@mail.bg"
            className="text-red-200/80 hover:text-white underline underline-offset-2 transition-colors"
          >
            vinicius@mail.bg
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
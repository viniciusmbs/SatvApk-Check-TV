import React from 'react';
import { Search, X, Tv } from 'lucide-react';
import { soundService } from '../services/soundService';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  filteredCount: number;
}

const CATEGORY_PRIORITY: Record<string, number> = {
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

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
  filteredCount,
}) => {
  const sortedCategories = [...categories].sort((a, b) => {
    const pA = CATEGORY_PRIORITY[a.toUpperCase()] ?? 50;
    const pB = CATEGORY_PRIORITY[b.toUpperCase()] ?? 50;
    if (pA !== pB) return pA - pB;
    return a.localeCompare(b, 'pt-BR');
  });

  const handleSelectCategory = (cat: string) => {
    soundService.playSelect();
    setSelectedCategory(cat);
  };

  const handleClearSearch = () => {
    soundService.playSelect();
    setSearchQuery('');
  };

  return (
    <div className="w-full bg-[#10121a]/95 backdrop-blur-md border-b border-white/5 py-1.5 sm:py-2 shadow-md overflow-hidden">
      {/* Alinhamento unificado e seguro com o restante da aplicação */}
      <div className="tv-safe-container space-y-1.5 min-w-0">
        
        {/* Linha superior: Input de busca + Contador de canais */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="relative flex-1 max-w-xl min-w-0">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              id="channel-search-input"
              type="text"
              tabIndex={1}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar canal..."
              className="w-full bg-[#171a23] text-gray-100 placeholder-slate-400 text-xs rounded-lg pl-8 pr-8 py-1.5 border border-white/15 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                title="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Contador de canais com a TV verde */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 font-medium whitespace-nowrap shrink-0">
            <Tv className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Mostrando <span className="text-red-400 font-semibold">{filteredCount}</span> canais
            </span>
          </div>
        </div>

        {/* Linha inferior: Lista horizontal limpa de Categorias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar w-full min-w-0 scroll-smooth">
          {/* Categoria: Todos */}
          <button
            data-tv-nav="category"
            data-category-index={0}
            tabIndex={0}
            onClick={() => handleSelectCategory('TODOS')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 outline-none ${
              selectedCategory === 'TODOS'
                ? 'bg-red-600 text-white border border-red-500 shadow-sm'
                : 'bg-[#171a23] hover:bg-[#252b3b] text-slate-300 hover:text-white border border-white/10 focus:ring-2 focus:ring-red-400'
            }`}
          >
            Todos
          </button>

          {/* Demais Categorias */}
          {sortedCategories.map((category, idx) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                data-tv-nav="category"
                data-category-index={idx + 1}
                tabIndex={0}
                onClick={() => handleSelectCategory(category)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 outline-none ${
                  isSelected
                    ? 'bg-red-600 text-white border border-red-500 shadow-sm'
                    : 'bg-[#171a23] hover:bg-[#252b3b] text-slate-300 hover:text-white border border-white/10 focus:ring-2 focus:ring-red-400'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default SearchBar;
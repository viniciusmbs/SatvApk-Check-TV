import React from 'react';
import { Tv, Terminal, Sparkles, Github, ShieldCheck, Cpu } from 'lucide-react';

interface HeaderProps {
  activeTab: 'tester' | 'generator' | 'guide' | 'tv-preview';
  setActiveTab: (tab: 'tester' | 'generator' | 'guide' | 'tv-preview') => void;
  onlineCount: number;
  offlineCount: number;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onlineCount,
  offlineCount,
  totalCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Tv className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  IPTV GitHub Status Bot
                </h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {totalCount} Canais Monitorados
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Checagem automatizada na nuvem via GitHub Actions e alimentação leve da Smart TV
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges (Clickable Filters) */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <button
              onClick={() => setActiveTab('tester')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 transition-colors"
              title="Ir para o Testador"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Online: <strong className="text-emerald-400">{onlineCount}</strong>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tester')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-red-500/30 text-red-300 transition-colors"
              title="Filtrar canais offline no testador"
            >
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>
                Offline: <strong className="text-red-400">{offlineCount}</strong>
              </span>
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hidden sm:flex">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>0% Peso na TV</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Tab 1 is now Tester & Simulator! */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-900 pt-1 -mb-px text-sm">
          <button
            onClick={() => setActiveTab('tester')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'tester'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>1. Testador & Simulador da Action ({totalCount} Canais)</span>
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'generator'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>2. Gerador do Repositório (Arquivos)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>3. Passo a Passo no GitHub (Item 4)</span>
          </button>

          <button
            onClick={() => setActiveTab('tv-preview')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'tv-preview'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>4. Simulador Smart TV</span>
          </button>
        </div>
      </div>
    </header>
  );
};

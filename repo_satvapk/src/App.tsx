import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Channel, GroupedChannels, ViewMode } from './types';
import { parseM3U } from './services/m3uParser';
import { m3uPlaylist } from './data/playlist';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ChannelRows from './components/ChannelRows';
import ChannelGrid from './components/ChannelGrid';
import EpgGrid from './components/EpgGrid';
import Footer from './components/Footer';
import { MenuModal } from './components/MenuModal';
import { ExitConfirmModal } from './components/ExitConfirmModal';
import { soundService } from './services/soundService';
import { useTvNavigation } from './services/useTvNavigation';

export default function App() {
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      return parseM3U(m3uPlaylist);
    } catch (err) {
      console.error('Erro ao processar canais:', err);
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [viewMode, setViewMode] = useState<ViewMode>('rows');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Estado para controlar a trava de segurança de saída
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('satv_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2800);
  };

  // Toggle favorite channel
  const handleToggleFavorite = (channelName: string) => {
    setFavorites((prev) => {
      const isAlready = prev.includes(channelName);
      const next = isAlready
        ? prev.filter((name) => name !== channelName)
        : [...prev, channelName];
      try {
        localStorage.setItem('satv_favorites', JSON.stringify(next));
      } catch {
        // ignore localStorage errors
      }
      showToast(
        isAlready
          ? `Removido dos Favoritos: ${channelName}`
          : `⭐ ${channelName} adicionado aos Meus Favoritos!`
      );
      return next;
    });
  };

  // Load initial playlist
  useEffect(() => {
    try {
      const parsed = parseM3U(m3uPlaylist);
      setChannels(parsed);
    } catch (err) {
      console.error('Falha ao carregar playlist inicial:', err);
    }
  }, []);

  // Distinct categories from channels
  const categories = useMemo(() => {
    const cats = new Set<string>();
    channels.forEach((c) => {
      if (c.group) cats.add(c.group);
    });
    return Array.from(cats);
  }, [channels]);

  // Filter channels based on search and category
  const filteredChannels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return channels.filter((channel) => {
      // Category filter (handles FAVORITOS filter explicitly)
      if (selectedCategory === 'FAVORITOS') {
        if (!favorites.includes(channel.name)) {
          return false;
        }
      } else if (selectedCategory !== 'TODOS' && channel.group !== selectedCategory) {
        return false;
      }

      // Search query filter (matches channel name or group)
      if (q) {
        const nameMatch = channel.name.toLowerCase().includes(q);
        const groupMatch = channel.group.toLowerCase().includes(q);
        return nameMatch || groupMatch;
      }

      return true;
    });
  }, [channels, searchQuery, selectedCategory, favorites]);

  // Group filtered channels by group title
  const groupedChannels = useMemo(() => {
    const grouped: GroupedChannels = {};
    filteredChannels.forEach((ch) => {
      const g = ch.group || 'GERAL';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(ch);
    });
    return grouped;
  }, [filteredChannels]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('TODOS');
  };

  // Active TV tabulation navigation hook (disabled while menu modal or exit modal is open)
  const { lastFocusedCardRef } = useTvNavigation({ enabled: !isMenuOpen && !showExitConfirm });

  const handleSelectChannel = (ch: Channel) => {
    const cardEl =
      document.getElementById(`channel-card-${ch.id || encodeURIComponent(ch.name)}`) ||
      document.getElementById(`epg-card-${ch.id || encodeURIComponent(ch.name)}`);
    if (cardEl) {
      lastFocusedCardRef.current = cardEl;
    }
  };

  // Referência de estado em tempo real para evitar problemas de stale closure
  // e permitir listeners de histórico e controle remoto estáveis
  const stateRef = useRef({
    isMenuOpen,
    showExitConfirm,
    searchQuery,
    selectedCategory,
  });

  useEffect(() => {
    stateRef.current = {
      isMenuOpen,
      showExitConfirm,
      searchQuery,
      selectedCategory,
    };
  }, [isMenuOpen, showExitConfirm, searchQuery, selectedCategory]);

  const lastBackTimestampRef = useRef<number>(0);

  // Despachante unificado da ação Voltar (Fire TV Remote, Teclado, Popstate, Android Back, WebView)
  const executeBackStep = () => {
    const now = Date.now();
    // Debounce de 300ms para evitar disparos duplicados entre keydown, keyup e popstate
    if (now - lastBackTimestampRef.current < 300) {
      return;
    }
    lastBackTimestampRef.current = now;

    const current = stateRef.current;

    // 1. Se o menu lateral estiver aberto, fecha o menu primeiro
    if (current.isMenuOpen) {
      soundService.playNav();
      setIsMenuOpen(false);
      return;
    }

    // 2. Se a confirmação de saída já estiver na tela e o usuário apertar Voltar de novo, cancela e continua
    if (current.showExitConfirm) {
      soundService.playSelect();
      setShowExitConfirm(false);
      return;
    }

    // 3. Se tiver texto ou busca ativa, o primeiro Voltar limpa a busca e foca no primeiro canal
    if (current.searchQuery) {
      soundService.playNav();
      setSearchQuery('');
      const firstCard = document.querySelector<HTMLElement>('[data-channel-name]');
      firstCard?.focus();
      return;
    }

    // 4. Se estiver navegando em uma categoria específica (Filmes, Esportes, etc.), volta para 'TODOS'
    if (current.selectedCategory !== 'TODOS') {
      soundService.playNav();
      setSelectedCategory('TODOS');
      return;
    }

    // 5. Está na tela inicial (TODOS, sem busca ativa e sem menu):
    // ABRE A CONFIRMAÇÃO DE SAÍDA ("Você deseja sair do SATV?")
    soundService.playNav();
    setShowExitConfirm(true);
  };

  // Trava de segurança no histórico do navegador e WebView (Android / Celular / Firestick Silk)
  useEffect(() => {
    // 1. Inicializa o Sentinela de Histórico com hash dedicado
    const ensureHistoryGuard = () => {
      try {
        if (window.location.hash !== '#app') {
          window.history.replaceState({ satv: 'root' }, '', window.location.pathname + window.location.search + '#root');
          window.history.pushState({ satv: 'app' }, '', window.location.pathname + window.location.search + '#app');
        }
      } catch {
        // ignore
      }
    };

    ensureHistoryGuard();

    // 2. Garante o registro de gesto do usuário para contornar a "History Intervention" do Chrome/Chromium
    const primeUserGesture = () => {
      try {
        if (window.location.hash !== '#app') {
          window.history.pushState({ satv: 'app' }, '', window.location.pathname + window.location.search + '#app');
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('click', primeUserGesture, { capture: true, passive: true });
    window.addEventListener('keydown', primeUserGesture, { capture: true, passive: true });
    window.addEventListener('touchstart', primeUserGesture, { capture: true, passive: true });

    // 3. Ao voltar no histórico (botão Voltar do celular, gesto do Android, ou botão voltar do navegador)
    const handlePopState = () => {
      // Re-injeta imediatamente o estado '#app' para que a trava permaneça armada
      try {
        window.history.pushState({ satv: 'app' }, '', window.location.pathname + window.location.search + '#app');
      } catch {
        // ignore
      }
      executeBackStep();
    };

    const handleHashChange = () => {
      if (window.location.hash !== '#app') {
        try {
          window.history.pushState({ satv: 'app' }, '', window.location.pathname + window.location.search + '#app');
        } catch {
          // ignore
        }
        executeBackStep();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);

    // 4. Suporte nativo para Cordova / Capacitor / WebView APK (evento 'backbutton' no document)
    const handleCordovaBack = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      executeBackStep();
    };
    document.addEventListener('backbutton', handleCordovaBack, false);

    // 5. Suporte para WebView Android que chama bridges JavaScript
    (window as unknown as { onBackPressed?: () => boolean }).onBackPressed = () => {
      executeBackStep();
      return true;
    };
    (window as unknown as { onBack?: () => boolean }).onBack = () => {
      executeBackStep();
      return true;
    };
    (window as unknown as { handleAndroidBack?: () => boolean }).handleAndroidBack = () => {
      executeBackStep();
      return true;
    };

    return () => {
      window.removeEventListener('click', primeUserGesture, { capture: true });
      window.removeEventListener('keydown', primeUserGesture, { capture: true });
      window.removeEventListener('touchstart', primeUserGesture, { capture: true });
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('backbutton', handleCordovaBack, false);
      delete (window as unknown as { onBackPressed?: () => boolean }).onBackPressed;
      delete (window as unknown as { onBack?: () => boolean }).onBack;
      delete (window as unknown as { handleAndroidBack?: () => boolean }).handleAndroidBack;
    };
  }, []);

  // Interceptação pelo controle remoto do Fire TV Stick, Android TV e Teclado Físico
  useEffect(() => {
    const isBackKeyEvent = (e: KeyboardEvent) => {
      const code = e.keyCode || e.which;
      const key = e.key;

      return (
        code === 4 || // KEYCODE_BACK (Fire TV, Android TV, TV Box)
        code === 27 || // Escape
        key === 'Escape' ||
        key === 'Back' ||
        key === 'GoBack' ||
        key === 'BrowserBack' ||
        e.code === 'BrowserBack' ||
        code === 10009 || // Samsung Tizen Return
        code === 461 || // LG webOS Back
        code === 216 || // Amazon Fire TV Silk Back
        code === 166 || // Browser Back
        ((key === 'Backspace' || code === 8) &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA')
      );
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMenuKey =
        e.keyCode === 82 ||
        e.which === 82 ||
        e.key === 'ContextMenu' ||
        e.code === 'ContextMenu' ||
        e.key === 'Menu' ||
        ((e.key === 'm' || e.key === 'M') &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA');

      if (isMenuKey) {
        e.preventDefault();
        e.stopPropagation();
        setIsMenuOpen((prev) => !prev);
        return;
      }

      if (isBackKeyEvent(e)) {
        e.preventDefault();
        e.stopPropagation();
        executeBackStep();
        return;
      }

      if ((e.key === '/' || e.key === 's') && document.activeElement?.tagName !== 'INPUT') {
        const searchInput = document.getElementById('channel-search-input');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (isBackKeyEvent(e)) {
        e.preventDefault();
        e.stopPropagation();
        executeBackStep();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    window.addEventListener('keyup', handleGlobalKeyUp, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
      window.removeEventListener('keyup', handleGlobalKeyUp, { capture: true });
    };
  }, []);

  const handleConfirmExit = () => {
    soundService.playSelect();
    setShowExitConfirm(false);

    // 1. Tenta encerrar o aplicativo nativo se estiver em APK Android / Cordova / Capacitor
    try {
      if ((navigator as unknown as { app?: { exitApp: () => void } }).app?.exitApp) {
        (navigator as unknown as { app?: { exitApp: () => void } }).app.exitApp();
        return;
      }
    } catch {
      // ignore
    }

    try {
      if ((window as unknown as { Android?: { exitApp: () => void } }).Android?.exitApp) {
        (window as unknown as { Android?: { exitApp: () => void } }).Android.exitApp();
        return;
      }
    } catch {
      // ignore
    }

    // 2. Tenta fechar a janela/aba do navegador imediatamente
    try {
      window.close();
    } catch {
      // ignore
    }

    // 3. Se o navegador não fechar window.close(), tenta voltar o histórico ou redirecionar para tela em branco
    try {
      window.location.href = 'about:blank';
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-gray-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Sticky Top Navigation & Filter Bar - Layer fixa do programa (100% sólida e isolada para não transpassar) */}
      <div className="sticky top-0 z-50 w-full shadow-2xl bg-[#0c0e14] isolate [transform:translateZ(0)]">
        <Header
          totalChannels={channels.length}
          viewMode={viewMode}
          setViewMode={setViewMode}
          favoritesCount={favorites.length}
          onOpenFavorites={() => {
            setSelectedCategory('FAVORITOS');
            if (viewMode === 'epg') setViewMode('rows');
          }}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          filteredCount={filteredChannels.length}
        />
      </div>

      {/* Main View: Fileiras (Carrossel TV), Mosaico (Grid) ou Guia (EPG) */}
      <main className="flex-1">
        {viewMode === 'rows' && (
          <ChannelRows
            groupedChannels={groupedChannels}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectChannel={handleSelectChannel}
            onClearFilters={handleClearFilters}
          />
        )}
        {viewMode === 'grid' && (
          <ChannelGrid
            groupedChannels={groupedChannels}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectChannel={handleSelectChannel}
            onClearFilters={handleClearFilters}
          />
        )}
        {viewMode === 'epg' && (
          <EpgGrid
            groupedChannels={groupedChannels}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectChannel={handleSelectChannel}
            onClearFilters={handleClearFilters}
          />
        )}
      </main>

      {/* Floating Smart TV Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#171a23]/95 border border-amber-400/60 rounded-xl shadow-2xl text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2 backdrop-blur-md transition-all">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Trava de Segurança: Modal de Confirmação de Saída */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirmExit={handleConfirmExit}
      />

      {/* Clean TV Footer */}
      <Footer totalChannels={channels.length} favoritesCount={favorites.length} />

      {/* Three Dots / Menu List Modal */}
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenFavorites={() => {
          setSelectedCategory('FAVORITOS');
          if (viewMode === 'epg') setViewMode('rows');
        }}
        favoritesCount={favorites.length}
        totalChannels={channels.length}
      />
    </div>
  );
}
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Globe,
  Activity,
  Layers,
  Search,
  Filter,
  Radio,
  Send,
  Sliders,
  CheckCircle2,
  Trash2,
  Tv,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { AnalyticsSummary, CityClickMetric, LinkClickMetric, ClickEventLog } from '../types';
import {
  fetchAnalyticsSummary,
  getStoredMeasurementId,
  setStoredMeasurementId,
  trackLinkClick,
  detectUserLocation,
  resetAnalyticsData,
  UserGeoInfo,
} from '../services/analyticsService';

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [measurementId, setMeasurementId] = useState<string>(getStoredMeasurementId());
  const [measurementIdSaved, setMeasurementIdSaved] = useState<boolean>(false);
  const [citySearch, setCitySearch] = useState<string>('');
  const [linkSearch, setLinkSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'cities' | 'links' | 'ga4' | 'live'>('overview');
  
  // Informações de geolocalização do usuário atual
  const [currentUserGeo, setCurrentUserGeo] = useState<UserGeoInfo | null>(null);
  const [isSimulatingClick, setIsSimulatingClick] = useState<boolean>(false);
  const [simulationFeedback, setSimulationFeedback] = useState<string | null>(null);

  // Carrega os dados analíticos
  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const summary = await fetchAnalyticsSummary();
      setData(summary);
    } catch (err) {
      console.error('Erro ao carregar dados de analytics:', err);
    } finally {
      setIsLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    detectUserLocation().then(geo => setCurrentUserGeo(geo));

    // Escuta cliques que acontecem em tempo real no app (ex: no testador, botões ou na TV)
    const handleRealtimeClick = (e: Event) => {
      const customEvent = e as CustomEvent<ClickEventLog>;
      const eventLog = customEvent.detail;
      if (eventLog) {
        setData(prev => {
          if (!prev) return prev;
          const updatedTotal = (prev.totalClicks || 0) + 1;
          const updatedRecent = [eventLog, ...(prev.recentClicks || []).slice(0, 99)];

          // Atualiza lista de links em tempo real
          let updatedLinks = [...(prev.clicksByLink || [])];
          const lIndex = updatedLinks.findIndex(l => l.linkId === eventLog.linkId || l.linkName.toLowerCase() === eventLog.linkName.toLowerCase());
          if (lIndex >= 0) {
            updatedLinks[lIndex] = {
              ...updatedLinks[lIndex],
              count: updatedLinks[lIndex].count + 1,
              lastClicked: eventLog.timestamp,
            };
          } else {
            updatedLinks.push({
              linkId: eventLog.linkId,
              linkName: eventLog.linkName,
              linkUrl: eventLog.linkUrl,
              category: eventLog.category,
              count: 1,
              lastClicked: eventLog.timestamp,
            });
          }
          updatedLinks.sort((a, b) => b.count - a.count);

          // Atualiza lista de cidades em tempo real
          let updatedCities = [...(prev.clicksByCity || [])];
          if (eventLog.city && eventLog.city !== 'Desconhecida') {
            const cIndex = updatedCities.findIndex(c => c.city.toLowerCase() === eventLog.city.toLowerCase());
            if (cIndex >= 0) {
              updatedCities[cIndex] = {
                ...updatedCities[cIndex],
                count: updatedCities[cIndex].count + 1,
              };
            } else {
              updatedCities.push({
                city: eventLog.city,
                state: eventLog.state || 'SP',
                region: eventLog.region || 'Sudeste',
                country: eventLog.country || 'Brasil',
                count: 1,
                percentage: 0,
              });
            }
            updatedCities.forEach(c => {
              c.percentage = Number(((c.count / updatedTotal) * 100).toFixed(1));
            });
            updatedCities.sort((a, b) => b.count - a.count);
          }

          // Atualiza lista de regiões em tempo real
          let updatedRegions = [...(prev.clicksByRegion || [])];
          if (eventLog.region) {
            const rIndex = updatedRegions.findIndex(r => r.region.toLowerCase() === eventLog.region!.toLowerCase());
            if (rIndex >= 0) {
              updatedRegions[rIndex] = {
                ...updatedRegions[rIndex],
                count: updatedRegions[rIndex].count + 1,
              };
            } else {
              updatedRegions.push({
                region: eventLog.region,
                count: 1,
                percentage: 0,
              });
            }
            updatedRegions.forEach(r => {
              r.percentage = Number(((r.count / updatedTotal) * 100).toFixed(1));
            });
            updatedRegions.sort((a, b) => b.count - a.count);
          }

          return {
            ...prev,
            totalClicks: updatedTotal,
            recentClicks: updatedRecent,
            clicksByLink: updatedLinks,
            clicksByCity: updatedCities,
            clicksByRegion: updatedRegions,
            uniqueCities: updatedCities.length,
            uniqueLinks: updatedLinks.length,
            ga4EventsFired: (prev.ga4EventsFired || prev.totalClicks) + 1,
            lastUpdate: new Date().toISOString(),
          };
        });

        // Sincroniza em background com o backend
        loadData();
      }
    };

    const handleAnalyticsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<AnalyticsSummary>;
      if (customEvent.detail) {
        setData(customEvent.detail);
      }
    };

    window.addEventListener('satv:link_click', handleRealtimeClick);
    window.addEventListener('satv:analytics_updated', handleAnalyticsUpdated);

    // Polling dinâmico para garantir sincronia contínua em tempo real
    const interval = setInterval(() => {
      loadData();
    }, 3500);

    return () => {
      window.removeEventListener('satv:link_click', handleRealtimeClick);
      window.removeEventListener('satv:analytics_updated', handleAnalyticsUpdated);
      clearInterval(interval);
    };
  }, [loadData]);

  // Salvar nova Measurement ID do GA4
  const handleSaveMeasurementId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!measurementId.trim()) return;
    setStoredMeasurementId(measurementId);
    setMeasurementIdSaved(true);
    setTimeout(() => setMeasurementIdSaved(false), 3000);
  };

  // Simular disparo manual de evento para testar o GA4
  const handleSimulateClick = async (sampleLinkName = 'GLOBO SP', sampleCity = 'São Paulo') => {
    setIsSimulatingClick(true);
    try {
      const log = await trackLinkClick({
        linkId: `link-${sampleLinkName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        linkName: sampleLinkName,
        linkUrl: 'https://rdcanais.net/globosp.m3u8',
        category: 'Abertos',
        city: sampleCity,
      });

      setSimulationFeedback(`Evento link_click disparado com sucesso no GA4 para "${sampleLinkName}" de ${sampleCity}!`);
      setTimeout(() => setSimulationFeedback(null), 4000);

      // Recarrega estatísticas
      await loadData();
    } catch (err: any) {
      setSimulationFeedback(`Erro ao disparar evento: ${err.message}`);
    } finally {
      setIsSimulatingClick(false);
    }
  };

  // Resetar estatísticas
  const handleReset = async () => {
    if (window.confirm('Tem certeza que deseja zerar todos os contadores de cliques e histórico?')) {
      await resetAnalyticsData();
      await loadData();
    }
  };

  // Copiar URL do link
  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  // Copiar snippet do GA4
  const handleCopySnippet = () => {
    const code = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');

  // Rastreamento personalizado de clique em links IPTV
  function trackIptvLink(linkName, linkUrl, userCity, linkCategory) {
    gtag('event', 'link_click', {
      link_name: linkName,
      link_url: linkUrl,
      destination_url: linkUrl,
      user_city: userCity || 'São Paulo',
      link_category: linkCategory || 'Geral',
      event_category: 'engagement'
    });
  }
</script>`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Filtros de Cidade
  const filteredCities = useMemo(() => {
    if (!data?.clicksByCity) return [];
    if (!citySearch.trim()) return data.clicksByCity;
    const q = citySearch.toLowerCase();
    return data.clicksByCity.filter(
      c => c.city.toLowerCase().includes(q) || c.state.toLowerCase().includes(q) || c.region.toLowerCase().includes(q)
    );
  }, [data?.clicksByCity, citySearch]);

  // Categorias únicas dos links
  const availableCategories = useMemo(() => {
    if (!data?.clicksByLink) return ['all'];
    const cats = Array.from(new Set(data.clicksByLink.map(l => l.category || 'Geral')));
    return ['all', ...cats];
  }, [data?.clicksByLink]);

  // Filtros de Links
  const filteredLinks = useMemo(() => {
    if (!data?.clicksByLink) return [];
    return data.clicksByLink.filter(link => {
      const matchesSearch =
        !linkSearch.trim() ||
        link.linkName.toLowerCase().includes(linkSearch.toLowerCase()) ||
        link.linkUrl.toLowerCase().includes(linkSearch.toLowerCase());
      const matchesCat = selectedCategory === 'all' || (link.category || 'Geral') === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [data?.clicksByLink, linkSearch, selectedCategory]);

  const totalClicks = data?.totalClicks || 0;

  return (
    <div className="space-y-6">
      {/* Header Principal da Seção Analytics */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Rastreamento em Tempo Real &amp; GA4</span>
              </span>
              {currentUserGeo && (
                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-950 px-2.5 py-0.5 rounded-full border border-neutral-800">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Sua Localização: {currentUserGeo.city}{currentUserGeo.state ? `/${currentUserGeo.state}` : ''}{currentUserGeo.ip ? ` • IP: ${currentUserGeo.ip}` : ''}</span>
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              <span>Painel de Analytics Detalhado</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Monitore o volume de cliques por canal, mapeamento geográfico de acessos por cidade e estado,
              e eventos personalizados integrados diretamente ao Google Analytics 4 (GA4).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-all cursor-pointer disabled:opacity-50"
              title="Atualizar métricas agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={() => handleSimulateClick('GLOBO SP', currentUserGeo?.city || 'São Paulo')}
              disabled={isSimulatingClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              title="Dispara um clique de teste para verificar a integração com o Google Analytics"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulatingClick ? 'Disparando...' : 'Testar Disparo GA4'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-rose-950 hover:text-rose-400 text-neutral-400 border border-neutral-700/60 transition-colors cursor-pointer"
              title="Zerar dados analíticos"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback de simulação */}
        {simulationFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{simulationFeedback}</span>
          </div>
        )}

        {/* Cards de Métricas Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {/* Card 1: Total de Cliques */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Volume Total de Cliques</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl md:text-3xl font-black text-white font-mono">
                {totalClicks.toLocaleString('pt-BR')}
              </span>
              <span className="text-[11px] text-emerald-400 ml-2 font-medium">cliques auditados</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1">Registrados localmente e no GA4</span>
          </div>

          {/* Card 2: Cidades Alcançadas */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Cidades Rastreadas</span>
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl md:text-3xl font-black text-white font-mono">
                {data?.clicksByCity?.length || 0}
              </span>
              <span className="text-[11px] text-blue-400 ml-2 font-medium">localidades</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1">Líder: {data?.clicksByCity?.[0]?.city || 'N/A'}</span>
          </div>

          {/* Card 3: Links Clicados */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Links / Canais Monitorados</span>
              <Radio className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl md:text-3xl font-black text-white font-mono">
                {data?.clicksByLink?.length || 0}
              </span>
              <span className="text-[11px] text-purple-400 ml-2 font-medium">com engajamento</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1">Top: {data?.clicksByLink?.[0]?.linkName || 'N/A'}</span>
          </div>

          {/* Card 4: Status do GA4 */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Integração Google Analytics</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <span className="text-sm font-bold text-white font-mono truncate block">
                {measurementId}
              </span>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>gtag(&apos;event&apos;, &apos;link_click&apos;) Ativo</span>
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1">Eventos disparados: {totalClicks}</span>
          </div>
        </div>
      </div>

      {/* Sub-navegação interna do Analytics */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-neutral-800">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
            activeSubTab === 'overview'
              ? 'bg-neutral-200 text-neutral-900 font-bold border-neutral-200 shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Visão Geral &amp; Regiões</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cities')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
            activeSubTab === 'cities'
              ? 'bg-neutral-200 text-neutral-900 font-bold border-neutral-200 shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Métricas por Cidade ({data?.clicksByCity?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('links')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
            activeSubTab === 'links'
              ? 'bg-neutral-200 text-neutral-900 font-bold border-neutral-200 shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Links Clicados ({data?.clicksByLink?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ga4')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
            activeSubTab === 'ga4'
              ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400 shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Configuração Google Analytics 4 (GA4)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('live')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
            activeSubTab === 'live'
              ? 'bg-neutral-200 text-neutral-900 font-bold border-neutral-200 shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Feed de Cliques ao Vivo ({data?.recentClicks?.length || 0})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ABA 1: VISÃO GERAL & REGIÕES */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Distribuição por Região do Brasil */}
          <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Contador de Cliques por Região</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Volume agregado e fatia percentual de cada macrorregião geográfica
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-400 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
                Total: {totalClicks}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {(!data?.clicksByRegion || data.clicksByRegion.length === 0) ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  Nenhum clique registrado ainda por região. Interaja com qualquer canal, botão ou link para gerar métricas reais.
                </div>
              ) : (
                data.clicksByRegion.map((reg, idx) => {
                  const colors = [
                    'bg-emerald-500',
                    'bg-blue-500',
                    'bg-purple-500',
                    'bg-amber-500',
                    'bg-rose-500',
                  ];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={reg.region} className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                          <span className="font-bold text-white">{reg.region}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-neutral-300 font-semibold">{reg.count} cliques</span>
                          <span className="text-emerald-400 text-[11px] font-bold">({reg.percentage}%)</span>
                        </div>
                      </div>
                      {/* Barra de Progresso */}
                      <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${color} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.max(2, reg.percentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top 5 Cidades Líderes */}
          <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span>Top Cidades com Mais Engajamento</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Municípios que geraram o maior volume de acessos
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('cities')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 pt-2">
              {(!data?.clicksByCity || data.clicksByCity.length === 0) ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  Nenhuma cidade registrada ainda. As cidades dos usuários reais aparecerão aqui conforme os acessos acontecerem.
                </div>
              ) : (
                data.clicksByCity.slice(0, 5).map((city, idx) => (
                  <div
                    key={city.city}
                    className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-neutral-900 text-neutral-300 text-xs font-bold flex items-center justify-center font-mono border border-neutral-800">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{city.city}</h4>
                        <span className="text-[10px] text-neutral-400">
                          {city.state} • Região {city.region}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-neutral-200 block">{city.count} cliques</span>
                      <span className="text-[10px] text-blue-400">{city.percentage}% do total</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top 5 Links Mais Clicados */}
          <div className="lg:col-span-12 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-400" />
                  <span>Top Links / Canais Mais Clicados</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Streams e canais que os usuários mais testaram e abriram
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('links')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
              >
                <span>Ver todos os links</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {(!data?.clicksByLink || data.clicksByLink.length === 0) ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                Nenhum canal ou link foi clicado ainda. Ao abrir ou checar um canal no aplicativo, ele será registrado aqui automaticamente.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.clicksByLink.slice(0, 6).map((link, idx) => (
                  <div
                    key={link.linkId}
                    className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between gap-2.5 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                            #{idx + 1}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate" title={link.linkName}>
                            {link.linkName}
                          </h4>
                        </div>
                        <span className="inline-block text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded mt-1">
                          {link.category}
                        </span>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="text-xs font-black text-emerald-400 block">{link.count}</span>
                        <span className="text-[9px] text-neutral-500">cliques</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-neutral-900">
                      <code className="text-[10px] font-mono text-neutral-400 truncate max-w-[170px]" title={link.linkUrl}>
                        {link.linkUrl}
                      </code>
                      <button
                        onClick={() => handleSimulateClick(link.linkName, currentUserGeo?.city || 'São Paulo')}
                        className="text-emerald-400 hover:text-white text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer"
                        title="Disparar clique de teste para este link"
                      >
                        <span>+1 Clique</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 2: MÉTRICAS POR CIDADE */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'cities' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span>Rastreamento Geográfico por Cidade</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Exibição de todas as cidades brasileiras e internacionais que clicaram nos links da plataforma
              </p>
            </div>

            {/* Campo de Busca por Cidade */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Filtrar por cidade ou UF..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 placeholder-neutral-500"
              />
            </div>
          </div>

          {/* Tabela de Cidades */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 font-semibold">
                  <th className="py-2.5 px-3">Posição</th>
                  <th className="py-2.5 px-3">Cidade / UF</th>
                  <th className="py-2.5 px-3">Região</th>
                  <th className="py-2.5 px-3">País</th>
                  <th className="py-2.5 px-3 text-right">Cliques Totais</th>
                  <th className="py-2.5 px-3 text-right">Participação</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredCities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500 text-xs">
                      Nenhuma cidade encontrada para o termo pesquisado.
                    </td>
                  </tr>
                ) : (
                  filteredCities.map((city, idx) => (
                    <tr key={city.city} className="hover:bg-neutral-850/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-neutral-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{city.city}</span>
                          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                            {city.state}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-300">
                        {city.region}
                      </td>
                      <td className="py-3 px-3 text-neutral-400">
                        {city.country || 'Brasil'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {city.count.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2 font-mono">
                          <div className="w-16 bg-neutral-950 rounded-full h-1.5 overflow-hidden hidden sm:block">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, city.percentage)}%` }}
                            />
                          </div>
                          <span className="text-blue-400 font-semibold">{city.percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleSimulateClick('Canal Teste', city.city)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-neutral-800 hover:bg-emerald-950 text-neutral-300 hover:text-emerald-300 border border-neutral-700 hover:border-emerald-600/50 transition-all cursor-pointer"
                          title={`Simular clique originado de ${city.city}`}
                        >
                          +1 Clique
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 3: LINKS CLICADOS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'links' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-400" />
                <span>Listagem de Links Clicados</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Rastreamento exato de quais canais e URLs receberam cliques dos usuários
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Filtro de Categoria */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">Todas Categorias</option>
                {availableCategories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Busca por Nome ou URL */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Buscar canal ou URL..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-purple-500 placeholder-neutral-500"
                />
              </div>
            </div>
          </div>

          {/* Grid de Links Clicados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLinks.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-neutral-500">
                Nenhum link encontrado com os filtros selecionados.
              </div>
            ) : (
              filteredLinks.map((link, idx) => (
                <div
                  key={link.linkId}
                  className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between gap-3 hover:border-neutral-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-neutral-900 text-neutral-300 text-xs font-mono font-bold flex items-center justify-center border border-neutral-800">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white truncate max-w-[200px]" title={link.linkName}>
                          {link.linkName}
                        </h4>
                        <span className="inline-block text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded mt-0.5">
                          {link.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-base font-black text-emerald-400 block">{link.count}</span>
                      <span className="text-[10px] text-neutral-500">cliques totais</span>
                    </div>
                  </div>

                  {/* URL do Link */}
                  <div className="bg-neutral-900/90 rounded-xl p-2 border border-neutral-800 flex items-center justify-between gap-2">
                    <code className="text-[11px] font-mono text-neutral-300 truncate flex-1" title={link.linkUrl}>
                      {link.linkUrl}
                    </code>
                    <button
                      onClick={() => handleCopyLink(link.linkId, link.linkUrl)}
                      className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                      title="Copiar URL"
                    >
                      {copiedLinkId === link.linkId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Ações e Último Clique */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs text-neutral-400">
                    <span className="text-[10px] text-neutral-500">
                      Último clique: {link.lastClicked ? new Date(link.lastClicked).toLocaleTimeString('pt-BR') : 'N/A'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSimulateClick(link.linkName, currentUserGeo?.city || 'São Paulo')}
                        className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold cursor-pointer"
                        title="Registrar +1 clique"
                      >
                        +1 Clique
                      </button>

                      <a
                        href={link.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackLinkClick({ linkId: link.linkId, linkName: link.linkName, linkUrl: link.linkUrl, category: link.category })}
                        className="inline-flex items-center gap-1 text-neutral-300 hover:text-white text-xs px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800"
                        title="Abrir URL em nova aba (rastreia o clique)"
                      >
                        <span>Abrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 4: INTEGRAÇÃO GOOGLE ANALYTICS (GA4) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'ga4' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card de Configuração e Status do GA4 */}
          <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                <Zap className="w-4 h-4 fill-current" />
                <span>Google Analytics 4 (GA4) Oficial</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Configuração do Measurement ID
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Insira o seu ID de Medição (ex: <code>G-XXXXXXXXXX</code>) do Google Analytics. Todos os cliques
                em links no painel e na TV disparam automaticamente o evento <code>link_click</code> para sua conta.
              </p>
            </div>

            <form onSubmit={handleSaveMeasurementId} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  ID de Medição GA4 (Measurement ID)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={measurementId}
                    onChange={(e) => setMeasurementId(e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-xl transition-all shadow cursor-pointer"
                  >
                    Salvar ID
                  </button>
                </div>
              </div>

              {measurementIdSaved && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ID de Medição do GA4 salva e ativada com sucesso!</span>
                </div>
              )}
            </form>

            {/* Parâmetros enviados no evento GA4 */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2 text-xs">
              <h4 className="font-bold text-neutral-200">Parâmetros Enviados no Evento link_click:</h4>
              <ul className="space-y-1 text-neutral-400 text-[11px] font-mono">
                <li>• <strong className="text-emerald-400">link_url</strong>: URL de destino do canal</li>
                <li>• <strong className="text-emerald-400">link_id</strong>: Identificador exclusivo do link</li>
                <li>• <strong className="text-emerald-400">link_name</strong>: Nome do canal (ex: &quot;GLOBO SP&quot;)</li>
                <li>• <strong className="text-emerald-400">user_city</strong>: Cidade geográfica do usuário (ex: &quot;São Paulo&quot;)</li>
                <li>• <strong className="text-emerald-400">user_state</strong>: Estado/UF (ex: &quot;SP&quot;)</li>
                <li>• <strong className="text-emerald-400">user_region</strong>: Região (ex: &quot;Sudeste&quot;)</li>
                <li>• <strong className="text-emerald-400">link_category</strong>: Categoria do canal</li>
              </ul>
            </div>

            {/* Testador manual de envio */}
            <div className="pt-2">
              <button
                onClick={() => handleSimulateClick('SPORTV HD', currentUserGeo?.city || 'Rio de Janeiro')}
                disabled={isSimulatingClick}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Disparar Evento de Teste para o Google Analytics Agora</span>
              </button>
            </div>
          </div>

          {/* Payload JSON do GA4 e Snippet de Código */}
          <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Payload do Evento link_click (gtag)
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  gtag(&apos;event&apos;, &apos;link_click&apos;)
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Visualização do objeto exato enviado para o servidor do Google Analytics:
              </p>

              <div className="mt-3 bg-neutral-950 rounded-2xl p-4 border border-neutral-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                <pre>{`gtag('event', 'link_click', {
  destination_url: 'https://rdcanais.net/globosp.m3u8',
  link_url: 'https://rdcanais.net/globosp.m3u8',
  link_id: 'link-globo-sp',
  link_name: 'GLOBO SP',
  link_category: 'Abertos',
  user_city: '${currentUserGeo?.city || 'São Paulo'}',
  user_state: '${currentUserGeo?.state || 'SP'}',
  user_region: '${currentUserGeo?.region || 'Sudeste'}',
  user_country: '${currentUserGeo?.country || 'Brasil'}',
  event_category: 'engagement',
  event_label: 'GLOBO SP',
  value: 1
});`}</pre>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-300">Snippet HTML para outros APKs/Sites:</span>
                <button
                  onClick={handleCopySnippet}
                  className="text-xs text-emerald-400 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copiado!' : 'Copiar Snippet'}</span>
                </button>
              </div>
              <p className="text-[11px] text-neutral-500">
                Cole o snippet fornecido no <code>&lt;head&gt;</code> de qualquer site ou app onde você queira rastrear cliques com esse mesmo formato.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 5: FEED DE CLIQUES AO VIVO */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'live' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span>Feed de Cliques Recentes em Tempo Real</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Últimos acessos e links clicados pelos usuários com horário, canal, cidade e confirmação GA4
              </p>
            </div>

            <span className="text-xs font-mono text-emerald-400 bg-neutral-950 px-3 py-1 rounded-full border border-neutral-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Ao Vivo</span>
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {(!data?.recentClicks || data.recentClicks.length === 0) ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                Nenhum clique registrado ainda. Clique em &quot;Testar Disparo GA4&quot; ou abra um canal para gerar registros.
              </div>
            ) : (
              data.recentClicks.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{ev.linkName}</h4>
                        <span className="text-[10px] text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded">
                          {ev.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-blue-400 font-medium">
                          <MapPin className="w-3 h-3" />
                          <span>{ev.city}{ev.state ? ` - ${ev.state}` : ''}{ev.country ? `, ${ev.country}` : ''}</span>
                        </span>
                        {ev.ip && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-neutral-300 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                              IP: {ev.ip}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{ev.device || 'Desktop / Smart TV'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-[11px]">
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>GA4 Enviado</span>
                    </span>
                    <span className="text-neutral-400 font-medium text-[11px]">
                      {ev.timestamp ? `${new Date(ev.timestamp).toLocaleTimeString('pt-BR')} (${new Date(ev.timestamp).toLocaleDateString('pt-BR')})` : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

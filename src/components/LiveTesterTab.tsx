import React, { useState } from 'react';
import {
  Play,
  RotateCw,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  Upload,
  Radio,
  FileCode,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Search,
  Filter,
  Check,
  Zap,
  RefreshCw,
  Copy,
  Download
} from 'lucide-react';
import { Channel, ChannelCheckResult } from '../types/iptv';

interface LiveTesterTabProps {
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  results: Record<string, ChannelCheckResult>;
  setResults: React.Dispatch<React.SetStateAction<Record<string, ChannelCheckResult>>>;
  onUpdateResults: (newResults: Record<string, ChannelCheckResult>) => void;
}

export const LiveTesterTab: React.FC<LiveTesterTabProps> = ({
  channels: channelList,
  setChannels,
  results,
  setResults,
  onUpdateResults,
}) => {
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'offline' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `⚙️ Lista completa carregada com ${channelList.length} canais para verificação.`,
    '💡 Clique nos botões "Online" ou "Offline" abaixo para filtrar a tabela instantaneamente.',
    '🚀 Clique em "Verificar Todos os 131 Canais" para rodar o robô completo na nuvem.',
  ]);

  // Form states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showM3uModal, setShowM3uModal] = useState<boolean>(false);
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [newChannelUrl, setNewChannelUrl] = useState<string>('');
  const [newChannelGroup, setNewChannelGroup] = useState<string>('Geral');
  const [m3uInputUrl, setM3uInputUrl] = useState<string>('');
  const [m3uRawText, setM3uRawText] = useState<string>('');
  const [isParsingM3u, setIsParsingM3u] = useState<boolean>(false);

  const addLog = (message: string) => {
    setConsoleLogs(prev => [...prev.slice(-60), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Counts
  const onlineCount = (Object.values(results) as ChannelCheckResult[]).filter(r => r?.online).length;
  const offlineCount = (Object.values(results) as ChannelCheckResult[]).filter(r => r && !r.online).length;
  const testedCount = Object.keys(results).length;
  const pendingCount = channelList.length - testedCount;

  // Filtered list based on active filter button + search query
  const filteredChannels = channelList.filter(ch => {
    const res = results[ch.id];
    if (filterMode === 'online' && !res?.online) return false;
    if (filterMode === 'offline' && (!res || res.online)) return false;
    if (filterMode === 'pending' && res) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return ch.name.toLowerCase().includes(q) || (ch.group && ch.group.toLowerCase().includes(q)) || ch.url.toLowerCase().includes(q);
    }
    return true;
  });

  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const getFullStatusPayload = () => {
    const statuses: Record<string, string> = {};
    channelList.forEach(ch => {
      const res = results[ch.id];
      statuses[ch.name] = res?.online ? 'online' : 'offline';
    });
    return {
      lastUpdate: new Date().toISOString(),
      total: channelList.length,
      online: (Object.values(results) as ChannelCheckResult[]).filter(r => r?.online).length,
      offline: channelList.length - (Object.values(results) as ChannelCheckResult[]).filter(r => r?.online).length,
      statuses,
    };
  };

  const handleDownloadJson = () => {
    const payload = getFullStatusPayload();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'channels-status.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
    addLog(`📥 Arquivo channels-status.json baixado com todos os ${channelList.length} canais!`);
  };

  const handleCopyJson = () => {
    const payload = getFullStatusPayload();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
    addLog(`📋 JSON de status dos ${channelList.length} canais copiado com sucesso!`);
  };

  // Test a single channel
  const testSingleChannel = async (channel: Channel) => {
    setTestingChannelId(channel.id);
    addLog(`🔍 Testando canal: ${channel.name} (${channel.url.substring(0, 45)}...)`);

    try {
      const response = await fetch('/api/check-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: channel.url, timeout: 5000 }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedResult: ChannelCheckResult = {
          online: data.online,
          status: data.status,
          latency: data.latency,
          contentType: data.contentType,
          statusText: data.statusText,
          checkedAt: data.verifiedAt,
        };

        setResults(prev => ({ ...prev, [channel.id]: updatedResult }));

        if (data.online) {
          addLog(`✅ ONLINE: ${channel.name} - ${data.latency}ms (HTTP ${data.status})`);
        } else {
          addLog(`❌ OFFLINE: ${channel.name} - ${data.latency}ms (${data.statusText || 'Erro'})`);
        }
      } else {
        throw new Error('Server check failed');
      }
    } catch (e: any) {
      addLog(`⚠️ Falha ao testar ${channel.name}: ${e.message}`);
      setResults(prev => ({
        ...prev,
        [channel.id]: {
          online: false,
          status: 0,
          latency: 0,
          statusText: 'Falha de requisição',
          checkedAt: new Date().toISOString(),
        },
      }));
    } finally {
      setTestingChannelId(null);
    }
  };

  // Run full batch verification of ALL channels
  const handleRunAll = async (targetList: Channel[] = channelList) => {
    if (isRunningAll) return;
    setIsRunningAll(true);
    setConsoleLogs([]);
    addLog(`🚀 INICIANDO VERIFICAÇÃO EM LOTE DOS ${targetList.length} CANAIS...`);
    addLog(`⚡ Modo: Pool concorrente em lotes de 10 requisições simultâneas`);

    try {
      // Use the server batch endpoint for fast parallel processing
      const response = await fetch('/api/check-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: targetList,
          timeout: 4000,
          concurrency: 10,
        }),
      });

      if (response.ok) {
        const batchData = await response.json();
        const newResults: Record<string, ChannelCheckResult> = { ...results };

        Object.entries(batchData.statuses).forEach(([id, info]: [string, any]) => {
          newResults[id] = {
            online: info.online,
            status: info.status,
            latency: info.latency,
            checkedAt: new Date().toISOString(),
            statusText: info.online ? '200 OK' : info.status === 408 ? 'Timeout' : 'Offline',
          };

          const ch = channelList.find(c => c.id === id);
          const chName = ch ? ch.name : id;
          if (info.online) {
            addLog(`✅ ONLINE: ${chName} (${info.latency}ms, status ${info.status})`);
          } else {
            addLog(`❌ OFFLINE: ${chName} (${info.latency}ms, status ${info.status || 0})`);
          }
        });

        setResults(newResults);
        onUpdateResults(newResults);

        addLog('====================================================');
        addLog(`🏁 Verificação concluída para todos os ${targetList.length} canais!`);
        addLog(`🟢 Total Online: ${batchData.online} | 🔴 Total Offline: ${batchData.offline}`);
        addLog(`💾 Salvo no arquivo channels-status.json com todos os ${targetList.length} registros.`);
        addLog('====================================================');

        // Garantir sincronização do arquivo no backend
        const statusesMap: Record<string, string> = {};
        channelList.forEach(c => {
          statusesMap[c.name] = newResults[c.id]?.online ? 'online' : 'offline';
        });
        fetch('/api/save-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastUpdate: new Date().toISOString(),
            total: channelList.length,
            online: batchData.online,
            offline: batchData.offline,
            statuses: statusesMap,
          }),
        }).catch(() => {});
      } else {
        throw new Error('Falha no lote do servidor');
      }
    } catch (err: any) {
      addLog(`⚠️ Erro ao rodar lote: ${err.message}. Alternando para checagem progressiva...`);
      // Fallback progressive check
      for (const ch of targetList) {
        await testSingleChannel(ch);
      }
    } finally {
      setIsRunningAll(false);
      setTestingChannelId(null);
    }
  };

  // Retest only offline channels
  const handleRetestOffline = () => {
    const offlines = channelList.filter(c => results[c.id] && !results[c.id].online);
    if (offlines.length === 0) {
      addLog('ℹ️ Nenhum canal offline para re-testar.');
      return;
    }
    handleRunAll(offlines);
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !newChannelUrl.trim()) return;

    const newId = `custom-ch-${Date.now()}`;
    const newChan: Channel = {
      id: newId,
      name: newChannelName.trim(),
      url: newChannelUrl.trim(),
      group: newChannelGroup.trim() || 'Personalizados',
    };

    setChannels(prev => [newChan, ...prev]);
    setNewChannelName('');
    setNewChannelUrl('');
    setShowAddModal(false);
    addLog(`➕ Novo canal adicionado: ${newChan.name} (Total: ${channelList.length + 1})`);
  };

  const handleDeleteChannel = (id: string, name: string) => {
    setChannels(prev => prev.filter(c => c.id !== id));
    setResults(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    addLog(`🗑️ Canal removido: ${name}`);
  };

  const handleParseM3u = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsParsingM3u(true);
    addLog('📡 Processando lista M3U completa...');

    try {
      const response = await fetch('/api/parse-m3u', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: m3uInputUrl, rawContent: m3uRawText }),
      });

      const data = await response.json();
      if (response.ok && data.channels?.length > 0) {
        setChannels(data.channels);
        setShowM3uModal(false);
        setM3uInputUrl('');
        setM3uRawText('');
        addLog(`🎉 Sucesso! ${data.channels.length} canais carregados da lista M3U.`);
      } else {
        addLog(`⚠️ Falha ao importar M3U: ${data.error || 'Nenhum canal encontrado'}`);
      }
    } catch (e: any) {
      addLog(`❌ Erro ao ler M3U: ${e.message}`);
    } finally {
      setIsParsingM3u(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Summary Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-slate-100">
                Verificador & Simulador da Action (Lista Completa: {channelList.length} Canais)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Testando a lista completa com lotes paralelos sem limites e gerando o status JSON de todos os canais.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Adicionar Canal</span>
            </button>

            <button
              onClick={() => setShowM3uModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Importar M3U</span>
            </button>

            {offlineCount > 0 && (
              <button
                onClick={handleRetestOffline}
                disabled={isRunningAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-500/40 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                <span>Re-testar Apenas os {offlineCount} Offlines</span>
              </button>
            )}

            <button
              onClick={() => handleRunAll(channelList)}
              disabled={isRunningAll}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 transition-all shadow-md ${
                isRunningAll
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300'
              }`}
            >
              {isRunningAll ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verificando {channelList.length} Canais...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Verificar Todos os {channelList.length} Canais</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
              title="Baixar arquivo channels-status.json com todos os 131 canais"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Baixar channels-status.json</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              title="Copiar JSON com todos os 131 canais"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar JSON</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CLICKABLE STATUS FILTER BUTTONS (User Requirement!) */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              Filtro de Status Clicável (Clique para ver a lista de cada categoria):
            </span>
            <span className="text-[11px] text-slate-500">
              Mostrando {filteredChannels.length} de {channelList.length} canais
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Filter: ALL */}
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                filterMode === 'all'
                  ? 'bg-slate-800 border-slate-400 ring-2 ring-slate-400/30 text-white shadow-md'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Todos os Canais</span>
                {filterMode === 'all' && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="text-xl font-extrabold text-slate-100 mt-1">
                {channelList.length}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">Lista completa</span>
            </button>

            {/* Filter: ONLINE */}
            <button
              type="button"
              onClick={() => setFilterMode('online')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                filterMode === 'online'
                  ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-500/40 text-emerald-200 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-emerald-950/20 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Canais Online
                </span>
                {filterMode === 'online' && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {onlineCount}
              </div>
              <span className="text-[10px] text-emerald-300/70 mt-0.5">Clique para ver apenas online</span>
            </button>

            {/* Filter: OFFLINE (User requirement: Clicável para saber quais são os offlines) */}
            <button
              type="button"
              onClick={() => setFilterMode('offline')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                filterMode === 'offline'
                  ? 'bg-red-950/50 border-red-400 ring-2 ring-red-500/40 text-red-200 shadow-md shadow-red-500/10'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-red-950/20 hover:border-red-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Canais Offline
                </span>
                {filterMode === 'offline' && <Check className="w-4 h-4 text-red-400" />}
              </div>
              <div className="text-xl font-extrabold text-red-400 mt-1">
                {offlineCount}
              </div>
              <span className="text-[10px] text-red-300/70 mt-0.5">Clique para ver quais estão fora</span>
            </button>

            {/* Filter: PENDING */}
            <button
              type="button"
              onClick={() => setFilterMode('pending')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                filterMode === 'pending'
                  ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/40 text-amber-200 shadow-md'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Pendentes
                </span>
                {filterMode === 'pending' && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="text-xl font-extrabold text-amber-400 mt-1">
                {pendingCount}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">Ainda não checados</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Channels Table + Ubuntu Console Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Channels List Table with Search & Status Badges */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Table Header & Search Input */}
          <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Lista de Canais ({filteredChannels.length})
              </span>
              {filterMode !== 'all' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                  Filtro: {filterMode}
                </span>
              )}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou link..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Channel Items List */}
          <div className="divide-y divide-slate-800/80 max-h-[580px] overflow-y-auto">
            {filteredChannels.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <Filter className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-400">Nenhum canal encontrado para o filtro selecionado.</p>
                <button
                  onClick={() => { setFilterMode('all'); setSearchQuery(''); }}
                  className="text-emerald-400 hover:underline text-xs"
                >
                  Limpar filtros e mostrar todos os {channelList.length} canais
                </button>
              </div>
            ) : (
              filteredChannels.map((channel, index) => {
                const res = results[channel.id];
                const isTesting = testingChannelId === channel.id;

                return (
                  <div
                    key={channel.id}
                    className={`p-3.5 transition-colors flex items-center justify-between gap-3 ${
                      res?.online === false
                        ? 'bg-red-950/10 hover:bg-red-950/20'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      {/* Status Indicator Dot */}
                      <div className="flex-shrink-0">
                        {isTesting ? (
                          <RotateCw className="w-5 h-5 text-amber-400 animate-spin" />
                        ) : res ? (
                          res.online ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center" title="Online (200 OK)">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center" title="Offline">
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                            </div>
                          )
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400" title="Não testado">
                            -
                          </div>
                        )}
                      </div>

                      {/* Channel Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {channel.name}
                          </span>
                          {channel.group && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 flex-shrink-0">
                              {channel.group}
                            </span>
                          )}
                          {res && !res.online && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
                              FORA DO AR
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate max-w-sm mt-0.5">
                          {channel.url}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Latency, HTTP Code & Individual Test Button */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {res && !isTesting && (
                        <div className="text-right text-[11px] hidden sm:block">
                          <span className={`font-mono font-bold ${res.online ? 'text-emerald-400' : 'text-red-400'}`}>
                            {res.online ? `${res.latency}ms` : 'offline'}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {res.statusText || (res.status > 0 ? `HTTP ${res.status}` : 'Sem resposta')}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => testSingleChannel(channel)}
                        disabled={isTesting || isRunningAll}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {isTesting ? 'Checando...' : 'Testar'}
                      </button>

                      <button
                        onClick={() => handleDeleteChannel(channel.id, channel.name)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                        title="Remover canal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Live Terminal Console (Simulating Ubuntu GitHub Actions Runner) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-semibold text-slate-200">
                github-actions / check-channels.js ({channelList.length} canais)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ubuntu-latest
            </span>
          </div>

          <div className="p-4 font-mono text-xs text-slate-300 space-y-1.5 overflow-y-auto max-h-[540px] min-h-[420px] bg-slate-950 flex flex-col justify-end">
            {consoleLogs.map((log, index) => (
              <div
                key={index}
                className={`leading-relaxed ${
                  log.includes('ONLINE')
                    ? 'text-emerald-400 font-medium'
                    : log.includes('OFFLINE')
                    ? 'text-red-400 font-medium'
                    : log.includes('INICIANDO') || log.includes('Verificação concluída')
                    ? 'text-amber-300 font-bold'
                    : 'text-slate-400'
                }`}
              >
                {log}
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Arquivo de saída: channels-status.json</span>
            <span className="text-emerald-400 font-bold">{onlineCount} On / {offlineCount} Off</span>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar Canal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Adicionar Canal à Lista
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddChannel} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome do Canal
                </label>
                <input
                  type="text"
                  required
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="ex: Canal Brasil Live"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Link do Stream (.m3u8 ou URL)
                </label>
                <input
                  type="url"
                  required
                  value={newChannelUrl}
                  onChange={(e) => setNewChannelUrl(e.target.value)}
                  placeholder="https://servidor.com/live/stream.m3u8"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Categoria / Grupo
                </label>
                <input
                  type="text"
                  value={newChannelGroup}
                  onChange={(e) => setNewChannelGroup(e.target.value)}
                  placeholder="ex: Abertos & Nacionais"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
                >
                  Salvar Canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Importar M3U */}
      {showM3uModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                Importar Lista M3U Completa
              </h3>
              <button
                onClick={() => setShowM3uModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleParseM3u} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Opção A: Cole o link URL da lista M3U
                </label>
                <input
                  type="url"
                  value={m3uInputUrl}
                  onChange={(e) => setM3uInputUrl(e.target.value)}
                  placeholder="https://exemplo.com/lista.m3u"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Opção B: Ou cole o texto da lista M3U (#EXTM3U ...)
                </label>
                <textarea
                  rows={4}
                  value={m3uRawText}
                  onChange={(e) => setM3uRawText(e.target.value)}
                  placeholder={'#EXTM3U\n#EXTINF:-1 group-title="Abertos",Globo\nhttps://exemplo.com/globo.m3u8'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowM3uModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isParsingM3u || (!m3uInputUrl && !m3uRawText)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-50"
                >
                  {isParsingM3u ? 'Processando Lista...' : 'Carregar Canais'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

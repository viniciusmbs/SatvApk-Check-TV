import React, { useState, useMemo, useRef, useEffect } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Search, Download, Copy, Check, Tv, Activity, Radio, ExternalLink, Square, Save, Clock, ShieldCheck, Zap } from 'lucide-react';
import { ChannelItem, ChannelStatusResult } from '../types';

interface ChannelTesterProps {
  initialStatus: ChannelStatusResult;
  playlistRaw: string;
  onStatusUpdate?: (status: ChannelStatusResult) => void;
}

export function ChannelTester({ initialStatus, playlistRaw, onStatusUpdate }: ChannelTesterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [copiedChannelId, setCopiedChannelId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testProgress, setTestProgress] = useState<{ current: number; total: number; channelName: string; currentLatency?: number } | null>(null);
  const [saveStatusFeedback, setSaveStatusFeedback] = useState<string | null>(null);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [checkingChannelId, setCheckingChannelId] = useState<string | null>(null);
  const [isServerRunningCheck, setIsServerRunningCheck] = useState(false);
  // Ritmo exclusivamente pausado (350ms) para permitir identificação clara de cada canal e link
  const checkSpeed = 350;
  const abortTestRef = useRef(false);

  // Parse dinâmico da playlist M3U: reflete estritamente o que está em src/data/playlist.ts
  const parsedChannels = useMemo<ChannelItem[]>(() => {
    const parts = playlistRaw.split(/#EXTINF:/i);
    const list: ChannelItem[] = [];

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const httpIdx = part.search(/https?:\/\//i);
      if (httpIdx === -1) continue;

      const header = part.substring(0, httpIdx).trim();
      const rest = part.substring(httpIdx).trim();

      const urlMatch = rest.match(/^(https?:\/\/[^\r\n#`"\s]+)/i);
      if (!urlMatch) continue;
      const cleanUrl = urlMatch[1].replace(/[`'";]+$/, '').trim();

      const commaIdx = header.lastIndexOf(',');
      let name = commaIdx !== -1 ? header.substring(commaIdx + 1).trim() : header;
      name = name.replace(/[`'"\r\n]+$/, '').trim();

      const groupMatch = header.match(/group-title="([^"]+)"/i);
      const group = groupMatch ? groupMatch[1] : 'Geral';

      const logoMatch = header.match(/tvg-logo="([^"]+)"/i);
      const logo = logoMatch ? logoMatch[1] : '';

      if (name && cleanUrl) {
        // Status lido exclusivamente do arquivo oficial channels-status.json
        const currentStatus = initialStatus.statuses[name] || 'offline';
        const isOnline = currentStatus === 'online';
        const latency = initialStatus.latencies?.[name] ?? (isOnline ? 250 : undefined);

        list.push({
          id: `ch-${list.length}`,
          name,
          url: cleanUrl,
          group,
          logo,
          status: currentStatus,
          latency,
          statusCode: isOnline ? 200 : 404,
        });
      }
    }

    return list;
  }, [playlistRaw, initialStatus]);

  const [channels, setChannels] = useState<ChannelItem[]>(parsedChannels);
  const [statusSummary, setStatusSummary] = useState<ChannelStatusResult>(initialStatus);

  // Sincroniza estado quando a prop initialStatus é atualizada externamente
  useEffect(() => {
    setStatusSummary(initialStatus);
    setChannels(parsedChannels);
  }, [initialStatus, parsedChannels]);

  // Interromper sincronização
  const handleStopTest = () => {
    abortTestRef.current = true;
    setIsRunning(false);
    setTestProgress(null);
  };

  /**
   * Sincronização direta com o arquivo oficial channels-status.json gerado pelo robô
   * - ZERO requisições diretas de streaming pelo navegador (elimina bloqueios de CORS e falsos negativos)
   * - Ritmo estritamente pausado e calmo, permitindo ler e identificar cada link
   */
  const handleSyncOfficialStatus = async () => {
    setIsRunning(true);
    abortTestRef.current = false;

    let officialData: ChannelStatusResult | null = null;

    try {
      const res = await fetch(`/channels-status.json?t=${Date.now()}`);
      if (res.ok) {
        officialData = await res.json();
      }
    } catch (err) {
      console.warn('Falha ao obter channels-status.json em tempo real, utilizando cache local:', err);
    }

    const official = officialData || initialStatus;
    const updatedChannels = [...channels];
    const newStatuses: Record<string, 'online' | 'offline'> = {};
    const newLatencies: Record<string, number> = {};
    let onlineCount = 0;
    let offlineCount = 0;

    // Atualização pausada, canal a canal, com visualização nítida
    for (let i = 0; i < updatedChannels.length; i++) {
      if (abortTestRef.current) break;

      const ch = { ...updatedChannels[i] };
      const status: 'online' | 'offline' = official.statuses[ch.name] || 'offline';
      const latency = official.latencies?.[ch.name] ?? (status === 'online' ? 250 : 0);

      setTestProgress({
        current: i + 1,
        total: updatedChannels.length,
        channelName: ch.name,
        currentLatency: latency,
      });

      ch.status = 'checking';
      updatedChannels[i] = ch;
      setChannels([...updatedChannels]);

      // Ritmo estritamente pausado (350ms)
      await new Promise(r => setTimeout(r, checkSpeed));

      if (status === 'online') {
        onlineCount++;
      } else {
        offlineCount++;
      }

      newStatuses[ch.name] = status;
      if (latency > 0) newLatencies[ch.name] = latency;

      ch.status = status;
      ch.latency = status === 'online' ? latency : undefined;
      ch.statusCode = status === 'online' ? 200 : 404;

      updatedChannels[i] = ch;
      setChannels([...updatedChannels]);
    }

    if (!abortTestRef.current) {
      const finalSummary: ChannelStatusResult = {
        lastUpdate: official.lastUpdate || new Date().toISOString(),
        total: updatedChannels.length,
        online: onlineCount,
        offline: offlineCount,
        statuses: newStatuses,
        latencies: newLatencies,
      };

      setStatusSummary(finalSummary);
      if (onStatusUpdate) {
        onStatusUpdate(finalSummary);
      }

      setSaveStatusFeedback('✅ Status sincronizado diretamente do channels-status.json oficial!');
      setTimeout(() => setSaveStatusFeedback(null), 4000);
    }

    setIsRunning(false);
    setTestProgress(null);
  };

  /**
   * Checagem instantânea de um único canal (na hora, sem esperar fila ou cron)
   */
  const handleCheckSingleChannel = async (channel: ChannelItem) => {
    setCheckingChannelId(channel.id);
    try {
      const res = await fetch('/api/check-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: channel.url, timeout: 6000 }),
      });

      const data = await res.json();
      const isOnline = Boolean(data.online);
      const latency = Number(data.latency) || (isOnline ? 250 : 0);

      const updatedChannels = channels.map((c) => {
        if (c.id === channel.id) {
          return {
            ...c,
            status: (isOnline ? 'online' : 'offline') as 'online' | 'offline',
            latency: isOnline ? latency : undefined,
            statusCode: data.status || (isOnline ? 200 : 404),
          };
        }
        return c;
      });

      setChannels(updatedChannels);

      const newOnlineCount = updatedChannels.filter((c) => c.status === 'online').length;
      const newOfflineCount = updatedChannels.filter((c) => c.status === 'offline').length;
      const newStatuses = { ...statusSummary.statuses, [channel.name]: (isOnline ? 'online' : 'offline') as 'online' | 'offline' };
      const newLatencies = { ...statusSummary.latencies, [channel.name]: latency };

      const newSummary: ChannelStatusResult = {
        lastUpdate: new Date().toISOString(),
        total: updatedChannels.length,
        online: newOnlineCount,
        offline: newOfflineCount,
        statuses: newStatuses,
        latencies: newLatencies,
      };

      setStatusSummary(newSummary);
      if (onStatusUpdate) {
        onStatusUpdate(newSummary);
      }

      // Salva no channels-status.json no servidor imediatamente
      fetch('/api/save-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSummary),
      }).catch(() => {});

      setSaveStatusFeedback(`⚡ Canal "${channel.name}" checado na hora: ${isOnline ? 'ONLINE' : 'OFFLINE'} (${latency}ms)`);
      setTimeout(() => setSaveStatusFeedback(null), 4000);
    } catch {
      setSaveStatusFeedback(`❌ Erro ao testar o canal "${channel.name}"`);
      setTimeout(() => setSaveStatusFeedback(null), 4000);
    } finally {
      setCheckingChannelId(null);
    }
  };

  /**
   * Executa o robô completo no servidor agora mesmo
   */
  const handleTriggerServerCheck = async () => {
    setIsServerRunningCheck(true);
    setSaveStatusFeedback('🚀 Robô iniciado no servidor em ritmo calmo... Aguarde a conclusão.');
    try {
      const res = await fetch('/api/run-check', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setStatusSummary(data.data);
        if (onStatusUpdate) {
          onStatusUpdate(data.data);
        }
        setSaveStatusFeedback('✅ Robô concluiu o teste no servidor e o channels-status.json foi atualizado!');
      } else {
        const errMsg = data?.error || 'Erro ao processar verificação no servidor';
        setSaveStatusFeedback(`❌ ${errMsg}`);
      }
    } catch (err: any) {
      setSaveStatusFeedback(`❌ Erro de conexão com o servidor: ${err.message || 'Verifique se o server.ts está rodando'}`);
    } finally {
      setIsServerRunningCheck(false);
      setTimeout(() => setSaveStatusFeedback(null), 5000);
    }
  };

  // Salvar manualmente os dados no arquivo JSON no servidor
  const handleManualSave = async () => {
    setIsSavingManual(true);
    try {
      await fetch('/api/save-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusSummary),
      });
      if (onStatusUpdate) {
        onStatusUpdate(statusSummary);
      }
      setSaveStatusFeedback('Arquivo channels-status.json sincronizado com sucesso no servidor!');
      setTimeout(() => setSaveStatusFeedback(null), 4000);
    } catch {
      setSaveStatusFeedback('Erro ao salvar no servidor');
      setTimeout(() => setSaveStatusFeedback(null), 4000);
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(statusSummary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(statusSummary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'channels-status.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const totalCount = channels.length > 0 ? channels.length : statusSummary.total;
  const onlineCount = useMemo(() => {
    return channels.length > 0 ? channels.filter(c => c.status === 'online').length : statusSummary.online;
  }, [channels, statusSummary.online]);
  const offlineCount = useMemo(() => {
    return channels.length > 0 ? channels.filter(c => c.status === 'offline').length : statusSummary.offline;
  }, [channels, statusSummary.offline]);

  const handleSelectFilter = (newFilter: 'all' | 'online' | 'offline') => {
    setFilter(newFilter);
    const listElement = document.getElementById('channel-list-section');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyChannelUrl = (e: React.MouseEvent, id: string, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedChannelId(id);
    setTimeout(() => setCopiedChannelId(null), 2000);
  };

  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    channels.forEach(ch => {
      if (ch.group) groups.add(ch.group);
    });
    return Array.from(groups).sort();
  }, [channels]);

  const filteredChannels = channels.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ch.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filter === 'all' || ch.status === filter;
    const matchesGroup = selectedGroup === 'all' || ch.group === selectedGroup;
    return matchesSearch && matchesStatus && matchesGroup;
  });

  const availability = totalCount > 0
    ? Math.round((onlineCount / totalCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Metrics Row - Interactive Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card: Total de Canais */}
        <button
          type="button"
          onClick={() => handleSelectFilter('all')}
          className={`text-left rounded-2xl p-4 transition-all cursor-pointer border group relative ${
            filter === 'all'
              ? 'bg-neutral-800/95 border-emerald-500/70 ring-2 ring-emerald-500/30 shadow-lg shadow-black/40'
              : 'bg-neutral-900/90 border-neutral-800/90 hover:border-neutral-700 hover:bg-neutral-850'
          }`}
          title="Clique para mostrar todos os canais"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="group-hover:text-white transition-colors">Total de Canais</span>
            <Tv className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">{totalCount}</div>
          <div className="text-[11px] text-neutral-500 mt-2 flex items-center gap-1.5 pt-2 border-t border-neutral-800/80">
            <span className={`w-1.5 h-1.5 rounded-full ${filter === 'all' ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
            <span className={filter === 'all' ? 'text-emerald-400 font-medium' : 'text-neutral-500'}>
              {filter === 'all' ? 'Filtro ativo: todos' : 'Filtrar: todos'}
            </span>
          </div>
        </button>

        {/* Card: Canais Online */}
        <button
          type="button"
          onClick={() => handleSelectFilter('online')}
          className={`text-left rounded-2xl p-4 transition-all cursor-pointer border group relative ${
            filter === 'online'
              ? 'bg-emerald-950/40 border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/40'
              : 'bg-neutral-900/90 border-neutral-800/90 hover:border-emerald-800/60 hover:bg-neutral-850'
          }`}
          title="Clique para filtrar apenas canais online"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="group-hover:text-emerald-300 transition-colors">Canais Online</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">{onlineCount}</div>
          <div className="text-[11px] text-neutral-500 mt-2 flex items-center gap-1.5 pt-2 border-t border-neutral-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className={filter === 'online' ? 'text-emerald-400 font-medium' : 'text-neutral-500'}>
              {filter === 'online' ? 'Filtro ativo: apenas online' : 'Filtrar: apenas online'}
            </span>
          </div>
        </button>

        {/* Card: Canais Offline */}
        <button
          type="button"
          onClick={() => handleSelectFilter('offline')}
          className={`text-left rounded-2xl p-4 transition-all cursor-pointer border group relative ${
            filter === 'offline'
              ? 'bg-rose-950/40 border-rose-500/80 ring-2 ring-rose-500/30 shadow-lg shadow-rose-950/40'
              : 'bg-neutral-900/90 border-neutral-800/90 hover:border-rose-800/60 hover:bg-neutral-850'
          }`}
          title="Clique para filtrar apenas canais offline"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="group-hover:text-rose-300 transition-colors">Canais Offline</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-400 font-mono">{offlineCount}</div>
          <div className="text-[11px] text-neutral-500 mt-2 flex items-center gap-1.5 pt-2 border-t border-neutral-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span className={filter === 'offline' ? 'text-rose-400 font-medium' : 'text-neutral-500'}>
              {filter === 'offline' ? 'Filtro ativo: apenas offline' : 'Filtrar: apenas offline'}
            </span>
          </div>
        </button>

        {/* Card: Taxa de Uptime */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Taxa de Uptime</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-cyan-300 font-mono">{availability}%</div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${availability}%` }}
            />
          </div>
          <div className="text-[11px] text-neutral-500 mt-2 pt-2 border-t border-neutral-800">
            {onlineCount} de {totalCount} online
          </div>
        </div>
      </div>

      {/* Banner de Sincronização em Tempo Real (Ritmo Pausado) */}
      {isRunning && testProgress && (
        <div className="bg-neutral-900/95 border-2 border-emerald-500/50 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl shadow-emerald-950/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-neutral-400">Identificando canal:</span>
                <span className="font-mono text-emerald-400 font-semibold">[{testProgress.current} de {testProgress.total}]</span>
                <span className="text-neutral-500">•</span>
                <span className="font-bold text-white truncate max-w-[200px] sm:max-w-[320px] bg-neutral-800 px-2.5 py-0.5 rounded-md border border-neutral-700">
                  {testProgress.channelName}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ritmo pausado: leitura individual em <strong className="text-neutral-200">channels-status.json</strong> oficial</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-emerald-400">
                {Math.round((testProgress.current / testProgress.total) * 100)}%
              </div>
              <div className="text-[10px] text-neutral-500">progresso</div>
            </div>
            <button
              type="button"
              onClick={handleStopTest}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 text-neutral-300 hover:text-rose-300 border border-neutral-700 hover:border-rose-800 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Parar</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar canal ou URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setFilter('online')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'online' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Online ({onlineCount})
            </button>
            <button
              onClick={() => setFilter('offline')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'offline' ? 'bg-rose-950 text-rose-300 border border-rose-800/50' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Offline ({offlineCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Indicador de Ritmo Estritamente Pausado */}
          <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-[11px] text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ritmo:</span>
            <span className="text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md">
              Pausado (350ms)
            </span>
          </div>

          {isRunning ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600/80 text-white font-semibold text-xs rounded-xl shadow-md">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sincronizando ({testProgress ? `${testProgress.current}/${testProgress.total}` : '...'})</span>
              </div>
              <button
                type="button"
                onClick={handleStopTest}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                title="Interromper sincronização"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Parar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleSyncOfficialStatus}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              title="Recarrega em ritmo pausado diretamente do arquivo channels-status.json oficial"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar Status Oficial</span>
            </button>
          )}

          {/* Botão de Checar Servidor na Hora */}
          <button
            onClick={handleTriggerServerCheck}
            disabled={isServerRunningCheck}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-amber-950/30"
            title="Dispara a checagem no servidor na mesma hora"
          >
            {isServerRunningCheck ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            )}
            <span>{isServerRunningCheck ? 'Testando Servidor...' : 'Checar Servidor na Hora'}</span>
          </button>

          {/* Botão de Salvar no JSON */}
          <button
            onClick={handleManualSave}
            disabled={isSavingManual}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Gravar resultados em channels-status.json"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingManual ? 'Gravando...' : 'Salvar no JSON'}</span>
          </button>

          <button
            onClick={handleCopyJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl border border-neutral-700 transition-all cursor-pointer"
            title="Copiar channels-status.json"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl border border-neutral-700 transition-all cursor-pointer"
            title="Baixar channels-status.json"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar JSON</span>
          </button>
        </div>
      </div>

      {/* Feedback toast */}
      {saveStatusFeedback && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl px-4 py-2.5 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveStatusFeedback}</span>
          </div>
          <button
            onClick={() => setSaveStatusFeedback(null)}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Group Pills */}
      {availableGroups.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedGroup('all')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
              selectedGroup === 'all'
                ? 'bg-neutral-200 text-neutral-900 font-semibold'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Todos os Grupos ({channels.length})
          </button>
          {availableGroups.map(group => {
            const count = channels.filter(c => c.group === group).length;
            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                  selectedGroup === group
                    ? 'bg-emerald-500 text-neutral-950 font-semibold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {group} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Channel Grid Section */}
      <div id="channel-list-section" className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span>
            Exibindo <strong className="text-white">{filteredChannels.length}</strong> de {totalCount} canais
            {filter !== 'all' && ` (filtro: ${filter})`}
            {selectedGroup !== 'all' && ` (grupo: ${selectedGroup})`}
          </span>
          <span className="text-[11px] text-neutral-500">
            Atualizado em: {new Date(statusSummary.lastUpdate).toLocaleString('pt-BR')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredChannels.map((channel) => {
            const isOnline = channel.status === 'online';
            const isChecking = channel.status === 'checking';

            return (
              <div
                key={channel.id}
                id={`channel-card-${channel.id}`}
                className={`bg-neutral-900/90 rounded-2xl p-4 border transition-all hover:bg-neutral-850 flex flex-col justify-between gap-3 ${
                  isChecking
                    ? 'border-amber-500/80 bg-amber-950/20 ring-1 ring-amber-500/40'
                    : isOnline
                    ? 'border-neutral-800 hover:border-emerald-800/60'
                    : 'border-neutral-800 hover:border-rose-800/60'
                }`}
              >
                {/* Header: Logo, Nome, Grupo */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-400 shrink-0 overflow-hidden p-1">
                    {channel.logo ? (
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Radio className="w-5 h-5 text-neutral-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate" title={channel.name}>
                        {channel.name}
                      </h4>
                    </div>
                    {channel.group && (
                      <span className="inline-block text-[10px] text-neutral-400 bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded-md mt-1">
                        {channel.group}
                      </span>
                    )}
                  </div>
                </div>

                {/* URL Preview */}
                <div className="bg-neutral-950 rounded-xl p-2 border border-neutral-800/70 flex items-center justify-between gap-2">
                  <code className="text-[11px] font-mono text-neutral-400 truncate flex-1" title={channel.url}>
                    {channel.url}
                  </code>
                  <button
                    onClick={(e) => handleCopyChannelUrl(e, channel.id, channel.url)}
                    className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                    title="Copiar URL do Stream"
                  >
                    {copiedChannelId === channel.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Footer: Status Badge & Ações (Checar / Abrir) */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-800/60 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isChecking ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Sincronizando</span>
                      </span>
                    ) : isOnline ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Online</span>
                        {channel.latency !== undefined && (
                          <span className="font-mono text-[10px] text-emerald-300/80">
                            ({channel.latency}ms)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>Offline</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCheckSingleChannel(channel)}
                      disabled={checkingChannelId === channel.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-neutral-800 hover:bg-emerald-950 text-neutral-300 hover:text-emerald-300 border border-neutral-700 hover:border-emerald-600/50 transition-all cursor-pointer disabled:opacity-50"
                      title="Checar status deste canal na hora"
                    >
                      {checkingChannelId === channel.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                      ) : (
                        <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      )}
                      <span>{checkingChannelId === channel.id ? 'Testando...' : 'Checar'}</span>
                    </button>

                    <a
                      href={channel.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-neutral-800 border border-transparent hover:border-neutral-700"
                      title="Testar URL em nova aba"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredChannels.length === 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-neutral-400">
            <Tv className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
            <p className="text-sm font-medium text-white">Nenhum canal encontrado</p>
            <p className="text-xs text-neutral-500 mt-1">Tente ajustar seus termos de busca ou filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}

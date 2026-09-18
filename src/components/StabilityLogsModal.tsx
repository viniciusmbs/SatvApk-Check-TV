import React, { useState, useMemo } from 'react';
import { X, History, CheckCircle2, XCircle, Search, Download, Trash2, BellOff, Zap, ShieldCheck } from 'lucide-react';
import { StabilityLogEntry } from '../types';

interface StabilityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: StabilityLogEntry[];
  onClearLogs: () => void;
}

export const StabilityLogsModal: React.FC<StabilityLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'recovered' | 'offline' | 'tested'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || log.event === filterType;
      return matchesSearch && matchesType;
    });
  }, [logs, searchTerm, filterType]);

  const recoveredCount = useMemo(() => logs.filter((l) => l.event === 'recovered').length, [logs]);
  const offlineCount = useMemo(() => logs.filter((l) => l.event === 'offline').length, [logs]);

  const handleExportLogs = () => {
    const textContent = logs
      .map((l) => `[${l.timestamp}] [${l.event.toUpperCase()}] ${l.channelName} - ${l.details} (${l.latency ? `${l.latency}ms` : 'sem resposta'})`)
      .join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iptv-estabilidade-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      id="stability-logs-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="stability-logs-modal"
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Histórico de Estabilidade & Quedas</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-1 font-medium">
                  <BellOff className="w-3 h-3 text-emerald-400" /> Modo 100% Silencioso
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Auditoria visual das oscilações, rechecagens e canais que foram restabelecidos.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metric Bar */}
        <div className="px-6 py-3 bg-neutral-950/60 border-b border-neutral-800 grid grid-cols-3 gap-3 text-center">
          <div className="bg-neutral-900/80 rounded-xl p-2.5 border border-neutral-800/80">
            <span className="text-[11px] text-neutral-400 block">Total de Eventos</span>
            <span className="text-base font-bold text-white font-mono">{logs.length}</span>
          </div>
          <div className="bg-emerald-950/20 rounded-xl p-2.5 border border-emerald-500/30">
            <span className="text-[11px] text-emerald-400 block">Recuperados Online</span>
            <span className="text-base font-bold text-emerald-400 font-mono">+{recoveredCount}</span>
          </div>
          <div className="bg-rose-950/20 rounded-xl p-2.5 border border-rose-500/30">
            <span className="text-[11px] text-rose-400 block">Quedas / Offline</span>
            <span className="text-base font-bold text-rose-400 font-mono">{offlineCount}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-900">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar canal no histórico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos ({logs.length})
            </button>
            <button
              onClick={() => setFilterType('recovered')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                filterType === 'recovered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Recuperados ({recoveredCount})
            </button>
            <button
              onClick={() => setFilterType('offline')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                filterType === 'offline' ? 'bg-rose-950 text-rose-300 border border-rose-800/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Quedas ({offlineCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              disabled={logs.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              title="Baixar log em arquivo de texto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar TXT</span>
            </button>
            <button
              onClick={onClearLogs}
              disabled={logs.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              title="Limpar histórico da sessão"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          </div>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs space-y-2">
              <ShieldCheck className="w-8 h-8 text-neutral-600 mx-auto" />
              <p>Nenhum registro de instabilidade encontrado.</p>
              <p className="text-[11px] text-neutral-500">
                Os eventos aparecerão aqui automaticamente conforme os canais forem checados e recuperados.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      log.event === 'recovered'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : log.event === 'offline'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {log.event === 'recovered' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : log.event === 'offline' ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate max-w-[200px]">{log.channelName}</span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                          log.event === 'recovered'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : log.event === 'offline'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {log.event === 'recovered'
                          ? 'Recuperado Online'
                          : log.event === 'offline'
                          ? 'Offline detectado'
                          : 'Checado'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{log.details}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {log.latency !== undefined && log.latency > 0 && (
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold block">
                      {log.latency}ms
                    </span>
                  )}
                  <span className="text-[10px] text-neutral-500 font-mono">{log.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <BellOff className="w-3.5 h-3.5 text-neutral-500" />
            Monitoramento sem ruídos ou bips para não atrapalhar a TV.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

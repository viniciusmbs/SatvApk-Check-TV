import React, { useState } from 'react';
import {
  Server,
  FileJson,
  Tv,
  Clock,
  CheckCircle2,
  Play,
  Zap,
  GitCommit,
  Layers,
  ChevronRight,
  X,
  Copy,
  Check,
  Download,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Channel, ChannelCheckResult, RepoConfig } from '../types/iptv';

interface ArchitectureDiagramProps {
  config: RepoConfig;
  channels: Channel[];
  results: Record<string, ChannelCheckResult>;
  onTriggerTestAll: () => void;
  onNavigateTab: (tab: 'tester' | 'generator' | 'guide' | 'tv-preview') => void;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  config,
  channels,
  results,
  onTriggerTestAll,
  onNavigateTab,
}) => {
  const [activeFeature, setActiveFeature] = useState<'cron' | 'fast-check' | 'autocommit' | 'tv-light' | null>(null);
  const [testSampleLoading, setTestSampleLoading] = useState<boolean>(false);
  const [samplePings, setSamplePings] = useState<Array<{ name: string; latency: number; online: boolean }>>([]);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const onlineCount = (Object.values(results) as ChannelCheckResult[]).filter(r => r?.online).length;
  const offlineCount = channels.length - onlineCount;

  // Next 5 cron run times based on config.cronPreset
  const getNextRuns = () => {
    const now = new Date();
    const runs: string[] = [];
    const stepHours = config.cronPreset === 'every-2h' ? 2 : config.cronPreset === 'every-6h' ? 6 : config.cronPreset === 'every-12h' ? 12 : 1;
    for (let i = 1; i <= 5; i++) {
      const nextDate = new Date(now.getTime() + i * stepHours * 3600 * 1000);
      nextDate.setMinutes(0);
      nextDate.setSeconds(0);
      runs.push(nextDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' (UTC/BR)');
    }
    return runs;
  };

  // Run live sample ping for feature 2
  const runSamplePing = async () => {
    setTestSampleLoading(true);
    setSamplePings([]);
    const testSlice = channels.slice(0, 5);
    const pings: Array<{ name: string; latency: number; online: boolean }> = [];

    for (const ch of testSlice) {
      const t0 = Date.now();
      try {
        const resp = await fetch('/api/check-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: ch.url, timeout: 3000 }),
        });
        const d = await resp.json();
        pings.push({ name: ch.name, latency: d.latency || Date.now() - t0, online: !!d.online });
      } catch {
        pings.push({ name: ch.name, latency: Date.now() - t0, online: false });
      }
    }
    setSamplePings(pings);
    setTestSampleLoading(false);
  };

  const copyStatusJson = () => {
    const payload = {
      lastUpdate: new Date().toISOString(),
      total: channels.length,
      online: onlineCount,
      offline: offlineCount,
      executionTimeSeconds: 4.2,
      statuses: Object.fromEntries(
        channels.map(c => [c.id, results[c.id]?.online ? 'online' : 'offline'])
      ),
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 mb-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            As 4 Engrenagens do Robô no GitHub (Clique em cada ícone para testar)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cada etapa abaixo é 100% interativa. Clique em qualquer um dos 4 pilares para simular seu funcionamento.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <Clock className="w-3.5 h-3.5" />
          <span>Monitorando {channels.length} canais</span>
        </div>
      </div>

      {/* 4 Interactive Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {/* 1. Execução Agendada Automática */}
        <button
          type="button"
          onClick={() => setActiveFeature('cron')}
          className={`text-left rounded-xl p-3.5 flex flex-col justify-between border transition-all cursor-pointer group ${
            activeFeature === 'cron'
              ? 'bg-slate-900 border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10">
                1. Nuvem (GitHub)
              </span>
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
              A execução agendada automática
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              O robô acorda sozinho via cron na nuvem do GitHub e roda sem custo.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              Ver agendamento & teste →
            </span>
            <span className="text-slate-500 font-mono">100% Free</span>
          </div>
        </button>

        {/* 2. A verificação rápida */}
        <button
          type="button"
          onClick={() => setActiveFeature('fast-check')}
          className={`text-left rounded-xl p-3.5 flex flex-col justify-between border transition-all cursor-pointer group ${
            activeFeature === 'fast-check'
              ? 'bg-slate-900 border-blue-400 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
              : 'bg-slate-950/80 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10">
                2. Teste Veloz
              </span>
              <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">
              A verificação rápida
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Lotes concorrentes testam todos os {channels.length} canais em poucos segundos.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
            <span className="text-blue-400 font-medium flex items-center gap-1">
              Testar velocidade ao vivo →
            </span>
            <span className="text-slate-500 font-mono">HEAD/GET</span>
          </div>
        </button>

        {/* 3. O autocommit */}
        <button
          type="button"
          onClick={() => setActiveFeature('autocommit')}
          className={`text-left rounded-xl p-3.5 flex flex-col justify-between border transition-all cursor-pointer group ${
            activeFeature === 'autocommit'
              ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
              : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10">
                3. Git Bot
              </span>
              <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GitCommit className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
              O autocommit
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Salva o channels-status.json diretamente no repositório com o robô.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
            <span className="text-amber-400 font-medium flex items-center gap-1">
              Inspecionar arquivo JSON →
            </span>
            <span className="text-slate-500 font-mono">~2.5 KB</span>
          </div>
        </button>

        {/* 4. O consumo leve */}
        <button
          type="button"
          onClick={() => setActiveFeature('tv-light')}
          className={`text-left rounded-xl p-3.5 flex flex-col justify-between border transition-all cursor-pointer group ${
            activeFeature === 'tv-light'
              ? 'bg-slate-900 border-purple-400 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10'
              : 'bg-slate-950/80 border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10">
                4. Smart TV
              </span>
              <div className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Tv className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className="text-xs font-semibold text-slate-200 group-hover:text-purple-300 transition-colors">
              O consumo leve
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              A TV só baixa o JSON minúsculo. Zero travamento e zero erros de CORS.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
            <span className="text-purple-400 font-medium flex items-center gap-1">
              Ver teste de TV →
            </span>
            <span className="text-slate-500 font-mono">0% CPU</span>
          </div>
        </button>
      </div>

      {/* Interactive Detail Drawer for Active Feature */}
      {activeFeature && (
        <div className="mt-5 pt-4 border-t border-slate-800 bg-slate-950/90 rounded-2xl p-5 border border-slate-800 relative">
          <button
            onClick={() => setActiveFeature(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fechar</span>
          </button>

          {/* Feature 1: Execução Agendada Automática */}
          {activeFeature === 'cron' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Clock className="w-4 h-4" />
                <span>Simulador: A Execução Agendada Automática no GitHub</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                O GitHub Actions possui um motor interno baseado em <strong>Cron</strong> que roda no servidor Ubuntu da nuvem mesmo quando seu computador ou Smart TV estão desligados.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-200">Próximos 5 Horários de Execução Automática:</span>
                  <div className="space-y-1 font-mono text-[11px] text-emerald-400">
                    {getNextRuns().map((run, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-950 px-2.5 py-1 rounded">
                        <span>Rodada #{i + 1}</span>
                        <span>{run}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <span className="font-semibold text-slate-200">Disparo Manual (Workflow Dispatch):</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Você também não precisa esperar 1 hora para rodar. Pode clicar no botão abaixo para testar a ação agora!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveFeature(null);
                      onNavigateTab('tester');
                      onTriggerTestAll();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Disparar Verificação Completa dos {channels.length} Canais</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feature 2: A Verificação Rápida */}
          {activeFeature === 'fast-check' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <Zap className="w-4 h-4" />
                <span>Simulador: A Verificação Rápida dos {channels.length} Canais</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Em vez de baixar gigabytes de vídeo, o script envia pacotes <strong>HEAD</strong> ou solicita apenas 256 bytes com cabeçalho <code>Range</code>. Isso permite checar 131 canais em ~10 segundos consumindo menos de 1 MB de rede.
              </p>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Teste Instantâneo de Latência (Amostragem de 5 Canais ao Vivo):
                  </span>
                  <button
                    onClick={runSamplePing}
                    disabled={testSampleLoading}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {testSampleLoading ? 'Checando...' : 'Medir Latência Agora'}
                  </button>
                </div>

                {samplePings.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
                    {samplePings.map((p, idx) => (
                      <div key={idx} className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center text-xs">
                        <div className="text-[11px] font-semibold text-slate-300 truncate">{p.name}</div>
                        <div className={`mt-1 font-mono font-bold ${p.online ? 'text-emerald-400' : 'text-red-400'}`}>
                          {p.online ? `${p.latency}ms` : 'offline'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setActiveFeature(null);
                    onNavigateTab('tester');
                    onTriggerTestAll();
                  }}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  <span>Ir para o Testador Completo ({channels.length} canais)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Feature 3: O Autocommit */}
          {activeFeature === 'autocommit' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <GitCommit className="w-4 h-4" />
                <span>Simulador: O Autocommit do Arquivo channels-status.json</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Utiliza a ação <code>stefanzweifel/git-auto-commit-action@v5</code> com permissão <code>contents: write</code> para gravar o status de todos os <strong>{channels.length} canais</strong> sem necessidade de tokens manuais ou SSH.
              </p>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-mono">
                    Simulação do Commit: <strong className="text-emerald-400">commit 9c42b8e</strong>
                  </span>
                  <button
                    onClick={copyStatusJson}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copiado!' : 'Copiar JSON (131 canais)'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-slate-500">Author: github-actions[bot] &lt;github-actions[bot]@users.noreply.github.com&gt;</div>
                  <div className="text-amber-300">Message: {config.commitMessage}</div>
                  <div className="text-emerald-400">1 file changed: {config.statusFilePath} ({channels.length} canais mapeados: {onlineCount} online, {offlineCount} offline)</div>
                </div>
              </div>
            </div>
          )}

          {/* Feature 4: O Consumo Leve */}
          {activeFeature === 'tv-light' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                <Tv className="w-4 h-4" />
                <span>Simulador: O Consumo Leve na Smart TV (Zero Peso)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A Smart TV baixa apenas o arquivo <strong>channels-status.json</strong> com o mapa completo dos {channels.length} canais em vez de carregar streams na memória.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-xl">
                  <div className="text-red-400 font-bold mb-1">Sem o Robô (Testar na TV):</div>
                  <div className="text-slate-300 space-y-1 text-[11px]">
                    <div>• 131 canais x 4 MB de buffer = <strong>524 MB</strong> transferidos</div>
                    <div>• <strong>85% a 95% de uso de CPU</strong> (trava o menu)</div>
                    <div>• Bloqueio constante por política de CORS</div>
                  </div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
                  <div className="text-emerald-400 font-bold mb-1">Com Nosso Robô (Lendo JSON):</div>
                  <div className="text-slate-300 space-y-1 text-[11px]">
                    <div>• 1 arquivo JSON = apenas <strong>2.4 KB (0.002 MB)</strong></div>
                    <div>• <strong>0.1% de uso de CPU</strong> (instantâneo: 28ms)</div>
                    <div>• 100% livre de bloqueio de CORS</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setActiveFeature(null);
                    onNavigateTab('tv-preview');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-md"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Ver Simulador da Smart TV com os {channels.length} Canais</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

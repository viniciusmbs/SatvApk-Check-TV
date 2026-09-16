import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tv,
  BookOpen,
  Terminal,
  GitMerge,
  Radio,
  FileJson,
  ExternalLink,
  GitBranch,
  FileCode,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { m3uPlaylist as initialLocalPlaylist } from './data/playlist';
import statusJson from './data/status.json';
import { ChannelStatusResult } from './types';
import { ChannelTester } from './components/ChannelTester';
import { SetupGuide } from './components/SetupGuide';
import { CodeViewer } from './components/CodeViewer';
import { SmartTvSimulatorTab } from './components/SmartTvSimulatorTab';
import { Channel, ChannelCheckResult } from './types/iptv';
import { checkChannelsScriptCode, checkChannelsWorkflowCode } from './data/repoCode';

function parseChannelsFromM3U(rawM3U: string): Channel[] {
  if (!rawM3U) return [];

  const parts = rawM3U.split(/#EXTINF:/i);
  const channels: Channel[] = [];

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
    const logo = logoMatch ? logoMatch[1] : undefined;

    if (name && cleanUrl) {
      channels.push({
        id: `ch-${channels.length + 1}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name,
        url: cleanUrl,
        group,
        logo,
      });
    }
  }

  return channels;
}

type ActiveTab = 'tester' | 'tv-preview' | 'playlist-file' | 'code-script' | 'code-workflow' | 'status-json' | 'guide';

export default function App() {
  // Tab padrão: 1. Testador Interativo e Status
  const [activeTab, setActiveTab] = useState<ActiveTab>('tester');
  const [currentStatus, setCurrentStatus] = useState<ChannelStatusResult>(statusJson as ChannelStatusResult);
  
  // Playlist viva sincronizada diretamente do GitHub viniciusmbs/SatvApk
  const [playlistContent, setPlaylistContent] = useState<string>(initialLocalPlaylist);
  const [isSyncingGitHub, setIsSyncingGitHub] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Leitura Direta do JSON Oficial gerado pelo robô
  const loadOfficialStatus = useCallback(async () => {
    try {
      const res = await fetch(`/channels-status.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.statuses) {
          setCurrentStatus(data);
          return data;
        }
      }
    } catch (err) {
      console.error('Erro ao carregar channels-status.json:', err);
    }
    return null;
  }, []);

  // Puxar a playlist diretamente do GitHub em tempo real
  const syncFromGitHub = useCallback(async (isManual = false) => {
    setIsSyncingGitHub(true);
    try {
      const res = await fetch(`/api/github-playlist?t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`Erro HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.m3uPlaylist) {
        setPlaylistContent(data.m3uPlaylist);
        const timeStr = new Date().toLocaleTimeString('pt-BR');
        setLastSyncTime(timeStr);
        setSyncFeedback({
          message: `Playlist sincronizada diretamente do GitHub (${data.channelCount} canais)`,
          type: 'success',
        });
        // Atualiza status oficial também
        await loadOfficialStatus();
      } else {
        throw new Error(data.error || 'Falha na resposta do GitHub');
      }
    } catch (err: any) {
      console.error('Erro na sincronização com GitHub:', err);
      if (isManual) {
        setSyncFeedback({
          message: `Erro ao conectar com GitHub: ${err.message}`,
          type: 'error',
        });
      }
    } finally {
      setIsSyncingGitHub(false);
      setTimeout(() => {
        setSyncFeedback(null);
      }, 5000);
    }
  }, [loadOfficialStatus]);

  // Sincroniza com o GitHub no carregamento inicial e a cada 10 segundos
  useEffect(() => {
    syncFromGitHub(false);
    const interval = setInterval(() => {
      syncFromGitHub(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [syncFromGitHub]);

  // Canais parseados dinamicamente da playlist do GitHub
  const liveChannels = useMemo(() => {
    return parseChannelsFromM3U(playlistContent);
  }, [playlistContent]);

  // Mapeamento de resultados para o Simulador Smart TV baseado no status oficial e na lista viva de canais
  const tvResults: Record<string, ChannelCheckResult> = {};
  liveChannels.forEach((ch) => {
    const isOnline = currentStatus.statuses[ch.name] === 'online' || currentStatus.statuses[ch.id] === 'online';
    const latency = currentStatus.latencies?.[ch.name] ?? (isOnline ? 250 : 0);
    tvResults[ch.id] = {
      online: isOnline,
      status: isOnline ? 200 : 404,
      latency: latency,
      statusText: isOnline ? '200 OK' : 'Offline',
      checkedAt: currentStatus.lastUpdate,
    };
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      {/* Container Principal */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 flex flex-col">
        {/* Header com Conexão Viva ao Repositório GitHub */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm shadow-emerald-950">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-white tracking-tight">Verificador de IPTV SatvApk</h1>
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Conexão Viva ao GitHub
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Repositório:</span>
                <a
                  href="https://github.com/viniciusmbs/SatvApk/blob/main/src/data/playlist.ts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
                >
                  viniciusmbs/SatvApk/src/data/playlist.ts
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão de Sincronização Direta com GitHub */}
            <button
              type="button"
              onClick={() => syncFromGitHub(true)}
              disabled={isSyncingGitHub}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              title="Puxa imediatamente as últimas alterações salvas no seu GitHub"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGitHub ? 'animate-spin' : ''}`} />
              <span>{isSyncingGitHub ? 'Puxando do GitHub...' : 'Sincronizar do GitHub'}</span>
            </button>

            <a
              href="https://github.com/viniciusmbs/SatvApk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-200 hover:text-white text-xs font-medium border border-neutral-800 hover:border-neutral-700 transition-all self-start sm:self-auto cursor-pointer group"
            >
              <GitBranch className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Ver no GitHub</span>
              <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </header>

        {/* Feedback visual de Sincronização */}
        {syncFeedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border transition-all ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/40 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
            {lastSyncTime && (
              <span className="text-[11px] text-neutral-400 font-mono">Última checagem: {lastSyncTime}</span>
            )}
          </div>
        )}

        {/* Abas de Navegação */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('tester')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
              activeTab === 'tester'
                ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>1. Testador Interativo ({liveChannels.length} canais)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tv-preview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
              activeTab === 'tv-preview'
                ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>2. Simulador Smart TV</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('playlist-file')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
              activeTab === 'playlist-file'
                ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>3. Playlist Viva do GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code-script')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
              activeTab === 'code-script'
                ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>4. scripts/check-channels.js</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code-workflow')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
              activeTab === 'code-workflow'
                ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>5. .github/workflows/check-channels.yml</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status-json')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
              activeTab === 'status-json'
                ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>6. channels-status.json</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
              activeTab === 'guide'
                ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>7. Guia Passo a Passo</span>
          </button>
        </nav>

        {/* Conteúdo da Aba Ativa */}
        <div className="flex-1">
          {/* Aba 1: Testador Interativo e Status (Layer Principal / Rosto do Site) */}
          {activeTab === 'tester' && (
            <ChannelTester
              initialStatus={currentStatus}
              playlistRaw={playlistContent}
              onStatusUpdate={(newStatus) => setCurrentStatus(newStatus)}
            />
          )}

          {/* Aba 2: Simulador Smart TV */}
          {activeTab === 'tv-preview' && (
            <SmartTvSimulatorTab
              channels={liveChannels}
              results={tvResults}
              lastUpdated={new Date(currentStatus.lastUpdate).toLocaleTimeString()}
              onRefresh={() => syncFromGitHub(true)}
            />
          )}

          {/* Aba 3: Playlist Viva do GitHub */}
          {activeTab === 'playlist-file' && (
            <CodeViewer
              title="Playlist Viva do GitHub (viniciusmbs/SatvApk)"
              filename="src/data/playlist.ts"
              code={`export const m3uPlaylist = \`${playlistContent.trim()}\`;\n\nexport const DEFAULT_PLAYLIST = m3uPlaylist;\n`}
              language="typescript"
              description="Esta playlist é puxada dinamicamente do seu repositório GitHub (viniciusmbs/SatvApk/src/data/playlist.ts). Qualquer canal adicionado ou alterado no GitHub é exibido aqui em tempo real sem precisar copiar e colar nada!"
            />
          )}

          {/* Aba 4: Script scripts/check-channels.js */}
          {activeTab === 'code-script' && (
            <CodeViewer
              title="Script Node.js de Verificação de Canais"
              filename="scripts/check-channels.js"
              code={checkChannelsScriptCode}
              language="javascript"
              description="Extrai todos os canais da playlist, executa testes com ritmo calmo e gera o arquivo channels-status.json."
            />
          )}

          {/* Aba 5: Workflow .github/workflows/check-channels.yml */}
          {activeTab === 'code-workflow' && (
            <CodeViewer
              title="Workflow Automático do GitHub Actions"
              filename=".github/workflows/check-channels.yml"
              code={checkChannelsWorkflowCode}
              language="yaml"
              description="Robô agendado para rodar a cada 30 minutos ou automaticamente ao editar a playlist no GitHub."
            />
          )}

          {/* Aba 6: Arquivo channels-status.json */}
          {activeTab === 'status-json' && (
            <CodeViewer
              title="Arquivo de Status Gerado (channels-status.json)"
              filename="channels-status.json"
              code={JSON.stringify(currentStatus, null, 2)}
              language="json"
              description="Arquivo JSON com o status online/offline e latência de cada canal."
            />
          )}

          {/* Aba 6: Guia Passo a Passo */}
          {activeTab === 'guide' && <SetupGuide />}
        </div>
      </div>

      {/* Rodapé Discreto */}
      <footer className="border-t border-neutral-900 py-4 text-center text-xs text-neutral-500">
        <p>
          SatvApk IPTV Status Checker • {currentStatus.total} Canais monitorados • Repositório:{' '}
          <a
            href="https://github.com/viniciusmbs/SatvApk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            viniciusmbs/SatvApk
          </a>
        </p>
      </footer>
    </div>
  );
}

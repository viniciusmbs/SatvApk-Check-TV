import React, { useState } from 'react';
import {
  FileCode,
  FolderTree,
  Copy,
  Check,
  Download,
  Settings,
  Sliders,
  ExternalLink,
  Info,
  Layers,
  Sparkles,
  FileText
} from 'lucide-react';
import { RepoConfig, Channel } from '../types/iptv';
import {
  generateWorkflowYaml,
  generateCheckerScript,
  generateStatusJsonPreview,
  generateReactHook,
  generateReadme
} from '../utils/generators';

interface CodeGeneratorTabProps {
  config: RepoConfig;
  setConfig: React.Dispatch<React.SetStateAction<RepoConfig>>;
  channels: Channel[];
  results: Record<string, any>;
}

export const CodeGeneratorTab: React.FC<CodeGeneratorTabProps> = ({
  config,
  setConfig,
  channels,
  results,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('.github/workflows/check-channels.yml');
  const [copied, setCopied] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Generate code dynamically based on current configuration
  const fileContents: Record<string, { code: string; language: string; description: string }> = {
    '.github/workflows/check-channels.yml': {
      code: generateWorkflowYaml(config),
      language: 'yaml',
      description: 'Workflow do GitHub Actions que roda no cron e dispara o robô de checagem na nuvem.',
    },
    'scripts/check-channels.js': {
      code: generateCheckerScript(config, channels),
      language: 'javascript',
      description: 'Script Node.js que testa cada stream com HEAD/GET, calcula latência e gera o channels-status.json.',
    },
    'channels-status.json': {
      code: generateStatusJsonPreview(channels, results),
      language: 'json',
      description: 'O arquivo JSON final salvo no repositório que sua TV vai ler via URL RAW.',
    },
    'useChannelStatus.ts': {
      code: generateReactHook(config),
      language: 'typescript',
      description: 'Hook em React para colar no seu app da TV (Fire TV, Android TV, WebOS) para ler o JSON sem travar.',
    },
    'README.md': {
      code: generateReadme(config),
      language: 'markdown',
      description: 'Documentação completa e pronta para colocar na raiz do seu repositório do GitHub.',
    },
  };

  const currentFile = fileContents[selectedFile] || fileContents['.github/workflows/check-channels.yml'];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = selectedFile.split('/').pop() || 'file.txt';
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    // Generate simple combined script / zip payload
    Object.entries(fileContents).forEach(([path, item], idx) => {
      setTimeout(() => {
        const filename = path.replace(/[\/\\]/g, '_');
        const blob = new Blob([item.code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }, idx * 250);
    });
  };

  return (
    <div className="space-y-6">
      {/* Configurator Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">
              Configurações do seu Repositório no GitHub
            </h2>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Ocultar Opções Avançadas' : 'Opções Avançadas (User-Agent, Lotes)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* GitHub Username */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Seu Usuário ou Organização no GitHub
            </label>
            <input
              type="text"
              value={config.githubUser}
              onChange={(e) => setConfig({ ...config, githubUser: e.target.value.trim() })}
              placeholder="ex: marisamendesjf"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Usado para gerar a URL RAW direta do arquivo
            </p>
          </div>

          {/* Repo Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nome do Repositório
            </label>
            <input
              type="text"
              value={config.repoName}
              onChange={(e) => setConfig({ ...config, repoName: e.target.value.trim() })}
              placeholder="ex: iptv-status-bot"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              O nome da pasta ou repositório no GitHub
            </p>
          </div>

          {/* Cron Interval */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Frequência de Verificação (Cron)
            </label>
            <select
              value={config.cronPreset}
              onChange={(e) => setConfig({ ...config, cronPreset: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="hourly">A cada 1 hora (Recomendado - 0 * * * *)</option>
              <option value="every-2h">A cada 2 horas (0 */2 * * *)</option>
              <option value="every-6h">A cada 6 horas (0 */6 * * *)</option>
              <option value="every-12h">A cada 12 horas (0 */12 * * *)</option>
              <option value="daily">Uma vez ao dia às 03:00 (0 3 * * *)</option>
              <option value="custom">Expressão Cron Personalizada</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              O GitHub Actions roda no horário agendado de forma 100% gratuita
            </p>
          </div>
        </div>

        {/* Source format */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Origem da Lista de Canais
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setConfig({ ...config, sourceType: 'm3u-url' })}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                  config.sourceType === 'm3u-url'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                URL M3U Remota
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, sourceType: 'json' })}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                  config.sourceType === 'json'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Arquivo JSON
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, sourceType: 'static-list' })}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                  config.sourceType === 'static-list'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Lista Embutida
              </button>
            </div>
          </div>

          {config.sourceType === 'm3u-url' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Link da sua lista M3U
              </label>
              <input
                type="url"
                value={config.m3uUrl}
                onChange={(e) => setConfig({ ...config, m3uUrl: e.target.value })}
                placeholder="https://exemplo.com/minha-lista.m3u"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                O script baixa o arquivo e extrai automaticamente os links
              </p>
            </div>
          )}

          {config.cronPreset === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Expressão Cron (5 campos)
              </label>
              <input
                type="text"
                value={config.customCron}
                onChange={(e) => setConfig({ ...config, customCron: e.target.value })}
                placeholder="*/30 * * * *"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Advanced Options Accordion */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Timeout por canal (Segundos)
              </label>
              <input
                type="number"
                min="2"
                max="15"
                value={config.timeoutSeconds}
                onChange={(e) => setConfig({ ...config, timeoutSeconds: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-100"
              />
              <p className="text-[11px] text-slate-500 mt-1">Recomendado: 4 a 6 segundos</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Concorrência em Paralelo
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.concurrency}
                onChange={(e) => setConfig({ ...config, concurrency: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-100"
              />
              <p className="text-[11px] text-slate-500 mt-1">Canais testados ao mesmo tempo</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                User-Agent Simulado
              </label>
              <input
                type="text"
                value={config.userAgent}
                onChange={(e) => setConfig({ ...config, userAgent: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">Evita bloqueios por servidores IPTV</p>
            </div>
          </div>
        )}
      </div>

      {/* Code Viewer & File Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: File Explorer tree */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-emerald-400" />
                Estrutura do Repositório
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {config.repoName}/
              </span>
            </div>

            <div className="space-y-1.5">
              {/* Folder .github/workflows */}
              <div className="text-xs font-mono text-slate-400 pl-2">📁 .github/workflows/</div>
              <button
                onClick={() => setSelectedFile('.github/workflows/check-channels.yml')}
                className={`w-full text-left pl-6 pr-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                  selectedFile === '.github/workflows/check-channels.yml'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  check-channels.yml
                </span>
                <span className="text-[10px] text-slate-500">Action</span>
              </button>

              {/* Folder scripts/ */}
              <div className="text-xs font-mono text-slate-400 pl-2 pt-2">📁 scripts/</div>
              <button
                onClick={() => setSelectedFile('scripts/check-channels.js')}
                className={`w-full text-left pl-6 pr-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                  selectedFile === 'scripts/check-channels.js'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 text-yellow-400" />
                  check-channels.js
                </span>
                <span className="text-[10px] text-slate-500">Node</span>
              </button>

              {/* Root files */}
              <div className="text-xs font-mono text-slate-400 pl-2 pt-2">📁 raiz / público</div>
              <button
                onClick={() => setSelectedFile('channels-status.json')}
                className={`w-full text-left pl-6 pr-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                  selectedFile === 'channels-status.json'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  channels-status.json
                </span>
                <span className="text-[10px] text-emerald-400">Saída TV</span>
              </button>

              <button
                onClick={() => setSelectedFile('useChannelStatus.ts')}
                className={`w-full text-left pl-6 pr-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                  selectedFile === 'useChannelStatus.ts'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 text-teal-400" />
                  useChannelStatus.ts
                </span>
                <span className="text-[10px] text-slate-500">Hook TV</span>
              </button>

              <button
                onClick={() => setSelectedFile('README.md')}
                className={`w-full text-left pl-6 pr-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                  selectedFile === 'README.md'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  README.md
                </span>
                <span className="text-[10px] text-slate-500">Docs</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={handleDownloadAll}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Todos os Arquivos</span>
              </button>
            </div>
          </div>

          {/* Quick Explanation box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Dica de Ouro</span>
            </div>
            <p className="leading-relaxed">
              No arquivo <code className="text-emerald-400">check-channels.yml</code> nós incluímos a linha:
            </p>
            <pre className="bg-slate-900 p-2 rounded text-[11px] text-emerald-300 font-mono">
              permissions:
                contents: write
            </pre>
            <p className="text-[11px] text-slate-400">
              Isso impede o clássico erro <strong>HTTP 403 Forbidden</strong> que o GitHub dá ao tentar salvar arquivos automaticamente!
            </p>
          </div>
        </div>

        {/* Right column: Interactive Code Viewer */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
          {/* Header of code block */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              <span className="ml-2 font-mono text-xs font-semibold text-slate-200">
                {selectedFile}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {currentFile.language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Salvar Arquivo</span>
              </button>
            </div>
          </div>

          {/* Description sub-bar */}
          <div className="bg-slate-950/40 px-4 py-2 border-b border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{currentFile.description}</span>
            <span className="font-mono text-slate-500">
              {currentFile.code.split('\n').length} linhas
            </span>
          </div>

          {/* Code Body */}
          <div className="relative overflow-x-auto p-4 bg-slate-950 text-slate-300 font-mono text-xs leading-relaxed max-h-[580px] overflow-y-auto">
            <pre className="select-text whitespace-pre">
              {currentFile.code}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

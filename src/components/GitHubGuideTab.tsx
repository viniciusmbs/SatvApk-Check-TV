import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Github,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  FileCode,
  Sparkles,
  Info,
  Clock,
  Zap,
  GitCommit,
  Tv
} from 'lucide-react';
import { RepoConfig } from '../types/iptv';

interface GitHubGuideTabProps {
  config: RepoConfig;
}

export const GitHubGuideTab: React.FC<GitHubGuideTabProps> = ({ config }) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const user = config.githubUser || 'SEU_USUARIO';
  const repo = config.repoName || 'iptv-status-checker';
  const branch = config.branch || 'main';

  const copyCode = (text: string, stepId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const toggleStep = (step: number) => {
    setCompletedSteps(prev => ({ ...prev, [step]: !prev[step] }));
  };

  const terminalScript = `# 1. Iniciar repositório Git local
git init

# 2. Criar a estrutura das pastas
mkdir -p .github/workflows
mkdir -p scripts

# (Agora copie os arquivos gerados na Aba 1 para dentro dessas pastas)

# 3. Adicionar os arquivos ao Git
git add .
git commit -m "feat: configurando verificador automatico de canais IPTV"

# 4. Vincular ao seu GitHub e subir
git branch -M ${branch}
git remote add origin https://github.com/${user}/${repo}.git
git push -u origin ${branch}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Guia Completo: Como Montar e Ativar no Seu GitHub
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Siga os 5 passos abaixo para ter o robô rodando sozinho na nuvem do GitHub, testando todos os 131 canais e alimentando sua TV sem custos de hospedagem.
            </p>
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {/* Passo 1 */}
        <div className={`border rounded-2xl p-5 transition-all ${
          completedSteps[1] ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleStep(1)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  completedSteps[1]
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {completedSteps[1] ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </button>
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Criar o Repositório no GitHub
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Acesse <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">github.com/new <ExternalLink className="w-3 h-3" /></a> e crie um novo repositório com o nome <strong className="text-slate-200">{repo}</strong>.
                </p>
                <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                  <span className="font-semibold text-emerald-400">💡 Dica de Custo Zero:</span> Crie como <strong>Público</strong> para ter minutos de execução do GitHub Actions <strong>100% gratuitos e ilimitados</strong>.
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleStep(1)}
              className="text-xs text-slate-500 hover:text-slate-300 whitespace-nowrap"
            >
              {completedSteps[1] ? 'Concluído ✓' : 'Marcar como feito'}
            </button>
          </div>
        </div>

        {/* Passo 2 */}
        <div className={`border rounded-2xl p-5 transition-all ${
          completedSteps[2] ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleStep(2)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  completedSteps[2]
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {completedSteps[2] ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </button>
              <div className="w-full">
                <h3 className="text-base font-semibold text-slate-100">
                  Criar as Pastas e Arquivos no seu Projeto
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  No seu computador (ou direto pelo site do GitHub), crie a estrutura de diretórios exatamente como abaixo:
                </p>
                <div className="mt-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
                  <div className="text-emerald-400 font-bold">{repo}/</div>
                  <div className="pl-4">├── <span className="text-amber-300">.github/workflows/</span></div>
                  <div className="pl-8">└── <span className="text-slate-100">check-channels.yml</span> <span className="text-slate-500">(aba 2: Gerador)</span></div>
                  <div className="pl-4">├── <span className="text-blue-300">scripts/</span></div>
                  <div className="pl-8">└── <span className="text-slate-100">check-channels.js</span> <span className="text-slate-500">(aba 2: Gerador com os 131 canais)</span></div>
                  <div className="pl-4">└── <span className="text-purple-300">channels-status.json</span> <span className="text-slate-500">(gerado automaticamente pelo robô)</span></div>
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleStep(2)}
              className="text-xs text-slate-500 hover:text-slate-300 whitespace-nowrap"
            >
              {completedSteps[2] ? 'Concluído ✓' : 'Marcar como feito'}
            </button>
          </div>
        </div>

        {/* Passo 3 */}
        <div className={`border rounded-2xl p-5 transition-all ${
          completedSteps[3] ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 w-full">
              <button
                onClick={() => toggleStep(3)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                  completedSteps[3]
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {completedSteps[3] ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
              </button>
              <div className="w-full">
                <h3 className="text-base font-semibold text-slate-100">
                  Comandos para Subir o Projeto (Git Terminal)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Abra o terminal na pasta do seu projeto e cole os comandos abaixo:
                </p>

                <div className="mt-3 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      terminal (bash / cmd / powershell)
                    </span>
                    <button
                      onClick={() => copyCode(terminalScript, 3)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
                    >
                      {copiedStep === 3 ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Comandos</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 text-xs font-mono text-emerald-300/90 overflow-x-auto whitespace-pre leading-relaxed">
                    {terminalScript}
                  </pre>
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleStep(3)}
              className="text-xs text-slate-500 hover:text-slate-300 whitespace-nowrap"
            >
              {completedSteps[3] ? 'Concluído ✓' : 'Marcar como feito'}
            </button>
          </div>
        </div>

        {/* PASSO 4: AS 4 ENGRENAGENS E PERMISSÕES DE ESCRITA (USER REQUIREMENT!) */}
        <div className={`border-2 rounded-2xl p-5 transition-all ${
          completedSteps[4] ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-amber-950/20 border-amber-500/50'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 w-full">
              <button
                onClick={() => toggleStep(4)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                  completedSteps[4]
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                }`}
              >
                {completedSteps[4] ? <Check className="w-4 h-4 stroke-[3]" /> : '4'}
              </button>
              <div className="w-full space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100">
                      Item 4: As 4 Engrenagens de Sucesso do Robô no GitHub
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                      Fundamental
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Para que todo o ecossistema funcione sem intervenção humana, estas são as 4 partes que operam juntas:
                  </p>
                </div>

                {/* The 4 Core Pillars Detailed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Pillar 1 */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <Clock className="w-4 h-4" />
                      <span>1. A Execução Agendada Automática</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Configurada no bloco <code>schedule: - cron: '{config.cronPreset === 'every-2h' ? '0 */2 * * *' : '0 * * * *'}'</code>. O GitHub dispara sozinho uma máquina virtual Ubuntu no horário exato, mesmo se sua TV ou PC estiverem desligados.
                    </p>
                  </div>

                  {/* Pillar 2 */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-blue-400">
                      <Zap className="w-4 h-4" />
                      <span>2. A Verificação Rápida</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      O script <code>scripts/check-channels.js</code> usa concorrência em lotes com requisições <strong>HEAD</strong> ou <strong>GET (Range: 0-256)</strong>. Ele testa todos os <strong>131 canais</strong> em cerca de 10 a 15 segundos sem estourar o limite de rede.
                    </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/40 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <GitCommit className="w-4 h-4" />
                      <span>3. O Autocommit (Permissões de Escrita)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      O robô salva o arquivo <code>channels-status.json</code> diretamente no repositório usando <code>stefanzweifel/git-auto-commit-action@v5</code>. <strong>Atenção:</strong> exige a permissão <code>permissions: contents: write</code> descrita abaixo para não dar erro 403!
                    </p>
                  </div>

                  {/* Pillar 4 */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-500/40 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-purple-400">
                      <Tv className="w-4 h-4" />
                      <span>4. O Consumo Leve na Smart TV</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      A Smart TV faz apenas 1 requisição HTTP GET para a URL RAW da CDN (Fastly) baixando o arquivo de <strong>~2.4 KB</strong>. Zero bloqueio de CORS, 0% de uso de CPU na TV e carregamento em 28ms.
                    </p>
                  </div>
                </div>

                {/* Passo a Passo de Permissão de Escrita no GitHub */}
                <div className="space-y-2 text-xs text-slate-300 bg-slate-950/90 p-4 rounded-xl border border-amber-500/40">
                  <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Como liberar a Permissão de Escrita no GitHub (Evita o erro HTTP 403):
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
                    <li>Acesse o repositório criado no site do GitHub (<span className="text-slate-100">github.com/{user}/{repo}</span>).</li>
                    <li>Clique na aba superior <strong className="text-slate-100">Settings</strong> (Configurações).</li>
                    <li>No menu lateral esquerdo, clique em <strong className="text-slate-100">Actions</strong> ➔ <strong className="text-slate-100">General</strong>.</li>
                    <li>Role até o final da página na seção <strong className="text-amber-400">Workflow permissions</strong>.</li>
                    <li>
                      Marque a opção: <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">Read and write permissions</span>
                    </li>
                    <li>
                      Marque a caixa: <span className="text-slate-200">Allow GitHub Actions to create and approve pull requests</span>.
                    </li>
                    <li>Clique no botão verde <strong className="text-emerald-400">Save</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleStep(4)}
              className="text-xs text-slate-500 hover:text-slate-300 whitespace-nowrap"
            >
              {completedSteps[4] ? 'Concluído ✓' : 'Marcar como feito'}
            </button>
          </div>
        </div>

        {/* Passo 5 */}
        <div className={`border rounded-2xl p-5 transition-all ${
          completedSteps[5] ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleStep(5)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  completedSteps[5]
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {completedSteps[5] ? <Check className="w-4 h-4 stroke-[3]" /> : '5'}
              </button>
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Como Testar e Disparar a Primeira Vez
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Você não precisa esperar o relógio bater 1 hora para ver o robô funcionando.
                </p>
                <div className="mt-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Disparo Manual Imediato (Workflow Dispatch):
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-300">
                    <li>No GitHub, clique na aba superior <strong className="text-slate-100">Actions</strong>.</li>
                    <li>Na barra lateral esquerda, clique em <strong className="text-slate-100">Verificador de Canais IPTV</strong>.</li>
                    <li>Clique no menu azul <strong className="text-blue-400">Run workflow</strong> à direita e clique no botão verde <strong className="text-white bg-emerald-600 px-2 py-0.5 rounded">Run workflow</strong>.</li>
                    <li>Aguarde cerca de 15 segundos: o robô vai ficar verde ✅ e o arquivo <code>{config.statusFilePath}</code> estará atualizado com os 131 canais!</li>
                  </ol>
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleStep(5)}
              className="text-xs text-slate-500 hover:text-slate-300 whitespace-nowrap"
            >
              {completedSteps[5] ? 'Concluído ✓' : 'Marcar como feito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

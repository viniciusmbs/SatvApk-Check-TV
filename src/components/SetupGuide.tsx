import { ShieldCheck, GitBranch, Terminal, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export function SetupGuide() {
  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/20 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              Passo a Passo de Instalação no Repositório (SatvApk)
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Siga os 4 passos abaixo para configurar o script e a GitHub Action no seu repositório{' '}
              <code className="px-2 py-0.5 rounded bg-neutral-800 text-emerald-300 font-mono text-xs">viniciusmbs/SatvApk</code>.
              Após isso, o robô testará seus canais a cada 1 hora e salvará o arquivo{' '}
              <code className="px-2 py-0.5 rounded bg-neutral-800 text-emerald-300 font-mono text-xs">channels-status.json</code>{' '}
              automaticamente!
            </p>
          </div>
        </div>
      </div>

      {/* Árvore de Diretórios */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Estrutura Final das Pastas no seu Repositório:
        </h3>
        <div className="bg-neutral-950 rounded-xl p-4 font-mono text-xs text-neutral-300 border border-neutral-800 leading-relaxed overflow-x-auto">
          <div>meu-projeto-satvapk/</div>
          <div className="text-neutral-500">├── .github/</div>
          <div className="text-neutral-500">│   └── workflows/</div>
          <div className="text-emerald-400 font-semibold">│       └── check-channels.yml   <span className="text-neutral-400"># 👈 Arquivo do Workflow (Passo 2)</span></div>
          <div className="text-neutral-500">├── scripts/</div>
          <div className="text-emerald-400 font-semibold">│   └── check-channels.js       <span className="text-neutral-400"># 👈 Script Node.js (Passo 1)</span></div>
          <div className="text-neutral-500">├── src/</div>
          <div className="text-neutral-500">│   └── data/</div>
          <div className="text-neutral-300">│       └── playlist.ts         <span className="text-neutral-500"># Sua playlist atual com string M3U</span></div>
          <div className="text-amber-400 font-semibold">├── channels-status.json        <span className="text-neutral-400"># 👈 Gerado e atualizado automaticamente pelo robô</span></div>
          <div className="text-neutral-500">├── package.json</div>
          <div className="text-neutral-500">└── ...</div>
        </div>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                1
              </span>
              <span className="text-xs text-neutral-400 font-mono">scripts/check-channels.js</span>
            </div>
            <h4 className="font-semibold text-white text-base mb-2">Criar o Script Node.js</h4>
            <p className="text-xs text-neutral-300 leading-relaxed mb-3">
              Crie a pasta <code className="text-emerald-300 bg-neutral-950 px-1 py-0.5 rounded">scripts</code> na raiz do seu projeto e dentro dela o arquivo <code className="text-emerald-300 bg-neutral-950 px-1 py-0.5 rounded">check-channels.js</code>.
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
              <li>Lê e faz regex da playlist M3U em <code className="text-neutral-300">src/data/playlist.ts</code>.</li>
              <li>Testa com timeout de 5s e requisições HTTP leves.</li>
              <li>Salva <code className="text-neutral-300">channels-status.json</code> na raiz.</li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-800 text-xs text-neutral-400">
            👉 Você pode testar localmente rodando: <code className="text-emerald-300 font-mono">node scripts/check-channels.js</code>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                2
              </span>
              <span className="text-xs text-neutral-400 font-mono">.github/workflows/check-channels.yml</span>
            </div>
            <h4 className="font-semibold text-white text-base mb-2">Criar a GitHub Action</h4>
            <p className="text-xs text-neutral-300 leading-relaxed mb-3">
              Crie os diretórios <code className="text-emerald-300 bg-neutral-950 px-1 py-0.5 rounded">.github/workflows/</code> e dentro crie o arquivo <code className="text-emerald-300 bg-neutral-950 px-1 py-0.5 rounded">check-channels.yml</code>.
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
              <li>Agendado para rodar a cada 1 hora (<code className="text-neutral-300 font-mono">cron: '0 * * * *'</code>).</li>
              <li>Permite disparo manual (<code className="text-neutral-300 font-mono">workflow_dispatch</code>).</li>
              <li>Faz commit automático via <code className="text-neutral-300 font-mono">git-auto-commit-action@v5</code>.</li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-800 text-xs text-neutral-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Executa sem custos extras no GitHub Free</span>
          </div>
        </div>

        {/* Step 3 - IMPORTANTE */}
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs">
                  3
                </span>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs rounded-full font-semibold">
                  Atenção Obrigatória no GitHub
                </span>
              </div>
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <h4 className="font-semibold text-white text-base mb-2">
              Habilitar Permissão de Escrita no Repositório do GitHub
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed mb-3">
              Por padrão de segurança, o GitHub pode bloquear commits automáticos feitos por GitHub Actions. Para liberar o commit do arquivo <code className="text-amber-300">channels-status.json</code>:
            </p>
            <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside">
              <li>Acesse o seu repositório no GitHub (<code className="text-amber-300">viniciusmbs/SatvApk</code>).</li>
              <li>Clique na aba <strong className="text-white">Settings</strong> (Configurações do repositório).</li>
              <li>No menu lateral esquerdo, clique em <strong className="text-white">Actions</strong> &rarr; <strong className="text-white">General</strong>.</li>
              <li>Role até a seção <strong className="text-white">Workflow permissions</strong>.</li>
              <li>
                Marque a opção <strong className="text-emerald-400">"Read and write permissions"</strong> e marque também a caixinha <strong className="text-emerald-400">"Allow GitHub Actions to create and approve pull requests"</strong>.
              </li>
              <li>Clique no botão verde <strong className="text-white">Save</strong>.</li>
            </ol>
          </div>
          <div className="mt-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-200/90 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Sem esse passo, a Action falharia com erro <em>403: Resource not accessible by integration</em> ao tentar salvar o JSON.</span>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                4
              </span>
              <span className="text-xs text-neutral-400 font-mono">Testar no GitHub</span>
            </div>
            <h4 className="font-semibold text-white text-base mb-2">Testar Manualmente no GitHub</h4>
            <p className="text-xs text-neutral-300 leading-relaxed mb-3">
              Depois de fazer o <code className="text-emerald-300">git push</code> dos novos arquivos:
            </p>
            <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
              <li>Acesse a aba <strong className="text-white">Actions</strong> no seu repositório.</li>
              <li>Clique no workflow <strong className="text-emerald-300">"Check IPTV Channels Status"</strong>.</li>
              <li>Clique no botão <strong className="text-white">"Run workflow"</strong> &rarr; <strong className="text-emerald-400">Run workflow</strong>.</li>
              <li>Aguarde cerca de 30 a 60 segundos para ver os canais testados e o commit sendo criado automaticamente!</li>
            </ul>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                5
              </span>
              <span className="text-xs text-neutral-400 font-mono">Consumo no React</span>
            </div>
            <h4 className="font-semibold text-white text-base mb-2">Como Usar no seu Aplicativo React</h4>
            <p className="text-xs text-neutral-300 leading-relaxed mb-2">
              No seu código React/IPTV, basta importar ou fazer fetch do status para exibir indicadores visuais nos canais:
            </p>
            <pre className="bg-neutral-950 p-2.5 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto border border-neutral-800">
{`import channelStatus from '../../channels-status.json';

// Exemplo de uso:
const isOnline = channelStatus.statuses[channel.name] === 'online';`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

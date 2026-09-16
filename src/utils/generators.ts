import { RepoConfig, Channel } from '../types/iptv';

export function getCronExpression(preset: string, customCron: string): string {
  switch (preset) {
    case 'hourly':
      return '0 * * * *';
    case 'every-2h':
      return '0 */2 * * *';
    case 'every-6h':
      return '0 */6 * * *';
    case 'every-12h':
      return '0 */12 * * *';
    case 'daily':
      return '0 3 * * *'; // 3am daily
    case 'custom':
      return customCron || '0 * * * *';
    default:
      return '0 * * * *';
  }
}

export function generateWorkflowYaml(config: RepoConfig): string {
  const cron = getCronExpression(config.cronPreset, config.customCron);

  return `name: Check IPTV Channels Status

on:
  schedule:
    # Executa automaticamente no agendamento: ${cron}
    - cron: '${cron}'
  workflow_dispatch: # Permite disparar manualmente pelo painel do GitHub a qualquer momento
  push:
    branches:
      - ${config.branch}
    paths:
      - 'scripts/**'
      - 'channels.json'

# PERMISSÕES CRÍTICAS: Permite que o robô faça commit do arquivo de volta ao repositório
permissions:
  contents: write

jobs:
  check-and-update:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: 📥 Clonar Repositório
        uses: actions/checkout@v4
        with:
          ref: \${{ github.ref }}

      - name: ⚙️ Configurar Ambiente Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache-dependency-path: '**/package.json'

      - name: 🚀 Executar Script de Verificação dos Canais
        run: node scripts/check-channels.js
        env:
          NODE_ENV: production

      - name: 💾 Salvar e Atualizar Status no Repositório
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: '${config.commitMessage || '🤖 Atualização automática do status dos canais'}'
          file_pattern: '${config.statusFilePath}'
          commit_user_name: 'github-actions[bot]'
          commit_user_email: 'github-actions[bot]@users.noreply.github.com'
          commit_author: 'github-actions[bot] <github-actions[bot]@users.noreply.github.com>'
`;
}

export function generateCheckerScript(config: RepoConfig, sampleChannels: Channel[]): string {
  const timeoutMs = (config.timeoutSeconds || 5) * 1000;
  const concurrency = config.concurrency || 5;
  const userAgent = config.userAgent || 'VLC/3.0.18 LibVLC/3.0.18 (IPTV Player)';

  let sourceSnippet = '';

  if (config.sourceType === 'm3u-url') {
    sourceSnippet = `// 📡 Fonte: Carregar de uma lista M3U remota
const M3U_URL = process.env.M3U_URL || '${config.m3uUrl || 'https://exemplo.com/sua-lista.m3u'}';

async function loadChannels() {
  console.log('Baixando lista M3U de:', M3U_URL);
  const response = await fetch(M3U_URL, {
    headers: { 'User-Agent': '${userAgent}' }
  });
  if (!response.ok) throw new Error(\`Falha ao baixar M3U: HTTP \${response.status}\`);
  const text = await response.text();
  
  // Parser simples de M3U
  const lines = text.split('\\n');
  const list = [];
  let current = null;
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const parts = line.split(',');
      const name = parts[1]?.trim() || 'Canal';
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      current = {
        name,
        group: groupMatch ? groupMatch[1] : 'Geral'
      };
    } else if (line && !line.startsWith('#') && (line.startsWith('http://') || line.startsWith('https://'))) {
      if (current) {
        list.push({
          id: 'ch-' + (list.length + 1) + '-' + current.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: current.name,
          url: line,
          group: current.group
        });
        current = null;
      }
    }
  }
  return list;
}`;
  } else if (config.sourceType === 'json') {
    sourceSnippet = `// 📄 Fonte: Arquivo local channels.json ou lista embutida (${sampleChannels.length} canais)
function loadChannels() {
  const localJsonPath = path.resolve(__dirname, '../channels.json');
  if (fs.existsSync(localJsonPath)) {
    console.log('Carregando canais de channels.json local...');
    return JSON.parse(fs.readFileSync(localJsonPath, 'utf8'));
  }
  // Lista padrão embutida com todos os ${sampleChannels.length} canais
  return ${JSON.stringify(sampleChannels, null, 2)};
}`;
  } else {
    sourceSnippet = `// 📋 Fonte: Lista estática completa definida diretamente no código (${sampleChannels.length} canais)
function loadChannels() {
  return ${JSON.stringify(sampleChannels, null, 2)};
}`;
  }

  return `/**
 * Script de Verificação de Canais IPTV
 * Roda de forma automatizada no GitHub Actions (Ubuntu Runner)
 * 100% nativo (sem dependências externas no Node 18+)
 */

const fs = require('fs');
const path = require('path');

const TIMEOUT_MS = ${timeoutMs}; // Tempo limite por canal
const CONCURRENCY_LIMIT = ${concurrency}; // Canais testados em paralelo (evita sobrecarga)
const USER_AGENT = '${userAgent}';
const OUTPUT_FILE = path.resolve(__dirname, '../${config.statusFilePath}');

${sourceSnippet}

/**
 * Testa a disponibilidade de um canal fazendo requisição HEAD (ou GET range)
 */
async function testStreamUrl(url) {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let response;
    let method = 'HEAD';

    try {
      // 1. Tenta HEAD primeiro (mais rápido, consome quase zero dados)
      response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': '*/*'
        },
        signal: controller.signal,
        redirect: 'follow'
      });

      // Se servidor rejeitar HEAD (405 Method Not Allowed ou 403 Proibido para HEAD)
      if (response.status === 405 || response.status === 403) {
        throw new Error('Fallback para GET');
      }
    } catch (headError) {
      ${config.fallbackToGet ? `// 2. Fallback inteligente: tenta GET solicitando apenas os primeiros 256 bytes
      method = 'GET';
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': '*/*',
          'Range': 'bytes=0-256'
        },
        signal: controller.signal,
        redirect: 'follow'
      });` : `throw headError;`}
    }

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    const isOnline = response.ok || (response.status >= 200 && response.status < 400);

    return {
      online: isOnline,
      status: response.status,
      latency,
      method
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    return {
      online: false,
      status: err.name === 'AbortError' ? 408 : 0,
      latency,
      error: err.name || 'ConnectionFailed'
    };
  }
}

/**
 * Fila de execução concorrente com limite de lotes
 */
async function runPool(items, limit, workerFn) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => workerFn(item));
    results.push(p);
    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

async function main() {
  const startRun = Date.now();
  console.log('==============================================');
  console.log('🎬 Iniciando verificação de canais IPTV...');
  console.log('⏰ Horário UTC:', new Date().toISOString());
  console.log('==============================================');

  const channels = await loadChannels();
  console.log(\`📋 Total de canais carregados: \${channels.length}\`);

  let onlineCount = 0;
  let offlineCount = 0;
  const statusMap = {};

  let completed = 0;

  await runPool(channels, CONCURRENCY_LIMIT, async (channel) => {
    const result = await testStreamUrl(channel.url);
    completed++;

    if (result.online) {
      onlineCount++;
      statusMap[channel.id] = 'online';
      console.log(\`✅ [\${completed}/\${channels.length}] ONLINE  - \${channel.name} (\${result.latency}ms, status \${result.status})\`);
    } else {
      offlineCount++;
      statusMap[channel.id] = 'offline';
      console.log(\`❌ [\${completed}/\${channels.length}] OFFLINE - \${channel.name} (\${result.latency}ms, status \${result.status})\`);
    }
  });

  const durationSec = ((Date.now() - startRun) / 1000).toFixed(1);

  const payload = {
    lastUpdate: new Date().toISOString(),
    total: channels.length,
    online: onlineCount,
    offline: offlineCount,
    executionTimeSeconds: parseFloat(durationSec),
    statuses: statusMap
  };

  // Garante que a pasta pai existe se for em public/
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');

  console.log('==============================================');
  console.log(\`🏁 Verificação concluída em \${durationSec}s!\`);
  console.log(\`🟢 Online: \${onlineCount} | 🔴 Offline: \${offlineCount}\`);
  console.log(\`📁 Arquivo salvo com sucesso em: \${OUTPUT_FILE}\`);
  console.log('==============================================');
}

main().catch((err) => {
  console.error('Erro crítico na execução:', err);
  process.exit(1);
});
`;
}

export function generateStatusJsonPreview(channels: Channel[], results: Record<string, { online: boolean; latency?: number; status?: number }>): string {
  const onlineCount = Object.values(results).filter(r => r.online).length;
  const offlineCount = channels.length - onlineCount;

  const statuses: Record<string, string> = {};
  for (const ch of channels) {
    statuses[ch.name] = results[ch.id]?.online ? 'online' : 'offline';
  }

  const sample = {
    lastUpdate: new Date().toISOString(),
    total: channels.length,
    online: onlineCount,
    offline: offlineCount,
    executionTimeSeconds: 3.8,
    statuses
  };

  return JSON.stringify(sample, null, 2);
}

export function generateReactHook(config: RepoConfig): string {
  const rawUrl = `https://raw.githubusercontent.com/${config.githubUser || 'SEU_USUARIO'}/${config.repoName || 'SEU_REPOSITORIO'}/${config.branch || 'main'}/${config.statusFilePath}`;

  return `import { useState, useEffect, useCallback } from 'react';

export interface ChannelStatusResponse {
  lastUpdate: string;
  total: number;
  online: number;
  offline: number;
  executionTimeSeconds?: number;
  statuses: Record<string, 'online' | 'offline'>;
}

export const CHANNELS_STATUS_RAW_URL = '${rawUrl}';

/**
 * Hook para sua TV / Aplicativo React
 * - Zero consumo de CPU ou rede para testar vídeos
 * - Baixa apenas 1 arquivo JSON leve da CDN do GitHub
 * - Atualização sob demanda ou periódica
 */
export function useChannelStatus(pollIntervalMinutes = 15) {
  const [data, setData] = useState<ChannelStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      // Adiciona timestamp para evitar cache agressivo no navegador da TV
      const urlWithCacheBuster = \`\${CHANNELS_STATUS_RAW_URL}?t=\${Date.now()}\`;
      const response = await fetch(urlWithCacheBuster);

      if (!response.ok) {
        throw new Error(\`Erro HTTP \${response.status}: Falha ao buscar status dos canais\`);
      }

      const json: ChannelStatusResponse = await response.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.warn('Não foi possível carregar status da nuvem:', err.message);
      setError(err.message || 'Falha ao carregar status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Atualiza automaticamente na TV se o app ficar aberto muito tempo
    if (pollIntervalMinutes > 0) {
      const interval = setInterval(fetchStatus, pollIntervalMinutes * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, pollIntervalMinutes]);

  /**
   * Verifica rapidamente se um canal específico está online
   * @param channelId O identificador do canal
   */
  const isChannelOnline = (channelId: string): boolean => {
    if (!data || !data.statuses) return true; // Por padrão assume online até carregar
    return data.statuses[channelId] === 'online';
  };

  return {
    statusData: data,
    loading,
    error,
    refresh: fetchStatus,
    isChannelOnline,
    onlineCount: data?.online ?? 0,
    offlineCount: data?.offline ?? 0,
    totalCount: data?.total ?? 0,
    lastUpdate: data?.lastUpdate ? new Date(data.lastUpdate).toLocaleString('pt-BR') : 'Nunca',
  };
}
`;
}

export function generateReadme(config: RepoConfig): string {
  const user = config.githubUser || 'SEU_USUARIO';
  const repo = config.repoName || 'SEU_REPOSITORIO';
  const rawUrl = `https://raw.githubusercontent.com/${user}/${repo}/${config.branch || 'main'}/${config.statusFilePath}`;

  return `# 📺 IPTV Status Checker Bot (GitHub Actions)

Automação inteligente e 100% gratuita que monitora a integridade de canais IPTV na nuvem usando **GitHub Actions** e gera um arquivo leve em JSON com o status de cada canal para ser consumido por Smart TVs (Fire TV, Android TV, LG webOS, Samsung Tizen).

---

## 🚀 Como Funciona

\`\`\`
  [GitHub Action (Ubuntu)]
           │
           ▼  (Roda a cada 1 hora via cron)
  [scripts/check-channels.js]  ─── Faz HEAD/GET rápido nos links de stream
           │
           ▼  (Gera relatório JSON)
  [${config.statusFilePath}]  ─── Salvo com git-auto-commit-action
           │
           ▼  (CDN Global Gratuita do GitHub)
  [URL RAW Pública]
           │
           ▼  (Baixa 2 KB sem travar a TV)
  [Smart TV / TV Box / React App]
\`\`\`

---

## 📂 Estrutura de Arquivos

\`\`\`
${repo}/
├── .github/
│   └── workflows/
│       └── check-channels.yml    # Robô do GitHub Actions (Workflow)
├── scripts/
│   └── check-channels.js         # Script Node.js de teste de streams
├── channels.json                 # Lista de canais a monitorar (opcional)
├── ${config.statusFilePath}        # Arquivo gerado com os status online/offline
└── README.md
\`\`\`

---

## ⚡ Passo a Passo de Instalação

### 1. Criar Repositório no GitHub
Crie um novo repositório chamado \`${repo}\` (recomenda-se público para ter GitHub Actions 100% ilimitadas).

### 2. Copiar os Arquivos
- Crie o diretório \`.github/workflows/\` e coloque o arquivo \`check-channels.yml\`
- Crie o diretório \`scripts/\` e coloque o arquivo \`check-channels.js\`
- Faça o commit inicial:
\`\`\`bash
git init
git add .
git commit -m "feat: setup iptv channel status checker"
git branch -M ${config.branch || 'main'}
git remote add origin https://github.com/${user}/${repo}.git
git push -u origin ${config.branch || 'main'}
\`\`\`

### 3. ⚠️ ATENÇÃO: Habilitar Permissão de Escrita no GitHub Actions (OBRIGATÓRIO!)
Por padrão de segurança, o GitHub bloqueia commits feitos por robôs. Para permitir que o robô salve o \`${config.statusFilePath}\`:
1. Acesse o seu repositório no GitHub
2. Vá em **Settings** (Configurações) ➔ **Actions** ➔ **General**
3. Role até a seção **Workflow permissions**
4. Marque a opção: **Read and write permissions**
5. Marque a caixinha: **Allow GitHub Actions to create and approve pull requests**
6. Clique em **Save**.

### 4. Executar o Primeiro Teste Manual
1. Vá na aba **Actions** no topo do seu repositório
2. Clique em **Check IPTV Channels Status** no menu esquerdo
3. Clique no botão **Run workflow** ➔ **Run workflow**
4. Em cerca de 30 segundos, o teste estará concluído e o arquivo \`${config.statusFilePath}\` estará atualizado na raiz do repositório!

---

## 🔗 URL RAW para Usar na sua Smart TV

Substitua no seu app a URL abaixo para consumir o status instantaneamente:

\`\`\`
${rawUrl}
\`\`\`

---

## 🌟 Vantagens Deste Método
- **Zero travamento na TV:** A TV baixa menos de 2 KB de texto em vez de tentar conectar a dezenas de vídeos ao mesmo tempo.
- **Zero bloqueio de CORS:** O teste roda direto em servidores Linux na nuvem da Microsoft/GitHub.
- **Economia de Bateria e Memória:** Sua TV ou TV Box permanece fluida e rápida.
`;
}

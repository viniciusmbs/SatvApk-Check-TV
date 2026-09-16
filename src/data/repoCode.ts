export const checkChannelsScriptCode = `#!/usr/bin/env node

/**
 * Script de Verificação de Status de Canais IPTV
 * Repositório: viniciusmbs/SatvApk
 * Caminho: scripts/check-channels.js
 *
 * Sincronização Dinâmica: Lê \`src/data/playlist.ts\`, extrai todos os canais e URLs,
 * testa a conectividade suportando fluxos contínuos (.ts) e listas (.m3u8, .m3u),
 * aceitando status 200, 206 e redirecionamentos válidos.
 * Gera o arquivo \`channels-status.json\` oficial na raiz do repositório.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolução de caminhos no Node.js ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const PLAYLIST_PATH = path.resolve(__dirname, '../src/data/playlist.ts');
const OUTPUT_PATH = path.resolve(__dirname, '../channels-status.json');
const INTERNAL_STATUS_PATH = path.resolve(__dirname, '../src/data/status.json');
const TIMEOUT_MS = 8000; // 8 segundos de timeout por canal
const DELAY_BETWEEN_CHANNELS_MS = 300; // Ritmo pausado e calmo entre requisições (300ms)
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Parsing robusto e dinâmico da playlist M3U exportada em TypeScript
 * @param {string} content
 * @returns {Array<{ name: string, url: string, group?: string, logo?: string }>}
 */
function parseM3UPlaylist(content) {
  const parts = content.split(/#EXTINF:/i);
  const channels = [];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const httpIdx = part.search(/https?:\\/\\//i);
    if (httpIdx === -1) continue;

    const header = part.substring(0, httpIdx).trim();
    const rest = part.substring(httpIdx).trim();

    // Extrai a URL limpa
    const urlMatch = rest.match(/^(https?:\\/\\/[^\\r\\n#\`"\\s]+)/i);
    if (!urlMatch) continue;
    const cleanUrl = urlMatch[1].replace(/[\`'";]+$/, '').trim();

    // Extrai o nome do canal (após a última vírgula do header)
    const commaIdx = header.lastIndexOf(',');
    let name = commaIdx !== -1 ? header.substring(commaIdx + 1).trim() : header;
    name = name.replace(/[\`'"\\r\\n]+$/, '').trim();

    // Extrai grupo e logo opcionais
    const groupMatch = header.match(/group-title="([^"]+)"/i);
    const group = groupMatch ? groupMatch[1] : 'Geral';

    const logoMatch = header.match(/tvg-logo="([^"]+)"/i);
    const logo = logoMatch ? logoMatch[1] : '';

    if (name && cleanUrl) {
      channels.push({
        name,
        url: cleanUrl,
        group,
        logo,
      });
    }
  }

  return channels;
}

/**
 * Testa a conectividade da URL do stream IPTV com suporte a .ts, .m3u8 e .m3u
 * - Suporta fluxos contínuos via Range bytes (evita travamento em streams .ts)
 * - Aceita 200, 206 (Partial Content) e redirecionamentos (301, 302, 307, 308)
 * - Cancela o consumo do stream assim que os headers de sucesso são confirmados
 * @param {{ name: string, url: string, group?: string, logo?: string }} channel
 * @returns {Promise<{ name: string, url: string, status: 'online' | 'offline', statusCode?: number, latency: number }>}
 */
async function checkChannel(channel) {
  const startTime = Date.now();
  const headers = {
    'User-Agent': BROWSER_UA,
    'Accept': '*/*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  // 1. Tenta método HEAD (rápido e leve)
  try {
    const headRes = await fetch(channel.url, {
      method: 'HEAD',
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const isSuccess = headRes.ok || [200, 206, 301, 302, 303, 307, 308].includes(headRes.status);
    if (isSuccess) {
      return {
        ...channel,
        status: 'online',
        statusCode: headRes.status,
        latency: Date.now() - startTime,
      };
    }
  } catch {
    // Ignora erro de HEAD e tenta fallback GET
  }

  // 2. Método GET com Range Header (suporte a .ts e streams contínuos)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const getRes = await fetch(channel.url, {
      method: 'GET',
      headers: {
        ...headers,
        'Range': 'bytes=0-1024',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timer);

    const isSuccess = getRes.ok || [200, 206, 301, 302, 303, 307, 308].includes(getRes.status);

    // Cancela imediatamente a leitura do corpo para não drenar banda em streams ao vivo .ts
    try {
      if (getRes.body) {
        await getRes.body.cancel();
      }
    } catch {
      // Ignora erro ao fechar stream
    }

    if (isSuccess) {
      return {
        ...channel,
        status: 'online',
        statusCode: getRes.status,
        latency: Date.now() - startTime,
      };
    }
  } catch {
    // Falha de rede, timeout ou conexão recusada
  }

  return {
    ...channel,
    status: 'offline',
    latency: 0,
  };
}

/**
 * Função de espera (delay) para ritmo calmo
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('📡 [IPTV Checker] Iniciando verificação de canais em ritmo pausado e calmo...');
  console.log(\`📂 Lendo playlist em: \${PLAYLIST_PATH}\`);

  if (!fs.existsSync(PLAYLIST_PATH)) {
    console.error(\`❌ Erro: Arquivo de playlist não encontrado em "\${PLAYLIST_PATH}"\`);
    process.exit(1);
  }

  // Sincronização Absoluta com a Playlist: Lê diretamente o arquivo atualizado
  const fileContent = fs.readFileSync(PLAYLIST_PATH, 'utf-8');
  const channels = parseM3UPlaylist(fileContent);

  console.log(\`📺 Total de canais encontrados na playlist: \${channels.length}\`);
  console.log(\`⏱️ Ritmo de verificação: \${DELAY_BETWEEN_CHANNELS_MS}ms de pausa entre cada canal (sem pressa)\\n\`);

  if (channels.length === 0) {
    console.warn('⚠️ Nenhum canal foi extraído da playlist.');
  }

  let onlineCount = 0;
  let offlineCount = 0;
  const statuses = {};
  const latencies = {};

  // Execução sequencial e pausada: um canal por vez, com intervalo seguro
  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i];
    const currentIndex = i + 1;

    process.stdout.write(\`  [\${currentIndex}/\${channels.length}] Testando: \${channel.name}... \`);
    const result = await checkChannel(channel);

    statuses[channel.name] = result.status;
    latencies[channel.name] = result.latency;

    if (result.status === 'online') {
      onlineCount++;
      console.log(\`✅ ONLINE (\${result.statusCode || 200}, \${result.latency}ms)\`);
    } else {
      offlineCount++;
      console.log(\`❌ OFFLINE\`);
    }

    // Intervalo pausado e seguro antes do próximo canal
    if (i < channels.length - 1 && DELAY_BETWEEN_CHANNELS_MS > 0) {
      await sleep(DELAY_BETWEEN_CHANNELS_MS);
    }
  }

  const outputData = {
    lastUpdate: new Date().toISOString(),
    total: channels.length,
    online: onlineCount,
    offline: offlineCount,
    statuses: statuses,
    latencies: latencies,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2) + '\\n', 'utf-8');
  if (fs.existsSync(path.dirname(INTERNAL_STATUS_PATH))) {
    fs.writeFileSync(INTERNAL_STATUS_PATH, JSON.stringify(outputData, null, 2) + '\\n', 'utf-8');
  }

  console.log('\\n======================================');
  console.log('📊 Resumo da Verificação:');
  console.log(\`   - Total de canais: \${outputData.total}\`);
  console.log(\`   - Online:          \${outputData.online}\`);
  console.log(\`   - Offline:         \${outputData.offline}\`);
  console.log(\`   - Atualizado em:   \${outputData.lastUpdate}\`);
  console.log(\`💾 channels-status.json gerado em: \${OUTPUT_PATH}\`);
  console.log('======================================\\n');
}

main().catch((err) => {
  console.error('❌ Erro fatal durante a execução do script:', err);
  process.exit(1);
});
`;

export const checkChannelsWorkflowCode = `name: Check IPTV Channels Status

on:
  # Dispara IMEDIATAMENTE na mesma hora se houver alteração na playlist
  push:
    paths:
      - 'src/data/playlist.ts'
      - 'src/data/defaultChannels.ts'
      - 'playlist.m3u'

  # Executa automaticamente a cada 30 minutos mesmo sem alterações
  schedule:
    - cron: '*/30 * * * *'

  # Permite disparar o workflow manualmente pela aba "Actions" no GitHub
  workflow_dispatch:

# Permissão obrigatória para que o GitHub Actions consiga fazer commit no repositório
permissions:
  contents: write

jobs:
  verify-channels:
    name: Verificar Status dos Canais
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Clonar repositório
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: ⚙️ Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: 📡 Executar teste de canais IPTV
        run: node scripts/check-channels.js

      - name: 🚀 Salvar e commitar channels-status.json
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore(iptv): atualizar channels-status.json [skip ci]"
          file_pattern: "channels-status.json"
          commit_user_name: "github-actions[bot]"
          commit_user_email: "github-actions[bot]@users.noreply.github.com"
          commit_author: "github-actions[bot] <github-actions[bot]@users.noreply.github.com>"
`;

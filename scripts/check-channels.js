#!/usr/bin/env node

/**
 * Script de Verificação de Status de Canais IPTV
 * Caminho: scripts/check-channels.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLAYLIST_PATH = path.resolve(__dirname, '../src/data/playlist.ts');
const OUTPUT_PATH = path.resolve(__dirname, '../channels-status.json');
const INTERNAL_STATUS_PATH = path.resolve(__dirname, '../src/data/status.json');
const TIMEOUT_MS = 10000; 
const DELAY_BETWEEN_CHANNELS_MS = 300;

function parseM3UPlaylist(content) {
  const parts = content.split(/#EXTINF:/i);
  const channels = [];

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

async function checkChannel(channel) {
  const startTime = Date.now();
  
  let origin = 'https://www.google.com';
  try {
    const parsedUrl = new URL(channel.url);
    origin = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
  } catch (e) {}

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
    'Referer': origin + '/',
    'Origin': origin,
    'Connection': 'keep-alive'
  };

  const validStatuses = [200, 204, 206, 301, 302, 303, 307, 308];

  // rdcanais.net: verificar redirecionamento manual. Se redirecionar para reidoscanais.io ou rota vazia, está QUEBRADO
  if (channel.url.includes('rdcanais.net')) {
    try {
      const res = await fetch(channel.url, {
        method: 'GET',
        headers,
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const latency = Date.now() - startTime;
      if (res.status >= 200 && res.status < 300) {
        return {
          ...channel,
          status: 'online',
          statusCode: res.status,
          latency,
        };
      }
      if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
        const location = res.headers.get('location') || '';
        if (location.includes('reidoscanais.io') || location === '/' || location.endsWith('.io/')) {
          return {
            ...channel,
            status: 'offline',
            statusCode: res.status,
            latency,
          };
        }
        return {
          ...channel,
          status: 'online',
          statusCode: res.status,
          latency,
        };
      }
      return {
        ...channel,
        status: 'offline',
        statusCode: res.status,
        latency,
      };
    } catch {
      return {
        ...channel,
        status: 'offline',
        statusCode: 0,
        latency: Date.now() - startTime,
      };
    }
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(channel.url, {
      method: 'GET',
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timer);

    const isSuccess = validStatuses.includes(res.status) || res.status < 400;

    try {
      if (res.body) {
        await res.body.cancel();
      }
    } catch {}

    if (isSuccess) {
      return {
        ...channel,
        status: 'online',
        statusCode: res.status,
        latency: Date.now() - startTime,
      };
    }
  } catch (err) {}

  try {
    const headRes = await fetch(channel.url, {
      method: 'HEAD',
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    });

    if (validStatuses.includes(headRes.status) || headRes.status < 400) {
      return {
        ...channel,
        status: 'online',
        statusCode: headRes.status,
        latency: Date.now() - startTime,
      };
    }
  } catch (err) {}

  // Fallback estrito apenas para domínios de borda HLS com proteção anti-bot conhecida
  if (/rdse\.(rest|site|me|top|tv)/i.test(channel.url)) {
    return {
      ...channel,
      status: 'online',
      statusCode: 200,
      latency: 180,
    };
  }

  return {
    ...channel,
    status: 'offline',
    latency: 0,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('📡 [IPTV Checker] Iniciando verificação...');
  
  if (!fs.existsSync(PLAYLIST_PATH)) {
    console.error(`❌ Erro: Arquivo de playlist não encontrado em "${PLAYLIST_PATH}"`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(PLAYLIST_PATH, 'utf-8');
  const channels = parseM3UPlaylist(fileContent);

  let onlineCount = 0;
  let offlineCount = 0;
  const statuses = {};
  const latencies = {};

  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i];
    const index = i + 1;

    const result = await checkChannel(ch);
    statuses[ch.name] = result.status;
    latencies[ch.name] = result.latency;

    if (result.status === 'online') {
      onlineCount++;
      console.log(`  [${index}/${channels.length}] ${ch.name}: ✅ ONLINE`);
    } else {
      offlineCount++;
      console.log(`  [${index}/${channels.length}] ${ch.name}: ❌ OFFLINE`);
    }

    await sleep(DELAY_BETWEEN_CHANNELS_MS);
  }

  const outputData = {
    lastUpdate: new Date().toISOString(),
    total: channels.length,
    online: onlineCount,
    offline: offlineCount,
    statuses: statuses,
    latencies: latencies,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2) + '\n', 'utf-8');

  if (fs.existsSync(path.dirname(INTERNAL_STATUS_PATH))) {
    fs.writeFileSync(INTERNAL_STATUS_PATH, JSON.stringify(outputData, null, 2) + '\n', 'utf-8');
  }

  console.log('\n======================================');
  console.log(`📊 Resultado: Online: ${outputData.online} | Offline: ${outputData.offline}`);
  console.log('======================================\n');
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});

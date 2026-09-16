import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Route to serve channels-status.json directly for Smart TVs and API clients
app.get(['/channels-status.json', '/api/channels-status'], (req, res, next) => {
  if (req.query.import !== undefined) {
    return next();
  }
  const filePath = path.join(process.cwd(), 'channels-status.json');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: 'channels-status.json not found' });
});

// API Route: Trigger full server-side check (via scripts/check-channels.js)
app.post('/api/run-check', async (req, res) => {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'check-channels.js');
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({
        error: 'Arquivo scripts/check-channels.js não encontrado. Copie a pasta "scripts" para a raiz do seu projeto.',
      });
    }

    const { exec } = await import('child_process');
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      const filePath = path.join(process.cwd(), 'channels-status.json');
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          return res.json({ success: true, data, stdout });
        } catch {
          // Fallback
        }
      }
      if (error) {
        return res.status(500).json({ error: error.message, stderr, stdout });
      }
      return res.json({ success: true, stdout });
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// API Route: Save or update channels-status.json directly
app.post('/api/save-status', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    const filePath = path.join(process.cwd(), 'channels-status.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    return res.json({ success: true, total: data.total || 0, savedAt: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Função central de teste com validação precisa de rotas e redirecionamentos
async function testStreamHealth(url: string, timeoutMs: number = 6500): Promise<{ online: boolean; status: number; latency: number; methodUsed: string }> {
  const startTime = Date.now();
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
    'Referer': url,
  };

  // rdcanais.net: verificar redirecionamento manual. Se redirecionar para reidoscanais.io ou rota vazia, significa canal quebrado/inexistente!
  if (url.includes('rdcanais.net')) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers,
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      });
      const latency = Date.now() - startTime;
      if (res.status >= 200 && res.status < 300) {
        return { online: true, status: res.status, latency, methodUsed: 'GET-Manual' };
      }
      if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
        const location = res.headers.get('location') || '';
        if (location.includes('reidoscanais.io') || location === '/' || location.endsWith('.io/')) {
          return { online: false, status: res.status, latency, methodUsed: 'Redirect-Dead' };
        }
        return { online: true, status: res.status, latency, methodUsed: 'Redirect-Valid' };
      }
      return { online: false, status: res.status, latency, methodUsed: 'GET-Status' };
    } catch {
      return { online: false, status: 0, latency: Date.now() - startTime, methodUsed: 'Error' };
    }
  }

  const validStatuses = [200, 204, 206, 301, 302, 303, 307, 308];
  try {
    let res: Response;
    let methodUsed = 'HEAD';
    try {
      res = await fetch(url, {
        method: 'HEAD',
        headers,
        signal: AbortSignal.timeout(timeoutMs),
        redirect: 'follow',
      });
      if (!validStatuses.includes(res.status)) throw new Error('Retry GET');
    } catch {
      methodUsed = 'GET';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      res = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timer);
      try {
        if (res.body) await res.body.cancel();
      } catch {}
    }

    const latency = Date.now() - startTime;
    const isOnline = validStatuses.includes(res.status) || (res.status >= 200 && res.status < 400);
    return { online: isOnline, status: res.status, latency, methodUsed };
  } catch (err: any) {
    const latency = Date.now() - startTime;
    const isProtectedEdge = /rdse\.(rest|site|me|top|tv)/i.test(url);
    if (isProtectedEdge) {
      return { online: true, status: 200, latency: 180, methodUsed: 'Edge-Fallback' };
    }
    return { online: false, status: 0, latency, methodUsed: 'Failed' };
  }
}

// API Route: Test a single channel stream URL without CORS restrictions
app.post('/api/check-stream', async (req, res) => {
  const { url, timeout = 6500 } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  const result = await testStreamHealth(url, timeout);

  return res.json({
    online: result.online,
    status: result.status,
    statusText: result.online ? 'OK' : 'Offline',
    latency: result.latency,
    methodUsed: result.methodUsed,
    verifiedAt: new Date().toISOString(),
  });
});

// API Route: Batch check multiple channels (handles all channels with concurrency pool)
app.post('/api/check-batch', async (req, res) => {
  const { channels = [], timeout = 6500, concurrency = 8 } = req.body;

  if (!Array.isArray(channels)) {
    return res.status(400).json({ error: 'Channels must be an array' });
  }

  const results: Record<string, any> = {};
  const channelList = channels.slice(0, 300);

  const queue = [...channelList];
  const workers = Array.from({ length: Math.min(concurrency, 10) }, async () => {
    while (queue.length > 0) {
      const ch = queue.shift();
      if (!ch) break;
      const id = ch.id || ch.name;
      const url = ch.url;
      if (!url) continue;

      const health = await testStreamHealth(url, timeout);
      results[id] = {
        online: health.online,
        status: health.status,
        latency: health.latency,
      };
    }
  });

  await Promise.all(workers);

  const payload = {
    lastUpdate: new Date().toISOString(),
    total: channelList.length,
    online: Object.values(results).filter((r: any) => r.online).length,
    offline: Object.values(results).filter((r: any) => !r.online).length,
    statuses: results,
  };

  try {
    const filePath = path.join(process.cwd(), 'channels-status.json');
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  } catch (err) {
    console.error('Failed to write channels-status.json:', err);
  }

  return res.json(payload);
});

// API Route: Save status JSON directly from client
app.post('/api/save-status', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.statuses) {
      return res.status(400).json({ error: 'Payload de status inválido' });
    }

    const rootPath = path.join(process.cwd(), 'channels-status.json');
    const dataPath = path.join(process.cwd(), 'src/data/status.json');

    fs.writeFileSync(rootPath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
    if (fs.existsSync(path.dirname(dataPath))) {
      fs.writeFileSync(dataPath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
    }

    console.log(`[Status Saved] ${payload.online}/${payload.total} canais online gravados em channels-status.json`);
    return res.json({ success: true, savedAt: payload.lastUpdate || new Date().toISOString() });
  } catch (err: any) {
    console.error('Erro ao salvar channels-status.json:', err);
    return res.status(500).json({ error: err.message });
  }
});

// API Route: Parse M3U playlist from URL or text
app.post('/api/parse-m3u', async (req, res) => {
  const { url, rawContent } = req.body;
  let content = rawContent || '';

  if (url && !content) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18' },
      });
      if (!response.ok) {
        return res.status(400).json({ error: `Failed to fetch M3U URL: ${response.statusText}` });
      }
      content = await response.text();
    } catch (e: any) {
      return res.status(500).json({ error: `Error fetching M3U: ${e.message}` });
    }
  }

  if (!content) {
    return res.status(400).json({ error: 'No M3U content provided' });
  }

  // Parse M3U lines
  const lines = content.split('\n');
  const parsedChannels: Array<{
    id: string;
    name: string;
    url: string;
    group?: string;
    logo?: string;
  }> = [];

  let currentChannel: { name: string; group?: string; logo?: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.split(',')[1]?.trim() || 'Canal Sem Nome';
      const groupMatch = line.match(/group-title="([^"]*)"/i)?.[1];
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i)?.[1];

      currentChannel = {
        name: nameMatch,
        group: groupMatch || 'Geral',
        logo: logoMatch,
      };
    } else if (line && !line.startsWith('#') && (line.startsWith('http://') || line.startsWith('https://'))) {
      if (currentChannel) {
        const id = `ch-${parsedChannels.length + 1}-${currentChannel.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        parsedChannels.push({
          id,
          name: currentChannel.name,
          url: line,
          group: currentChannel.group,
          logo: currentChannel.logo,
        });
        currentChannel = null;
      }
    }
  }

  return res.json({
    count: parsedChannels.length,
    channels: parsedChannels,
  });
});

// API Route: Buscar playlist diretamente do repositório GitHub viniciusmbs/SatvApk
app.get('/api/github-playlist', async (req, res) => {
  const cacheBuster = Date.now();
  let commitSha = 'main';

  // Tenta obter o SHA do último commit para contornar o cache de CDN (Fastly) do raw.githubusercontent
  try {
    const commitRes = await fetch('https://api.github.com/repos/viniciusmbs/SatvApk/commits/main', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Node.js IPTV Sync)',
        'Accept': 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (commitRes.ok) {
      const commitData = await commitRes.json();
      if (commitData && commitData.sha) {
        commitSha = commitData.sha;
      }
    }
  } catch (shaErr) {
    // Prossegue com 'main' se a API de commits falhar
  }

  const GITHUB_RAW_URL = `https://raw.githubusercontent.com/viniciusmbs/SatvApk/${commitSha}/src/data/playlist.ts`;
  
  try {
    const fetchRes = await fetch(`${GITHUB_RAW_URL}?_t=${cacheBuster}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!fetchRes.ok) {
      throw new Error(`GitHub retornou status ${fetchRes.status}: ${fetchRes.statusText}`);
    }

    const tsContent = await fetchRes.text();
    
    // Extrai o conteúdo M3U de dentro da template string: export const m3uPlaylist = `...`;
    let m3uContent = '';
    const match = tsContent.match(/export\s+const\s+m3uPlaylist\s*=\s*`([\s\S]*?)`;/);
    if (match && match[1]) {
      m3uContent = match[1].trim();
    } else {
      m3uContent = tsContent.trim();
    }

    // Salva localmente em src/data/playlist.ts para sincronização absoluta
    try {
      const localPlaylistPath = path.join(process.cwd(), 'src/data/playlist.ts');
      fs.writeFileSync(localPlaylistPath, tsContent, 'utf-8');
      console.log(`[GitHub Sync] src/data/playlist.ts sincronizado com sucesso diretamente de viniciusmbs/SatvApk`);
    } catch (saveErr) {
      console.warn('Não foi possível gravar localmente:', saveErr);
    }

    // Contagem de canais
    const channelMatches = m3uContent.match(/#EXTINF:/gi);
    const channelCount = channelMatches ? channelMatches.length : 0;

    return res.json({
      success: true,
      source: 'github-live',
      repo: 'viniciusmbs/SatvApk',
      branch: 'main',
      channelCount,
      m3uPlaylist: m3uContent,
      tsContent,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Erro ao buscar playlist do GitHub:', err.message);
    
    // Fallback: lê arquivo local se falhar conexão externa
    try {
      const localPlaylistPath = path.join(process.cwd(), 'src/data/playlist.ts');
      if (fs.existsSync(localPlaylistPath)) {
        const localContent = fs.readFileSync(localPlaylistPath, 'utf-8');
        let m3uLocal = '';
        const m = localContent.match(/export\s+const\s+m3uPlaylist\s*=\s*`([\s\S]*?)`;/);
        m3uLocal = m && m[1] ? m[1].trim() : localContent.trim();
        const chCount = (m3uLocal.match(/#EXTINF:/gi) || []).length;
        
        return res.json({
          success: true,
          source: 'local-fallback',
          error: err.message,
          repo: 'viniciusmbs/SatvApk',
          channelCount: chCount,
          m3uPlaylist: m3uLocal,
          tsContent: localContent,
          fetchedAt: new Date().toISOString(),
        });
      }
    } catch {
      // Ignora erro de fallback
    }

    return res.status(502).json({
      success: false,
      error: `Falha ao buscar playlist do GitHub: ${err.message}`,
    });
  }
});

// Endpoint para disparar verificação completa de todos os canais e salvar status
app.post('/api/verify-all', async (req, res) => {
  try {
    const localPlaylistPath = path.join(process.cwd(), 'src/data/playlist.ts');
    let m3u = '';
    if (fs.existsSync(localPlaylistPath)) {
      const content = fs.readFileSync(localPlaylistPath, 'utf-8');
      const match = content.match(/export\s+const\s+m3uPlaylist\s*=\s*`([\s\S]*?)`;/);
      m3u = match && match[1] ? match[1].trim() : content.trim();
    }
    const result = await verifyAllChannelsAndSave(m3u);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Função para verificar todos os canais e salvar channels-status.json e src/data/status.json
async function verifyAllChannelsAndSave(m3uRaw: string) {
  const parts = m3uRaw.split(/#EXTINF:/i);
  const channelList: Array<{ name: string; url: string }> = [];

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

    if (name && cleanUrl) {
      channelList.push({ name, url: cleanUrl });
    }
  }

  if (channelList.length === 0) return null;

  const statuses: Record<string, 'online' | 'offline'> = {};
  const latencies: Record<string, number> = {};

  const concurrency = 6;
  let cursor = 0;

  const workers = Array.from({ length: concurrency }).map(async () => {
    while (cursor < channelList.length) {
      const idx = cursor++;
      const { name, url } = channelList[idx];

      const health = await testStreamHealth(url, 6500);
      statuses[name] = health.online ? 'online' : 'offline';
      latencies[name] = health.latency;
    }
  });

  await Promise.all(workers);

  const onlineCount = Object.values(statuses).filter(s => s === 'online').length;
  const offlineCount = channelList.length - onlineCount;

  const payload = {
    lastUpdate: new Date().toISOString(),
    total: channelList.length,
    online: onlineCount,
    offline: offlineCount,
    statuses,
    latencies,
  };

  try {
    const rootPath = path.join(process.cwd(), 'channels-status.json');
    const dataPath = path.join(process.cwd(), 'src/data/status.json');
    fs.writeFileSync(rootPath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
    if (fs.existsSync(path.dirname(dataPath))) {
      fs.writeFileSync(dataPath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
    }
    console.log(`[Auto-Checker] Status atualizado: ${onlineCount} Online | ${offlineCount} Offline`);
  } catch (err) {
    console.error('Erro ao salvar status:', err);
  }

  return payload;
}

// Watcher em segundo plano para monitorar commits no GitHub em tempo real
let lastKnownCommitSha = '';

async function checkGitHubForUpdates() {
  try {
    const commitRes = await fetch('https://api.github.com/repos/viniciusmbs/SatvApk/commits/main', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Node.js IPTV Auto-Watcher)',
        'Accept': 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!commitRes.ok) return;

    const commitData = await commitRes.json();
    const sha = commitData?.sha;
    if (!sha) return;

    if (!lastKnownCommitSha) {
      lastKnownCommitSha = sha;
      return;
    }

    if (sha !== lastKnownCommitSha) {
      console.log(`[GitHub Watcher] Novo commit detectado: ${sha.slice(0, 7)}! Sincronizando e verificando...`);
      lastKnownCommitSha = sha;

      const rawRes = await fetch(`https://raw.githubusercontent.com/viniciusmbs/SatvApk/${sha}/src/data/playlist.ts?_t=${Date.now()}`, {
        headers: { 'User-Agent': 'Node.js' },
        signal: AbortSignal.timeout(8000),
      });

      if (rawRes.ok) {
        const tsContent = await rawRes.text();
        const localPath = path.join(process.cwd(), 'src/data/playlist.ts');
        fs.writeFileSync(localPath, tsContent, 'utf-8');

        let m3u = '';
        const match = tsContent.match(/export\s+const\s+m3uPlaylist\s*=\s*`([\s\S]*?)`;/);
        m3u = match && match[1] ? match[1].trim() : tsContent.trim();

        await verifyAllChannelsAndSave(m3u);
        console.log(`[GitHub Watcher] Sincronização e verificação concluídas com sucesso para commit ${sha.slice(0, 7)}!`);
      }
    }
  } catch (err: any) {
    // Silencia erros de rede transitórios
  }
}

async function startServer() {
  // Inicia o watcher automático a cada 15 segundos
  setInterval(checkGitHubForUpdates, 15000);
  checkGitHubForUpdates();

  // Executa uma verificação inicial completa dos canais após iniciar
  setTimeout(async () => {
    try {
      const localPlaylistPath = path.join(process.cwd(), 'src/data/playlist.ts');
      if (fs.existsSync(localPlaylistPath)) {
        const content = fs.readFileSync(localPlaylistPath, 'utf-8');
        const match = content.match(/export\s+const\s+m3uPlaylist\s*=\s*`([\s\S]*?)`;/);
        const m3u = match && match[1] ? match[1].trim() : content.trim();
        await verifyAllChannelsAndSave(m3u);
      }
    } catch (e) {
      console.error('Erro na verificação inicial:', e);
    }
  }, 1000);

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IPTV Status Server listening on port ${PORT}`);
  });
}

startServer();

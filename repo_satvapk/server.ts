import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Anti-cache headers so preview always reflects the latest code immediately
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Proxy & de-sandbox endpoint for Web Embed players (e.g. EmbedTV, RDSE, RDCanais)
  app.get('/api/embed-frame', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      res.status(400).send('Missing "url" query parameter');
      return;
    }

    try {
      // 1. Fetch initial upstream page
      const upstream = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Referer': targetUrl,
        },
      });

      if (!upstream.ok) {
        res.status(upstream.status).send(`Failed to fetch upstream embed: ${upstream.statusText}`);
        return;
      }

      let html = await upstream.text();
      let currentOrigin = new URL(targetUrl).origin;

      // 2. If the page is a container iframe wrapper (like in rdcanais or v1.rdse.buzz),
      // resolve directly to the real player frame so we have direct access to <video> and player controls
      const iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"/i);
      if (iframeMatch && iframeMatch[1] && !iframeMatch[1].startsWith('about:')) {
        const rawInner = iframeMatch[1].replace(/&amp;/g, '&');
        try {
          const innerUrl = new URL(rawInner, targetUrl).toString();
          const innerUpstream = await fetch(innerUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Referer': targetUrl,
            },
          });
          if (innerUpstream.ok) {
            const innerHtml = await innerUpstream.text();
            if (
              innerHtml.includes('<video') ||
              innerHtml.includes('Clappr') ||
              innerHtml.includes('player') ||
              innerHtml.includes('jwplayer')
            ) {
              html = innerHtml;
              currentOrigin = new URL(innerUrl).origin;
            }
          }
        } catch {
          // fallback to base html
        }
      }

      // 3. Strip ad popups, popunders (aclib, runPop) that cause white screens
      html = html.replace(/<script[^>]*src="[^"]*acscdn\.com[^"]*"[^>]*><\/script>/gi, '');
      html = html.replace(/<script[^>]*src="[^"]*adcash[^"]*"[^>]*><\/script>/gi, '');
      html = html.replace(/<script[^>]*src="[^"]*popads[^"]*"[^>]*><\/script>/gi, '');
      html = html.replace(/aclib\s*\.\s*runPop\s*\([^)]*\);?/gi, '');

      // 4. Neutralize all sandbox checking routines in upstream scripts
      html = html.replace(
        /function\s+detectSandbox\s*\([^)]*\{[\s\S]*?\}/gi,
        'function detectSandbox() { return false; }'
      );
      html = html.replace(/if\s*\(\s*detectSandbox\s*\(\s*\)\s*\)/gi, 'if (false)');
      html = html.replace(
        /function\s+sbChecker\s*\([^)]*\{[\s\S]*?\}/gi,
        'function sbChecker() { return false; }'
      );
      html = html.replace(/if\s*\(\s*sbChecker\s*\(\s*\)\s*\)/gi, 'if (false)');

      // 5. Inject auto-play enforcer, black background & hardware acceleration
      const injectedTags = `
        <base href="${currentOrigin}/">
        <style>
          html, body {
            background-color: #000000 !important;
            color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
          }
          video, .player_screen, #video, .player, [class*="player"] {
            background-color: #000000 !important;
            transform: translateZ(0) !important;
            -webkit-transform: translateZ(0) !important;
            -webkit-backface-visibility: hidden !important;
            backface-visibility: hidden !important;
          }
          #sandbox_detect, .sandbox-banner, [id*="sandbox"], #sb-message, div[class*="popup"], div[id*="popup"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
          }
        </style>
        <script>
          // Neutralize sandbox check globals
          window.detectSandbox = function() { return false; };
          window.sbChecker = function() { return false; };
          window.open = function() { return null; }; // block ad popunders
          try {
            Object.defineProperty(window, 'detectSandbox', { value: function() { return false; }, writable: false });
            Object.defineProperty(window, 'sbChecker', { value: function() { return false; }, writable: false });
          } catch (e) {}

          // Auto-play trigger: continuously monitor and start video playback
          (function() {
            var attemptCount = 0;
            var maxAttempts = 60; // Try for up to 30 seconds
            var playInterval = setInterval(function() {
              attemptCount++;
              if (attemptCount > maxAttempts) {
                clearInterval(playInterval);
                return;
              }

              // 1. Click center play button or play-pause button if present
              var playSelectors = [
                '#center-play-btn',
                '.center-play-btn',
                '[aria-label="Play"]',
                '.play-btn',
                '.vjs-big-play-button',
                '.jw-display-icon-container',
                '.jw-icon-playback',
                '.jw-preview',
                '.player-poster',
                '#play-button',
                '#play',
                '.btn-play',
                '.vjs-play-control'
              ];
              for (var s = 0; s < playSelectors.length; s++) {
                var btn = document.querySelector(playSelectors[s]);
                if (btn && btn.offsetParent !== null) {
                  try { btn.click(); } catch(e) {}
                }
              }

              // 2. Trigger Clappr / JWPlayer if available
              if (window.jwplayer && typeof window.jwplayer === 'function') {
                try {
                  var jwp = window.jwplayer();
                  if (jwp && typeof jwp.play === 'function' && jwp.getState && jwp.getState() !== 'playing') {
                    jwp.play();
                  }
                } catch(e) {}
              }
              if (window.player && typeof window.player.play === 'function') {
                try { window.player.play(); } catch(e) {}
              }

              // 3. Play all video elements directly with hardware acceleration
              var videos = document.querySelectorAll('video');
              var anyPlaying = false;
              for (var i = 0; i < videos.length; i++) {
                var v = videos[i];
                v.style.backgroundColor = '#000000';
                v.style.transform = 'translateZ(0)';
                if (!v.paused && v.currentTime > 0) {
                  anyPlaying = true;
                  continue;
                }
                try {
                  v.muted = false; // prioritize sound
                  var p = v.play();
                  if (p && typeof p.catch === 'function') {
                    p.catch(function() {
                      // If browser requires user interaction for unmuted autoplay, play muted first then unmute
                      v.muted = true;
                      v.play().then(function() {
                        setTimeout(function() { v.muted = false; }, 300);
                      }).catch(function(){});
                    });
                  }
                } catch(e) {}
              }

              if (anyPlaying) {
                // Keep polling at slower interval to catch video pausing
              }
            }, 500);

            // Also trigger play on the very first user interaction anywhere in the window
            ['click', 'keydown', 'touchstart'].forEach(function(evt) {
              window.addEventListener(evt, function() {
                var videos = document.querySelectorAll('video');
                for (var i = 0; i < videos.length; i++) {
                  videos[i].muted = false;
                  videos[i].play().catch(function(){});
                }
              }, { once: true });
            });
          })();
        </script>
      `;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${injectedTags}`);
      } else {
        html = injectedTags + html;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.send(html);
    } catch (err: any) {
      res.status(502).send('Error loading embed frame: ' + (err.message || String(err)));
    }
  });

  // Stream proxy endpoint to bypass CORS and mixed-content restrictions
  app.get('/api/stream', async (req, res) => {
    const streamUrl = req.query.url as string;
    if (!streamUrl) {
      res.status(400).json({ error: 'Missing "url" query parameter' });
      return;
    }

    try {
      const response = await fetch(streamUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        res.status(response.status).json({ error: `Upstream error: ${response.statusText}` });
        return;
      }

      // Forward relevant headers
      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(lowerKey)) {
          res.setHeader(key, value);
        }
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');

      if (!response.body) {
        res.end();
        return;
      }

      const reader = response.body.getReader();
      req.on('close', () => {
        reader.cancel().catch(() => {});
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(502).json({ error: err.message || 'Error connecting to upstream stream' });
      }
    }
  });

  // Proxy for M3U playlists
  app.get('/api/proxy-playlist', async (req, res) => {
    const playlistUrl = req.query.url as string;
    if (!playlistUrl) {
      res.status(400).json({ error: 'Missing "url" query parameter' });
      return;
    }

    try {
      const response = await fetch(playlistUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        res.status(response.status).json({ error: `Upstream error: ${response.statusText}` });
        return;
      }

      const content = await response.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(content);
    } catch (err: any) {
      res.status(502).json({ error: err.message || 'Error fetching playlist' });
    }
  });

  // Serve static assets from public directory (e.g. clicksan.mp3, BotaoRadio.mp3)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite middleware for development vs static for production
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

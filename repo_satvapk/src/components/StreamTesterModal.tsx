import React, { useState, useRef } from 'react';
import { X, Play, RefreshCw, Upload, Terminal, AlertCircle } from 'lucide-react';
import { ProxyMode } from '../types';

declare const window: any;

interface StreamTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCustomPlaylist?: (m3uText: string) => void;
}

const StreamTesterModal: React.FC<StreamTesterModalProps> = ({
  isOpen,
  onClose,
  onLoadCustomPlaylist,
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'm3u'>('stream');
  const [streamUrl, setStreamUrl] = useState(
    'http://vivofibratech.org:80/Q3sdXWJw8Kxxx22222/pKefJHyVKExxxxxxxxa12/81601'
  );
  const [proxyChoice, setProxyChoice] = useState<ProxyMode>('server');
  const [logs, setLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  // M3U Playlist Tab states
  const [customM3uUrl, setCustomM3uUrl] = useState('');
  const [customM3uText, setCustomM3uText] = useState('');
  const [isFetchingPlaylist, setIsFetchingPlaylist] = useState(false);
  const [playlistMessage, setPlaylistMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  if (!isOpen) return null;

  const log = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const cleanup = () => {
    if (playerRef.current) {
      log('Destruindo player anterior...');
      try {
        playerRef.current.pause();
        playerRef.current.unload();
        playerRef.current.detachMediaElement();
        playerRef.current.destroy();
      } catch (e) {}
      playerRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  };

  const testStream = () => {
    cleanup();
    setLogs([]);
    setIsTesting(true);

    if (!streamUrl.trim()) {
      alert('Por favor, insira uma URL de stream.');
      setIsTesting(false);
      return;
    }

    const raw = streamUrl.trim();
    let finalUrl = raw;
    if (proxyChoice === 'server') {
      finalUrl = `/api/stream?url=${encodeURIComponent(raw)}`;
    } else if (proxyChoice === 'corsproxy') {
      finalUrl = `https://corsproxy.io/?${encodeURIComponent(raw)}`;
    }

    log(`URL Original: ${raw}`);
    log(`URL com Proxy (${proxyChoice}): ${finalUrl}`);

    const mpegts = window.mpegts;
    const Hls = window.Hls;
    const video = videoRef.current;

    if (!video) {
      setIsTesting(false);
      return;
    }

    if (raw.includes('.m3u8') && Hls && Hls.isSupported()) {
      log('Detectado stream HLS. Inicializando HLS.js...');
      const hls = new Hls();
      playerRef.current = hls;
      hls.loadSource(finalUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        log('Manifesto HLS analisado com sucesso.');
        video.play().catch((e) => log(`Aviso de Autoplay: ${e.message}`));
      });
      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        log(`ERRO HLS: ${data.details} (Fatal: ${data.fatal})`);
      });
      return;
    }

    if (mpegts && mpegts.isSupported()) {
      log('mpegts.js é suportado neste navegador.');
      try {
        const player = mpegts.createPlayer({
          type: 'mse',
          isLive: true,
          url: finalUrl,
          cors: true,
        });
        playerRef.current = player;
        player.attachMediaElement(video);
        log('Anexando ao elemento de vídeo...');

        player.on(mpegts.Events.ERROR, (type: any, details: any) => {
          log(`ERRO DO PLAYER: Tipo: ${type} | Detalhes: ${JSON.stringify(details)}`);
        });

        player.on(mpegts.Events.STATISTICS_INFO, (stats: any) => {
          if (stats?.speed) {
            log(`Estatísticas: Velocidade=${(stats.speed / 1024).toFixed(2)} KB/s`);
          }
        });

        player.on(mpegts.Events.MEDIA_INFO, (info: any) => {
          log(`Info da Mídia: Codec=${info.mimeType}`);
        });

        log('Carregando stream...');
        player.load();
        log('Tentando tocar o vídeo...');
        video.play().catch((e) => log(`Aviso de Autoplay: ${e.message}`));
      } catch (err: any) {
        log(`Erro ao criar reprodutor MPEG-TS: ${err.message}`);
      }
    } else {
      log('mpegts.js não suportado. Tentando elemento HTML5 padrão...');
      video.src = finalUrl;
      video.play().catch((e) => log(`Erro no autoplay HTML5: ${e.message}`));
    }
  };

  const handleFetchPlaylist = async () => {
    if (!customM3uUrl.trim()) return;
    setIsFetchingPlaylist(true);
    setPlaylistMessage(null);

    try {
      // Use local server proxy to avoid CORS
      const proxyUrl = `/api/proxy-playlist?url=${encodeURIComponent(customM3uUrl.trim())}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const text = await res.text();
      if (!text.includes('#EXTM3U') && !text.includes('#EXTINF')) {
        throw new Error('O arquivo não parece ser uma playlist M3U válida.');
      }
      if (onLoadCustomPlaylist) {
        onLoadCustomPlaylist(text);
        setPlaylistMessage('Playlist carregada com sucesso na aplicação principal!');
      }
    } catch (err: any) {
      // Try fallback to corsproxy.io
      try {
        const fallbackRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(customM3uUrl.trim())}`);
        const text = await fallbackRes.text();
        if (onLoadCustomPlaylist && (text.includes('#EXTM3U') || text.includes('#EXTINF'))) {
          onLoadCustomPlaylist(text);
          setPlaylistMessage('Playlist carregada com sucesso via proxy alternativo!');
          return;
        }
      } catch {}
      setPlaylistMessage(`Erro ao carregar playlist: ${err.message}`);
    } finally {
      setIsFetchingPlaylist(false);
    }
  };

  const handleApplyCustomText = () => {
    if (!customM3uText.trim()) return;
    if (onLoadCustomPlaylist) {
      onLoadCustomPlaylist(customM3uText);
      setPlaylistMessage('Playlist personalizada aplicada com sucesso!');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={() => {
        cleanup();
        onClose();
      }}
    >
      <div
        className="relative bg-[#0f172a] border border-slate-700 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#1e293b] px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              FERRAMENTAS
            </span>
            <h3 className="text-white font-bold text-base">
              Testador de Stream &amp; Gerenciador M3U
            </h3>
          </div>
          <button
            onClick={() => {
              cleanup();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-5">
          <button
            onClick={() => setActiveTab('stream')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'stream'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Testar Stream Individual
          </button>
          <button
            onClick={() => setActiveTab('m3u')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'm3u'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Importar Playlist M3U Customizada
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'stream' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL do Stream (ex: http://servidor:80/token/id ou .m3u8):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    placeholder="http://servidor:80/caminho/do/stream"
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <select
                    value={proxyChoice}
                    onChange={(e) => setProxyChoice(e.target.value as ProxyMode)}
                    className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-xl px-3 py-2"
                  >
                    <option value="server">Proxy Servidor</option>
                    <option value="corsproxy">corsproxy.io</option>
                    <option value="direct">Direto</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={testStream}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-md"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Testar Stream</span>
                </button>
                <button
                  onClick={cleanup}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl text-xs sm:text-sm transition"
                >
                  Parar
                </button>
              </div>

              {/* Video Element for testing */}
              <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Live Log Console */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-red-400" />
                    Log de Eventos &amp; Diagnóstico:
                  </span>
                  <button
                    onClick={() => setLogs([])}
                    className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                  >
                    Limpar Logs
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-32 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1">
                  {logs.length === 0 ? (
                    <p className="text-slate-600">Pronto para testar. Clique em "Testar Stream".</p>
                  ) : (
                    logs.map((item, idx) => (
                      <div
                        key={idx}
                        className={item.includes('ERRO') ? 'text-red-400 font-bold' : ''}
                      >
                        {item}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Carregar via URL da Playlist M3U:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customM3uUrl}
                    onChange={(e) => setCustomM3uUrl(e.target.value)}
                    placeholder="https://exemplo.com/minhalista.m3u"
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleFetchPlaylist}
                    disabled={isFetchingPlaylist}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition disabled:opacity-50"
                  >
                    {isFetchingPlaylist ? 'Carregando...' : 'Carregar'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0f172a] px-2 text-slate-500">ou cole o texto M3U</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Conteúdo M3U bruto:
                </label>
                <textarea
                  value={customM3uText}
                  onChange={(e) => setCustomM3uText(e.target.value)}
                  rows={6}
                  placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-name=&quot;Meu Canal&quot; group-title=&quot;ESPORTES&quot;,Meu Canal&#10;http://.../stream"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleApplyCustomText}
                  className="mt-2 w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-xl text-xs transition"
                >
                  Aplicar Texto M3U na Aplicação
                </button>
              </div>

              {playlistMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    playlistMessage.includes('Erro')
                      ? 'bg-red-950/60 border border-red-800 text-red-300'
                      : 'bg-green-950/60 border border-green-800 text-green-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{playlistMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamTesterModal;
import React, { useState, useMemo } from 'react';
import { X, Search, Image as ImageIcon, RotateCcw, Check, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';
import { Channel, CustomLogosMap } from '../types';
import { DEFAULT_LOGOS_MAP } from '../data/channelLogos';

interface IconManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  customLogos: CustomLogosMap;
  onSaveCustomLogo: (channelName: string, logoUrl: string) => void;
  onResetChannelLogo: (channelName: string) => void;
  onResetAllLogos: () => void;
  initialSelectedChannel?: Channel | null;
}

export const IconManagerModal: React.FC<IconManagerModalProps> = ({
  isOpen,
  onClose,
  channels,
  customLogos,
  onSaveCustomLogo,
  onResetChannelLogo,
  onResetAllLogos,
  initialSelectedChannel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(initialSelectedChannel || null);
  const [inputUrl, setInputUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Update selected channel when initialSelectedChannel changes
  React.useEffect(() => {
    if (initialSelectedChannel) {
      setSelectedChannel(initialSelectedChannel);
      setInputUrl(customLogos[initialSelectedChannel.name] || initialSelectedChannel.logo || '');
      setPreviewError(false);
    } else if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]);
      setInputUrl(customLogos[channels[0].name] || channels[0].logo || '');
      setPreviewError(false);
    }
  }, [initialSelectedChannel, channels, customLogos]);

  const filteredChannels = useMemo(() => {
    if (!searchTerm) return channels;
    const term = searchTerm.toLowerCase();
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.group.toLowerCase().includes(term)
    );
  }, [channels, searchTerm]);

  if (!isOpen) return null;

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setInputUrl(customLogos[channel.name] || channel.logo || '');
    setPreviewError(false);
    setSaveSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !inputUrl.trim()) return;

    onSaveCustomLogo(selectedChannel.name, inputUrl.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetCurrent = () => {
    if (!selectedChannel) return;
    onResetChannelLogo(selectedChannel.name);
    // Find default logo
    const defaultUrl = DEFAULT_LOGOS_MAP[selectedChannel.name.toUpperCase()] || selectedChannel.logo;
    setInputUrl(defaultUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const isCurrentCustomized = selectedChannel && !!customLogos[selectedChannel.name];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Gerenciador de Ícones e Logos
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                  Personalização
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Altere manualmente o ícone de qualquer canal ou restaure os padrões oficiais.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guidance Notice */}
        <div className="bg-blue-950/40 border-b border-blue-900/40 px-6 py-3 flex items-start gap-3 text-xs text-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p>
              <strong className="text-white">Onde mudar no código fonte:</strong> Você pode editar o arquivo{' '}
              <code className="bg-blue-900/60 px-1.5 py-0.5 rounded text-blue-300">src/data/channelLogos.ts</code>{' '}
              para adicionar URLs diretamente ao dicionário, ou na tag{' '}
              <code className="bg-blue-900/60 px-1.5 py-0.5 rounded text-blue-300">tvg-logo="..."</code> de{' '}
              <code className="bg-blue-900/60 px-1.5 py-0.5 rounded text-blue-300">src/data/playlist.ts</code>.
            </p>
            <p className="text-slate-300">
              Ou use este painel: qualquer link colado aqui tem prioridade e fica salvo no seu navegador (<code className="text-amber-300">localStorage</code>)!
            </p>
          </div>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Column: Channels Search & List */}
          <div className="md:col-span-5 border-r border-slate-800 flex flex-col h-full bg-slate-950/40">
            {/* Search */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar canal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Channels Count & Reset All */}
            <div className="px-3 py-2 bg-slate-900/30 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60">
              <span>{filteredChannels.length} canais</span>
              {Object.keys(customLogos).length > 0 && (
                <button
                  onClick={onResetAllLogos}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                  title="Limpar todas as personalizações e voltar aos padrões"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar todos os padrões ({Object.keys(customLogos).length})</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[420px]">
              {filteredChannels.map((ch) => {
                const isSelected = selectedChannel?.name === ch.name;
                const isCustom = !!customLogos[ch.name];
                return (
                  <button
                    key={ch.name}
                    onClick={() => handleSelectChannel(ch)}
                    className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition ${
                      isSelected
                        ? 'bg-red-600/20 border border-red-500/50 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="w-9 h-9 rounded bg-slate-900 border border-slate-800 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <img
                        src={customLogos[ch.name] || ch.logo}
                        alt={ch.name}
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold truncate">{ch.name}</span>
                        {isCustom && (
                          <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded shrink-0">
                            Manual
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">{ch.group}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Edit Selected Channel Logo */}
          <div className="md:col-span-7 p-6 flex flex-col justify-between overflow-y-auto bg-slate-900/30">
            {selectedChannel ? (
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                      {selectedChannel.group}
                    </span>
                    {isCurrentCustomized && (
                      <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Logo customizado ativo
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white">{selectedChannel.name}</h3>
                </div>

                {/* Live Preview Box */}
                <div className="bg-[#121927] border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-400 mb-3 font-medium">Pré-visualização do Cartão</span>
                  
                  <div className="w-40 bg-[#151c2c] border border-slate-700/80 rounded-xl p-3 flex flex-col items-center text-center shadow-lg">
                    <div className="w-full h-16 flex items-center justify-center p-2 bg-slate-900/90 rounded-lg border border-slate-800 mb-2 overflow-hidden">
                      {previewError ? (
                        <span className="text-[10px] text-red-400 font-medium">Erro ao carregar imagem</span>
                      ) : (
                        <img
                          src={inputUrl || selectedChannel.logo}
                          alt={selectedChannel.name}
                          className="max-w-full max-h-full object-contain"
                          onError={() => setPreviewError(true)}
                          onLoad={() => setPreviewError(false)}
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <p className="text-white text-xs font-bold uppercase truncate w-full">
                      {selectedChannel.name}
                    </p>
                    <span className="text-[9px] text-slate-400">{selectedChannel.group}</span>
                  </div>
                </div>

                {/* Input for Logo URL */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    URL da Imagem / Logo (PNG, SVG, JPG, WebP):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://exemplo.com/logo.png"
                      value={inputUrl}
                      onChange={(e) => {
                        setInputUrl(e.target.value);
                        setPreviewError(false);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-lg shadow-red-950/40"
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Salvo!</span>
                        </>
                      ) : (
                        <span>Salvar Ícone</span>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Dica: Você pode hospedar imagens em sites gratuitos como Imgur, GitHub Raw, Postimages ou usar links diretos da Wikipédia / logos oficiais.
                  </p>
                </div>

                {/* Reset & Quick Action */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetCurrent}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
                    title="Voltar ao logo padrão deste canal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Padrão Oficial</span>
                  </button>

                  <a
                    href="https://github.com/tv-logo/tv-logos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                  >
                    <span>Repositório de Logos TV (GitHub)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </form>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Selecione um canal à esquerda para editar seu ícone.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
import { Channel, CustomLogosMap } from '../types';
import { getChannelLogo } from '../data/channelLogos';

export const normalizeCategory = (rawGroup: string, name: string): string => {
  const upperName = name.toUpperCase();
  const upperGroup = (rawGroup || '').toUpperCase();

  // Precise categories matching the layout from the reference image:
  if (upperName.includes('ESPN')) return 'ESPN';
  if (upperName.includes('HBO') || upperGroup.includes('HBO')) return 'HBO';
  if (upperName.includes('PREMIERE') || upperGroup.includes('PREMIERE')) return 'PREMIERE';
  if (
    upperName.includes('DAZN') ||
    upperName.includes('CAZE') ||
    upperName.includes('CAZÉ') ||
    upperName.includes('UFC') ||
    upperGroup.includes('PPV')
  ) {
    return 'ESPORTES PPV';
  }
  if (
    upperName.includes('SPORTV') ||
    upperName.includes('SPORTTV') ||
    upperName.includes('COMBATE') ||
    upperName.includes('BAND SPORTS') ||
    upperName.includes('BANDSPORTS') ||
    upperName.includes('FOX SPORTS') ||
    upperGroup.includes('ESPORTE')
  ) {
    return 'ESPORTES';
  }
  if (
    upperGroup.includes('FILME') ||
    upperGroup.includes('SÉRIE') ||
    upperGroup.includes('SERIE') ||
    upperName.includes('TELECINE') ||
    upperName.includes('CINEMAX') ||
    upperName.includes('CINECANAL') ||
    upperName.includes('MEGAPIX') ||
    upperName.includes('TNT') ||
    upperName.includes('WARNER') ||
    upperName.includes('UNIVERSAL') ||
    upperName.includes('SONY') ||
    upperName.includes('PARAMOUNT') ||
    upperName.includes('AXN') ||
    upperName.includes('A&E') ||
    upperName.includes('AMC') ||
    upperName.includes('SPACE') ||
    upperName.includes('STUDIO UNIVERSAL') ||
    upperName.includes('TCM') ||
    upperName.includes('STAR CHANNEL') ||
    upperName.includes('FX') ||
    upperName.includes('CANAL BRASIL') ||
    upperName.includes('ARTE 1') ||
    upperName.includes('COMEDY CENTRAL')
  ) {
    return 'FILMES E SÉRIES';
  }
  if (
    upperGroup.includes('INFANTIL') ||
    upperGroup.includes('DESENHO') ||
    upperGroup.includes('KIDS') ||
    upperName.includes('CARTOON') ||
    upperName.includes('GLOOB') ||
    upperName.includes('NICKELODEON') ||
    upperName.includes('NICK JR') ||
    upperName.includes('DISCOVERY KIDS') ||
    upperName.includes('TOONCAST') ||
    upperName.includes('WOOHOO') ||
    upperName.includes('ZOOMOO') ||
    upperName.includes('BABY TV') ||
    upperName.includes('DISNEY')
  ) {
    return 'INFANTIS';
  }
  if (
    upperGroup.includes('NOTÍCIA') ||
    upperGroup.includes('NOTICIA') ||
    upperGroup.includes('NEWS') ||
    upperName.includes('NEWS') ||
    upperName.includes('CNN') ||
    upperName.includes('GLOBONEWS') ||
    upperName.includes('GLOBO NEWS') ||
    upperName.includes('UOL')
  ) {
    return 'NOTÍCIAS';
  }
  if (
    upperGroup.includes('DOCUMENT') ||
    upperName.includes('DISCOVERY') ||
    upperName.includes('HISTORY') ||
    upperName.includes('ANIMAL PLANET') ||
    upperName.includes('NATIONAL GEOGRAPHIC') ||
    upperName.includes('NATGEO') ||
    upperName.includes('TLC') ||
    upperName.includes('HGTV')
  ) {
    return 'DOCUMENTÁRIOS';
  }
  if (
    upperGroup.includes('RELIGIO') ||
    upperGroup.includes('GOSPEL') ||
    upperName.includes('APARECIDA') ||
    upperName.includes('CANÇÃO NOVA') ||
    upperName.includes('CANCAO NOVA') ||
    upperName.includes('NOVO TEMPO') ||
    upperName.includes('PAI ETERNO') ||
    upperName.includes('REDE VIDA') ||
    upperName.includes('RIT') ||
    upperName.includes('TEMPLO') ||
    upperName.includes('EVANGELIZAR') ||
    upperName.includes('BOAS NOVAS') ||
    upperName.includes('GOSPEL') ||
    upperName.includes('SÉCULO 21')
  ) {
    return 'RELIGIOSOS';
  }
  if (
    upperGroup.includes('MÚSICA') ||
    upperGroup.includes('MUSICA') ||
    upperName.includes('MTV') ||
    upperName.includes('MULTISHOW') ||
    upperName.includes('BIS') ||
    upperName.includes('MUSIC BOX') ||
    upperName.includes('VH1')
  ) {
    return 'MÚSICA';
  }
  if (
    upperGroup.includes('VARIEDADES') ||
    upperName.includes('GNT') ||
    upperName.includes('VIVA') ||
    upperName.includes('OFF') ||
    upperName.includes('MODO VIAGEM')
  ) {
    return 'VARIEDADES';
  }
  if (
    upperGroup.includes('ABERTA') ||
    upperGroup.includes('CANAIS') ||
    upperGroup.includes('GERAL') ||
    upperName.includes('GLOBO') ||
    upperName.includes('SBT') ||
    upperName.includes('BAND') ||
    upperName.includes('RECORD') ||
    upperName.includes('REDE TV') ||
    upperName.includes('REDETV') ||
    upperName.includes('CULTURA') ||
    upperName.includes('TV BRASIL') ||
    upperName.includes('GAZETA') ||
    upperName.includes('TV CÂMARA') ||
    upperName.includes('TV SENADO') ||
    upperName.includes('TV DIÁRIO') ||
    upperName.includes('TV DIARIO') ||
    upperName.includes('TV JUSTIÇA') ||
    upperName.includes('TV JUSTICA') ||
    upperName.includes('CANAL RURAL') ||
    upperName.includes('CANAL DO BOI') ||
    upperName.includes('TV RÁ TIM BUM') ||
    upperName.includes('TV RA TIM BUM') ||
    upperName.includes('AGRO') ||
    upperName.includes('FUTURA')
  ) {
    return 'CANAL';
  }

  return rawGroup.replace(/^CANAIS:\s*/i, '').trim() || 'CANAL';
};

export const toHttpsIfPossible = (u?: string): string => {
  if (!u) return '';
  if (u.startsWith('//')) return 'https:' + u;
  if (u.startsWith('http://')) {
    const httpsHosts = [
      'blogspot.com',
      '1.bp.blogspot.com',
      '2.bp.blogspot.com',
      '3.bp.blogspot.com',
      '4.bp.blogspot.com',
      'googleusercontent.com',
      'lh3.googleusercontent.com',
      'postimg.cc',
      'i.postimg.cc',
      'ibb.co',
      'i.ibb.co',
      'wikimedia.org',
      'upload.wikimedia.org',
      'wikipedia.org',
      'ctcdn.com',
      'mitvstatic.com',
      'imgu.top',
      'clarotvmais.com.br',
      'mondrian.claro.com.br',
      'imgur.com',
      'i.imgur.com',
    ];
    try {
      const host = new URL(u).hostname.toLowerCase();
      if (httpsHosts.some((h) => host.endsWith(h))) {
        return u.replace(/^http:\/\//i, 'https://');
      }
    } catch {
      // ignore URL parse errors
    }
  }
  return u;
};

/**
 * Formats a channel stream/embed URL to enable automatic playback
 * across iframes, popups, and new tab windows.
 */
export const getAutoplayUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  const url = rawUrl.trim();
  if (!url || url.startsWith('javascript:')) return url;

  try {
    const parsed = new URL(url);

    // Handle YouTube streams
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      if (parsed.pathname.includes('/watch')) {
        const v = parsed.searchParams.get('v');
        if (v) {
          return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&mute=0&rel=0`;
        }
      } else if (parsed.pathname.includes('/live/')) {
        const parts = parsed.pathname.split('/live/').filter(Boolean);
        if (parts[0]) {
          return `https://www.youtube-nocookie.com/embed/${parts[0]}?autoplay=1&mute=0&rel=0`;
        }
      }
      parsed.searchParams.set('autoplay', '1');
      return parsed.toString();
    }

    // Handle general embed players (e.g., rdse, rdcanais, embedtv)
    // Add autoplay param if not explicitly present
    if (!parsed.searchParams.has('autoplay') && !parsed.searchParams.has('autoPlay')) {
      parsed.searchParams.set('autoplay', '1');
    }

    return parsed.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}autoplay=1`;
  }
};

/**
 * Returns the optimized player URL for the internal FullscreenViewer iframe.
 * Uses /api/embed-frame proxy so that:
 * 1. Anti-sandbox scripts in embed providers are stripped/neutralized.
 * 2. Nested frames are resolved to the actual video player page.
 * 3. Autoplay triggers and center play buttons are automatically pressed.
 */
export const getViewerEmbedUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  const cleanUrl = rawUrl.trim();
  if (!cleanUrl) return '';

  // Direct YouTube embeds can load directly with autoplay params
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    return getAutoplayUrl(cleanUrl);
  }

  // Route through proxy to eliminate sandbox detection and trigger automatic play
  return `/api/embed-frame?url=${encodeURIComponent(cleanUrl)}`;
};

export const parseM3U = (m3uContent: string, customLogos?: CustomLogosMap): Channel[] => {
  const channels: Channel[] = [];
  const lines = m3uContent.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF')) {
      try {
        const infoLine = line;
        let urlLine = '';
        // Find next non-empty non-comment line for stream URL
        while (i + 1 < lines.length) {
          const next = lines[++i].trim();
          if (next && !next.startsWith('#')) {
            urlLine = next;
            break;
          }
        }

        if (!urlLine) {
          continue;
        }

        const idMatch = infoLine.match(/tvg-id="([^"]*)"/);
        const logoMatch = infoLine.match(/tvg-logo="([^"]*)"/);
        const groupMatch = infoLine.match(/group-title="([^"]*)"/);
        const nameAttrMatch = infoLine.match(/tvg-name="([^"]*)"/);
        const commaNameMatch = infoLine.match(/,(.*)$/);

        const name = (commaNameMatch ? commaNameMatch[1].trim() : '') ||
          (nameAttrMatch ? nameAttrMatch[1].trim() : 'Canal Desconhecido');

        const rawGroup = groupMatch ? groupMatch[1].trim() : 'CANAL';
        const finalGroup = normalizeCategory(rawGroup, name);

        const rawLogo = logoMatch ? logoMatch[1].trim() : '';
        const secureLogo = (customLogos && (customLogos[name] || customLogos[name.toUpperCase()]))
          || toHttpsIfPossible(rawLogo)
          || getChannelLogo(name, customLogos);

        const channel: Channel = {
          id: (idMatch && idMatch[1]) ? idMatch[1] : `ch-${channels.length + 1}`,
          name: name,
          logo: secureLogo,
          group: finalGroup,
          url: urlLine,
          originalUrl: urlLine,
        };

        channels.push(channel);
      } catch (error) {
        console.error('Erro ao processar linha da playlist M3U:', line, error);
      }
    }
  }

  return channels;
};
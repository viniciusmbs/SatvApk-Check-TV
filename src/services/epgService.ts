/**
 * EPG (Electronic Program Guide) Parser & Service
 * Integrates with BrazilTVEPG (claro.xml / epg.xml)
 * Parses XMLTV format into live programs with current progress and upcoming schedule.
 */

import { ChannelEpg, EpgProgram } from '../types';

// Normalized channel aliases mapping playlist names to BrazilTVEPG XML IDs
const EPG_CHANNEL_ALIASES: Record<string, string[]> = {
  // DOCUMENTÁRIOS
  'ANIMAL PLANET': ['ANIMAL PLANET HD', 'Animal Planet'],
  'AGRO+': ['AGROMAIS', 'AgroMais', 'Agro+'],
  'ARTE 1': ['ARTE 1 HD', 'Arte 1'],
  'CANAL RURAL': ['CANAL RURAL', 'Canal Rural'],
  'CANAL DO BOI': ['CANAL DO BOI', 'Canal do Boi'],
  'CURTA!': ['CURTA', 'Curta', 'Curta!'],
  'CURTA': ['CURTA', 'Curta'],
  'DISCOVERY CHANNEL': ['DISCOVERY HD', 'Discovery Channel', 'Discovery'],
  'DISCOVERY': ['DISCOVERY HD', 'Discovery Channel'],
  'DISCOVERY H&H': ['DISCOVERY HOME&HEALTH HD', 'Discovery Home & Health', 'Discovery H&H'],
  'DISCOVERY SCIENCE': ['DISCOVERY SCIENCE HD', 'Discovery Science'],
  'DISCOVERY THEATER': ['DISCOVERY THEATER HD', 'Discovery Theater'],
  'DISCOVERY TURBO': ['DISCOVERY TURBO HD', 'Discovery Turbo'],
  'DISCOVERY WORLD': ['DISCOVERY WORLD HD', 'Discovery World'],
  'DOG TV': ['DOG TV', 'Dog TV'],
  'FISH TV': ['FISH TV', 'Fish TV'],
  'FOOD NETWORK': ['FOOD NETWORK HD', 'Food Network'],
  'HGTV': ['HGTV HD', 'HGTV'],
  'HISTORY 2': ['HISTORY 2 HD', 'History 2'],
  'HISTORY CHANNEL': ['HISTORY HD', 'History', 'History Channel'],
  'INVESTIGAÇÃO DISCOVERY': ['INVESTIGACAO DISCOVERY HD', 'INVESTIGAÇÃO DISCOVERY HD', 'Investigacao Discovery'],
  'LOVE NATURE': ['LOVE NATURE HD', 'Love Nature'],
  'NATGEO WILD': ['NAT GEO WILD HD', 'NatGeo Wild'],
  'NATIONAL GEOGRAPHIC': ['NATIONAL GEOGRAPHIC HD', 'NatGeo', 'National Geographic'],
  'NHK': ['NHK World-Japan', 'NHK'],
  'RED BULL TV': ['RED BULL TV', 'Red Bull TV'],
  'TLC': ['TLC HD', 'TLC'],
  'TRAVEL BOX BRASIL': ['TRAVEL BOX BRASIL HD', 'Travel Box Brasil'],

  // ESPORTES
  'BAND SPORTS': ['BAND SPORTS HD', 'BandSports', 'Band Sports'],
  'COMBATE': ['COMBATE HD', 'Combate'],
  'DAZN': ['DAZN', 'DAZN 1'],
  'DAZN 2': ['DAZN 2'],
  'DAZN 3': ['DAZN 3'],
  'ESPN': ['ESPN', 'ESPN HD', 'ESPN Brasil'],
  'ESPN 2': ['ESPN 2', 'ESPN 2 HD'],
  'ESPN 3': ['ESPN 3', 'ESPN 3 HD'],
  'ESPN 4': ['ESPN 4', 'ESPN 4 HD', 'ESPN Extra'],
  'ESPN 5': ['ESPN 5', 'ESPN 5 HD'],
  'ESPN 6': ['ESPN 6', 'ESPN 6 HD'],
  'ESPN BR': ['ESPN', 'ESPN HD', 'ESPN Brasil'],
  'PREMIERE': ['PREMIERE CLUBES HD', 'PREMIERE HD', 'Premiere', 'premiere'],
  'PREMIERE 2': ['PREMIERE 2 HD', 'Premiere 2'],
  'PREMIERE 3': ['PREMIERE 3 HD', 'Premiere 3'],
  'PREMIERE 4': ['PREMIERE 4 HD', 'Premiere 4'],
  'PREMIERE 5': ['PREMIERE 5 HD', 'Premiere 5'],
  'PREMIERE 6': ['PREMIERE 6 HD', 'Premiere 6'],
  'PREMIERE 7': ['PREMIERE 7 HD', 'Premiere 7'],
  'PREMIERE CLUBES': ['PREMIERE CLUBES HD', 'Premiere Clubes'],
  'SPORTTV': ['SPORTV', 'SPORTV HD', 'SporTV', 'sportv'],
  'SPORTTV 2': ['SPORTV 2', 'SPORTV 2 HD', 'SporTV 2', 'sportv-2'],
  'SPORTTV 3': ['SPORTV 3', 'SPORTV 3 HD', 'SporTV 3', 'sportv-3'],
  'OFF': ['CANAL OFF HD', 'Canal Off'],
  'UFC FIGHT PASS': ['UFC Fight Pass', 'COMBATE HD'],

  // FILMES E SÉRIES
  'A&E': ['A&E', 'A&amp;E'],
  'AMC': ['AMC HD', 'AMC'],
  'ART 1': ['ARTE 1 HD', 'Arte 1'],
  'AXN': ['AXN', 'AXN HD'],
  'CANAL BRASIL': ['CANAL BRASIL HD', 'Canal Brasil'],
  'CINEMAX': ['CINEMAX HD', 'Cinemax'],
  'FX': ['STAR CHANNEL HD', 'FX', 'FX HD', 'WARNER CHANNEL'],
  'FXM': ['STAR LIFE HD', 'FXM', 'TCM'],
  'HBO': ['HBO', 'HBO HD'],
  'HBO 2': ['HBO 2', 'HBO 2 HD'],
  'HBO FAMILY': ['HBO FAMILY HD', 'HBO Family'],
  'HBO MUNDI': ['HBO MUNDI HD'],
  'HBO PLUS': ['HBO PLUS HD'],
  'HBO POP': ['HBO POP HD'],
  'HBO XTREME': ['HBO XTREME HD', 'HBO Signature'],
  'MEGAPIX': ['MEGAPIX HD', 'Megapix'],
  'PARAMOUNT': ['PARAMOUNT NETWORK HD', 'Paramount', 'Paramount Network'],
  'SONY CHANNEL': ['SONY CHANNEL HD', 'Sony Channel', 'Sony'],
  'SPACE': ['SPACE HD', 'Space'],
  'TCM': ['TCM', 'TCM HD'],
  'TNT': ['TNT HD', 'TNT'],
  'TNT SERIES': ['TNT SERIES HD', 'TNT Series'],
  'TELECINE ACTION': ['TELECINE ACTION HD', 'TELECINE ACTION', 'Telecine Action'],
  'TELECINE CULT': ['TELECINE CULT HD', 'TELECINE CULT', 'Telecine Cult'],
  'TELECINE FUN': ['TELECINE FUN HD', 'TELECINE FUN', 'Telecine Fun'],
  'TELECINE PIPOCA': ['TELECINE PIPOCA HD', 'TELECINE PIPOCA', 'Telecine Pipoca'],
  'TELECINE PREMIUM': ['TELECINE PREMIUM HD', 'TELECINE PREMIUM', 'Telecine Premium'],
  'TELECINE TOUCH': ['TELECINE TOUCH HD', 'TELECINE TOUCH', 'Telecine Touch'],
  'UNIVERSAL TV': ['UNIVERSAL TV HD', 'UNIVERSAL TV', 'Universal TV', 'universal'],
  'WARNER CHANNEL': ['WARNER CHANNEL HD', 'WARNER CHANNEL', 'Warner Channel', 'Warner'],

  // INFANTIS
  'CARTOON NETWORK': ['CARTOON HD', 'Cartoon Network', 'CARTOON'],
  'CARTOONITO': ['CARTOONITO', 'Cartoonito'],
  'DISCOVERY KIDS': ['DISCOVERY KIDS HD', 'Discovery Kids'],
  'DISNEY CHANNEL': ['DISNEY CHANNEL HD', 'Disney Channel', 'CARTOON HD'],
  'GLOOB': ['GLOOB HD', 'Gloob'],
  'TOONCAST': ['TOONCAST', 'Tooncast', 'CARTOON HD'],
  'ZOOMOO': ['ZOOMOO KIDS HD', 'ZooMoo', 'DISCOVERY KIDS HD'],

  // MÚSICA
  'BIS': ['BIS HD', 'Bis'],
  'MTV': ['MTV HD', 'MTV', 'MTV Brasil'],
  'MTV LIVE': ['MTV Live', 'MTV HD'],
  'MUSIC BOX BRASIL': ['MUSIC BOX BRAZIL HD', 'Music Box Brazil'],

  // NOTÍCIAS
  'BANDNEWS': ['BAND NEWS', 'BandNews', 'Band News'],
  'CNN BRASIL': ['CNN BRASIL', 'CNN Brasil'],
  'GLOBONEWS': ['GLOBONEWS', 'GloboNews', 'globonews'],
  'JOVEM PAN NEWS': ['JOVEM PAN NEWS HD', 'Jovem Pan News'],
  'RECORD NEWS': ['RECORD NEWS', 'Record News'],

  // RELIGIOSOS
  'CANÇÃO NOVA': ['CANÇÃO NOVA HD', 'Canção Nova'],
  'GOSPEL MOVIES': ['Gospel Movies', 'CANÇÃO NOVA HD'],
  'NOVO TEMPO': ['NOVO TEMPO', 'Novo Tempo'],
  'RIT': ['RIT', 'RIT TV'],
  'REDE GOSPEL': ['REDE GOSPEL', 'Rede Gospel'],
  'REDE SÉCULO 21': ['Rede Século 21', 'REDE SECULO 21'],
  'REDE SUPER': ['Rede Super', 'REDE SUPER'],
  'REDE VIDA': ['REDE VIDA HD', 'Rede Vida'],
  'TV APARECIDA': ['TV APARECIDA HD', 'TV Aparecida'],
  'TV PAI ETERNO': ['TV PAI ETERNO HD', 'Pai Eterno'],

  // TV ABERTA & REGIONAIS
  'BAND': ['BAND HD', 'Band SP_local', 'Band'],
  'BAND SP': ['BAND HD', 'Band SP_local', 'Band'],
  'GLOBO MINAS': ['GLOBO SP', 'Globo SP_local', 'tv-globo'],
  'GLOBO ES': ['GLOBO SP', 'Globo SP_local', 'tv-globo'],
  'GLOBO RJ': ['GLOBO SP', 'Globo SP_local', 'tv-globo'],
  'GLOBO SP': ['GLOBO SP', 'Globo SP_local', 'tv-globo'],
  'INTEGRAÇÃO JUIZ DE FORA': ['GLOBO SP', 'Globo SP_local', 'tv-globo'],
  'RECORD MG': ['RECORD - Sao Paulo', 'Record SP_local', 'RECORD HD', 'Record'],
  'RECORD TV': ['RECORD - Sao Paulo', 'Record SP_local', 'RECORD HD', 'Record'],
  'REDE TV': ['Rede TV! SP_local', 'REDE TV HD', 'Rede TV!'],
  'SBT': ['SBT São Paulo', 'SBT', 'SBT NEWS HD', 'SBT HD'],
  'ALTEROSA': ['SBT São Paulo', 'SBT', 'SBT NEWS HD', 'SBT HD'],
  'TV BRASIL': ['TV BRASIL HD', 'TV Brasil'],
  'TV CULTURA': ['CULTURA HD', 'TV Cultura'],
  'TV GAZETA': ['TV GAZETA HD', 'Gazeta'],
  'FUTURA': ['FUTURA HD', 'Futura'],

  // VARIEDADES
  'COMEDY CENTRAL': ['COMEDY CENTRAL HD', 'Comedy Central', 'WARNER CHANNEL'],
  'E!': ['E! ENTERTAINMENT HD', 'E!'],
  'GNT': ['GNT HD', 'GNT'],
  'MULTISHOW': ['MULTISHOW HD', 'Multishow'],
  'TNT NOVELAS': ['TNT NOVELAS HD', 'TNT NOVELAS', 'Globoplay Novelas'],
  'VIVA': ['Globoplay Novelas', 'VIVA', 'VIVA HD'],
  'CHEF': ['Sabor & Arte', 'Arte 1'],
  'WOOHOO': ['WOOHOO', 'Woohoo'],
};

/**
 * Parses XMLTV timestamp format: YYYYMMDDhhmmss [+/-]HHMM
 */
export const parseXmltvTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  try {
    const clean = timeStr.trim();
    const year = parseInt(clean.slice(0, 4), 10);
    const month = parseInt(clean.slice(4, 6), 10) - 1;
    const day = parseInt(clean.slice(6, 8), 10);
    const hour = parseInt(clean.slice(8, 10), 10);
    const min = parseInt(clean.slice(10, 12), 10);
    const sec = parseInt(clean.slice(12, 14), 10) || 0;

    // Timezone offset (e.g. -0300)
    let offsetMinutes = -180; // default to BRT (UTC-3)
    const match = clean.match(/([+-])(\d{2})(\d{2})$/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const offH = parseInt(match[2], 10);
      const offM = parseInt(match[3], 10);
      offsetMinutes = sign * (offH * 60 + offM);
    }

    // Compute UTC time
    const utcMs = Date.UTC(year, month, day, hour, min, sec) - offsetMinutes * 60 * 1000;
    return utcMs;
  } catch {
    return 0;
  }
};

export const formatClockTime = (ms: number): string => {
  if (!ms) return '--:--';
  const d = new Date(ms);
  // Format to America/Sao_Paulo (UTC-3)
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  });
};

export interface RawXmlProgramme {
  channel: string;
  start: number;
  stop: number;
  title: string;
  desc?: string;
  category?: string;
}

export class EpgService {
  private static instance: EpgService;
  private programmesByChannel: Map<string, RawXmlProgramme[]> = new Map();
  private isLoaded = false;
  private isLoading = false;
  private lastFetchTime = 0;

  public static getInstance(): EpgService {
    if (!EpgService.instance) {
      EpgService.instance = new EpgService();
    }
    return EpgService.instance;
  }

  public async loadEpg(force = false): Promise<boolean> {
    const now = Date.now();
    // Cache for 30 minutes
    if (this.isLoaded && !force && now - this.lastFetchTime < 30 * 60 * 1000) {
      return true;
    }
    if (this.isLoading) return false;

    this.isLoading = true;
    try {
      // 1. Try local /api/epg (for Web / Node server)
      // 2. If running as APK on Android phone/Fire TV without local Node,
      //    fetch from the hosted Cloud server or directly from BrazilTVEPG raw GitHub
      const jsonCandidates = [
        '/api/epg',
        'https://ais-pre-xglaorf2rmn4d6ex3zhhcx-169975259431.us-west2.run.app/api/epg',
        'https://ais-dev-xglaorf2rmn4d6ex3zhhcx-169975259431.us-west2.run.app/api/epg',
      ];

      let rawJson: any = null;
      for (const url of jsonCandidates) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
          if (res.ok) {
            rawJson = await res.json();
            if (rawJson && rawJson.programmes && Object.keys(rawJson.programmes).length > 0) {
              break;
            }
          }
        } catch {
          // continue to next candidate
        }
      }

      if (rawJson && rawJson.programmes) {
        this.programmesByChannel.clear();
        for (const [chId, progs] of Object.entries(rawJson.programmes as Record<string, any[]>)) {
          this.programmesByChannel.set(
            chId.toUpperCase(),
            (progs as any[]).map((p) => ({
              channel: chId,
              start: p.start,
              stop: p.stop,
              title: p.title || 'Programação',
              desc: p.desc || '',
              category: p.category || '',
            }))
          );
        }
        this.isLoaded = true;
        this.lastFetchTime = now;
        return true;
      }

      // 3. Fallback for standalone APK (Android / Fire TV): Fetch XML directly from GitHub
      // raw.githubusercontent.com supports CORS (access-control-allow-origin: *)
      try {
        const rawXmlRes = await fetch(
          'https://raw.githubusercontent.com/limaalef/BrazilTVEPG/main/claro.xml',
          { signal: AbortSignal.timeout(10000) }
        );
        if (rawXmlRes.ok) {
          const xmlText = await rawXmlRes.text();
          const progRegex = /<programme\s+start="([^"]+)"\s+stop="([^"]+)"\s+channel="([^"]+)">([\s\S]*?)<\/programme>/g;

          const parseXmltvTime = (str: string): number => {
            try {
              const clean = str.trim();
              const year = parseInt(clean.slice(0, 4), 10);
              const month = parseInt(clean.slice(4, 6), 10) - 1;
              const day = parseInt(clean.slice(6, 8), 10);
              const hour = parseInt(clean.slice(8, 10), 10);
              const min = parseInt(clean.slice(10, 12), 10);
              const sec = parseInt(clean.slice(12, 14), 10) || 0;
              let offsetMinutes = -180;
              const match = clean.match(/([+-])(\d{2})(\d{2})$/);
              if (match) {
                const sign = match[1] === '+' ? 1 : -1;
                offsetMinutes = sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10));
              }
              return Date.UTC(year, month, day, hour, min, sec) - offsetMinutes * 60 * 1000;
            } catch {
              return 0;
            }
          };

          const minTime = now - 6 * 60 * 60 * 1000;
          const maxTime = now + 24 * 60 * 60 * 1000;

          this.programmesByChannel.clear();
          let match;
          while ((match = progRegex.exec(xmlText)) !== null) {
            const startMs = parseXmltvTime(match[1]);
            const stopMs = parseXmltvTime(match[2]);
            if (stopMs < minTime || startMs > maxTime) continue;

            const chKey = match[3].replace(/&amp;/g, '&').trim().toUpperCase();
            const inner = match[4];
            const titleM = inner.match(/<title[^>]*>([\s\S]*?)<\/title>/);
            const descM = inner.match(/<desc[^>]*>([\s\S]*?)<\/desc>/);
            const catM = inner.match(/<category[^>]*>([\s\S]*?)<\/category>/);

            const title = titleM ? titleM[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : '';
            const desc = descM ? descM[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : '';
            const category = catM ? catM[1].trim() : '';

            if (!this.programmesByChannel.has(chKey)) {
              this.programmesByChannel.set(chKey, []);
            }
            this.programmesByChannel.get(chKey)!.push({
              channel: chKey,
              start: startMs,
              stop: stopMs,
              title,
              desc,
              category,
            });
          }

          for (const list of this.programmesByChannel.values()) {
            list.sort((a, b) => a.start - b.start);
          }

          this.isLoaded = true;
          this.lastFetchTime = now;
          return true;
        }
      } catch (xmlErr) {
        console.warn('Direct XML EPG fetch error:', xmlErr);
      }
      return false;
    } catch (err) {
      console.warn('EPG fetch warning (fallback active):', err);
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Finds the EPG schedule for a given channel name
   */
  public getChannelEpg(channelName: string): ChannelEpg {
    const trimmed = channelName.trim();
    const upper = trimmed.toUpperCase();
    const nowMs = Date.now();

    // 1. Resolve possible EPG channel IDs from aliases map
    const potentialIds: string[] = [];
    if (EPG_CHANNEL_ALIASES[upper]) {
      potentialIds.push(...EPG_CHANNEL_ALIASES[upper]);
    }
    potentialIds.push(trimmed);
    potentialIds.push(`${trimmed} HD`);
    potentialIds.push(trimmed.replace(/\s+HD$/i, ''));

    // 2. Find matching programmes in loaded map
    let matchedProgs: RawXmlProgramme[] | undefined;
    let matchedId = trimmed;

    for (const pid of potentialIds) {
      const found = this.programmesByChannel.get(pid.toUpperCase());
      if (found && found.length > 0) {
        matchedProgs = found;
        matchedId = pid;
        break;
      }
    }

    // Fuzzy search if no exact alias found
    if (!matchedProgs) {
      const cleanTarget = upper.replace(/[^A-Z0-9]/g, '');
      for (const [key, progs] of this.programmesByChannel.entries()) {
        const cleanKey = key.replace(/[^A-Z0-9]/g, '');
        if (cleanKey.includes(cleanTarget) || cleanTarget.includes(cleanKey)) {
          matchedProgs = progs;
          matchedId = key;
          break;
        }
      }
    }

    if (!matchedProgs || matchedProgs.length === 0) {
      // Fallback pseudo-program when EPG data is unavailable
      const currentStart = nowMs - (nowMs % (60 * 60 * 1000));
      const currentStop = currentStart + 60 * 60 * 1000;
      const progressPercent = Math.min(100, Math.max(0, Math.round(((nowMs - currentStart) / (currentStop - currentStart)) * 100)));

      return {
        channelName,
        epgChannelId: matchedId,
        currentProgram: {
          title: `Transmissão Ao Vivo • ${channelName}`,
          desc: 'Programação contínua 24h em alta definição.',
          start: formatClockTime(currentStart),
          stop: formatClockTime(currentStop),
          startTime: currentStart,
          stopTime: currentStop,
          progressPercent,
        },
        nextProgram: {
          title: `Programação Especial • ${channelName}`,
          desc: 'A seguir na grade.',
          start: formatClockTime(currentStop),
          stop: formatClockTime(currentStop + 60 * 60 * 1000),
          startTime: currentStop,
          stopTime: currentStop + 60 * 60 * 1000,
        },
        upcoming: [],
      };
    }

    // 3. Locate active current program and subsequent programs
    let currentProg: RawXmlProgramme | null = null;
    let nextProg: RawXmlProgramme | null = null;
    const upcomingProgs: RawXmlProgramme[] = [];

    // Sort programmes chronologically
    const sorted = [...matchedProgs].sort((a, b) => a.start - b.start);

    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      if (p.start <= nowMs && nowMs < p.stop) {
        currentProg = p;
        if (i + 1 < sorted.length) {
          nextProg = sorted[i + 1];
        }
        // Collect next 4 programs
        for (let j = i + 1; j < Math.min(sorted.length, i + 5); j++) {
          upcomingProgs.push(sorted[j]);
        }
        break;
      }
    }

    // If active time window passed or slightly before first program
    if (!currentProg && sorted.length > 0) {
      // Find the closest future program
      const future = sorted.find((p) => p.start >= nowMs);
      if (future) {
        currentProg = future;
        const idx = sorted.indexOf(future);
        if (idx + 1 < sorted.length) nextProg = sorted[idx + 1];
      } else {
        currentProg = sorted[sorted.length - 1];
      }
    }

    const toEpgProgram = (p: RawXmlProgramme, isCurrent = false): EpgProgram => {
      let progressPercent = 0;
      if (isCurrent && p.stop > p.start) {
        const elapsed = nowMs - p.start;
        const duration = p.stop - p.start;
        progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
      }
      return {
        title: p.title,
        desc: p.desc,
        category: p.category,
        start: formatClockTime(p.start),
        stop: formatClockTime(p.stop),
        startTime: p.start,
        stopTime: p.stop,
        progressPercent: isCurrent ? progressPercent : undefined,
      };
    };

    return {
      channelName,
      epgChannelId: matchedId,
      currentProgram: currentProg ? toEpgProgram(currentProg, true) : null,
      nextProgram: nextProg ? toEpgProgram(nextProg, false) : null,
      upcoming: upcomingProgs.map((p) => toEpgProgram(p, false)),
    };
  }
}

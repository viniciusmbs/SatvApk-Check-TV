import { CustomLogosMap } from '../types';

const TV_LOGO_BR = 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/brazil/';
const TV_LOGO_US = 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/';
const TV_LOGO_CA = 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/canada/';
const TV_LOGO_LAM = 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/world-latin-america/';
const TV_LOGO_AR = 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/argentina/';
const TV_LOGO_INT = 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/international/';

// SVG Data URIs for channels without external image files or requiring 100% reliable local rendering
const CAZE_TV_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%"><rect width="120" height="120" rx="20" fill="%23182234"/><rect x="12" y="12" width="96" height="96" rx="14" fill="%230f172a" stroke="%2338bdf8" stroke-width="4"/><text x="60" y="74" font-family="system-ui, sans-serif" font-weight="900" font-size="44" fill="%23ffffff" text-anchor="middle" letter-spacing="-1">CT</text></svg>`;

const COMBATE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="100%" height="100%"><rect width="200" height="60" rx="10" fill="%23000000" fill-opacity="0.6"/><text x="100" y="42" font-family="Impact, Arial Black, sans-serif" font-style="italic" font-weight="900" font-size="34" fill="%23ffffff" text-anchor="middle" letter-spacing="2">COMBATE</text><circle cx="178" cy="24" r="5" fill="%23ef4444"/></svg>`;

const UOL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 70" width="100%" height="100%"><rect width="160" height="70" rx="10" fill="%23101827"/><circle cx="50" cy="35" r="18" fill="none" stroke="%23ff6600" stroke-width="8"/><text x="105" y="45" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="%23ffffff" text-anchor="middle">uol</text></svg>`;

const CANAL_DO_BOI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 80" width="100%" height="100%"><rect width="180" height="80" rx="10" fill="%23111827"/><circle cx="50" cy="40" r="22" fill="none" stroke="%2322c55e" stroke-width="5"/><path d="M40 32 Q50 20 60 32 Q55 52 40 32" fill="%2322c55e"/><text x="125" y="36" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" fill="%23ffffff">CANAL</text><text x="125" y="54" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="%2322c55e">DO BOI</text></svg>`;

const TV_DIARIO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="100%" height="100%"><rect width="160" height="80" rx="12" fill="%230f172a"/><polygon points="35,22 65,40 35,58" fill="%2338bdf8"/><text x="110" y="38" font-family="system-ui, sans-serif" font-weight="bold" font-size="15" fill="%23ffffff">TV</text><text x="110" y="56" font-family="system-ui, sans-serif" font-weight="bold" font-size="15" fill="%2338bdf8">DIÁRIO</text></svg>`;

const TV_JUSTICA_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="100%" height="100%"><rect width="160" height="80" rx="12" fill="%230f172a"/><circle cx="45" cy="40" r="18" fill="none" stroke="%23ffffff" stroke-width="4"/><line x1="45" y1="28" x2="45" y2="52" stroke="%23ffffff" stroke-width="3"/><text x="105" y="38" font-family="system-ui, sans-serif" font-weight="bold" font-size="13" fill="%23ffffff">TV</text><text x="105" y="55" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="%23f59e0b">JUSTIÇA</text></svg>`;

const CURTA_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="100%" height="100%"><rect width="160" height="80" rx="14" fill="%23ffd200"/><text x="80" y="53" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="34" fill="%2318181b" text-anchor="middle" letter-spacing="-0.5">curta!</text></svg>`;

const RED_BULL_TV_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 80" width="100%" height="100%"><rect width="180" height="80" rx="12" fill="%230b1329"/><circle cx="50" cy="40" r="24" fill="%23ffd100"/><circle cx="50" cy="40" r="12" fill="%23dc2626"/><text x="120" y="36" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="16" fill="%23ffffff" text-anchor="middle">RED BULL</text><text x="120" y="56" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="16" fill="%23dc2626" text-anchor="middle" letter-spacing="1">TV</text></svg>`;

const NHK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="100%" height="100%"><rect width="160" height="80" rx="12" fill="%230f172a"/><g transform="translate(14, 20)"><rect x="0" y="0" width="38" height="40" rx="8" fill="%23ffffff"/><text x="19" y="29" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%230f172a" text-anchor="middle">N</text><rect x="47" y="0" width="38" height="40" rx="8" fill="%23ffffff"/><text x="66" y="29" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%230f172a" text-anchor="middle">H</text><rect x="94" y="0" width="38" height="40" rx="8" fill="%23ffffff"/><text x="113" y="29" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%230f172a" text-anchor="middle">K</text></g></svg>`;

const PLUTO_TV_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 80" width="100%" height="100%"><rect width="180" height="80" rx="12" fill="%2309090b"/><circle cx="42" cy="40" r="20" fill="none" stroke="%23fbbf24" stroke-width="5"/><circle cx="42" cy="40" r="11" fill="none" stroke="%23ec4899" stroke-width="4"/><text x="115" y="38" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="%23ffffff" text-anchor="middle">pluto<tspan fill="%2338bdf8">tv</tspan></text><text x="115" y="58" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="%23ef4444" text-anchor="middle" letter-spacing="2">ESPORTES</text></svg>`;

const TRAVEL_BOX_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 80" width="100%" height="100%"><rect width="180" height="80" rx="12" fill="%230f172a"/><rect x="16" y="18" width="40" height="44" rx="8" fill="%23f97316"/><text x="36" y="46" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="%23ffffff" text-anchor="middle">TB</text><text x="116" y="37" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="%23ffffff">TRAVEL</text><text x="116" y="54" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="%23f97316">BOX BRASIL</text></svg>`;

const E_ENTERTAINMENT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="100%" height="100%"><rect width="160" height="80" rx="12" fill="%23000000"/><circle cx="80" cy="40" r="28" fill="none" stroke="%23ffffff" stroke-width="5"/><text x="76" y="51" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="34" fill="%23ffffff" text-anchor="middle">E!</text></svg>`;

const GOSPEL_MOVIES_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 80" width="100%" height="100%"><rect width="180" height="80" rx="12" fill="%2318181b"/><path d="M34,20 L34,60 M22,34 L46,34" stroke="%2338bdf8" stroke-width="5" stroke-linecap="round"/><text x="112" y="38" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="%23ffffff">GOSPEL</text><text x="112" y="56" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="%2338bdf8" letter-spacing="1">MOVIES</text></svg>`;

const REDE_SUPER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 80" width="100%" height="100%"><rect width="180" height="80" rx="12" fill="%230f172a"/><polygon points="45,18 64,40 45,62 26,40" fill="%23ef4444"/><text x="45" y="47" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="20" fill="%23ffffff" text-anchor="middle">S</text><text x="118" y="37" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="%2394a3b8">REDE</text><text x="118" y="56" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="%23ef4444">SUPER</text></svg>`;

const VIVA_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="100%" height="100%"><rect width="160" height="80" rx="14" fill="%23e11d48"/><text x="80" y="53" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" fill="%23ffffff" text-anchor="middle" letter-spacing="2">viva</text></svg>`;

export const DEFAULT_LOGOS_MAP: Record<string, string> = {
  // TV ABERTA / REGIONAIS
  'GLOBO': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO SP': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO RJ': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO MG': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO ES': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO RS': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO PR': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO SC': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO BA': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO PE': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO CE': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO DF': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO GAZETA': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO INTEGRAÇÃO': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO ES TV GAZETA VITÓRIA': `${TV_LOGO_BR}globo-br.png`,
  'GLOBO MG TV INTEGRAÇÃO JUIZ DE FORA': `${TV_LOGO_BR}globo-br.png`,
  'INTEGRAÇÃO JUIZ DE FORA': `${TV_LOGO_BR}globo-br.png`,
  'INTEGRAÇÃO': `${TV_LOGO_BR}globo-br.png`,
  'INTEGRACAO': `${TV_LOGO_BR}globo-br.png`,
  'TV INTEGRAÇÃO': `${TV_LOGO_BR}globo-br.png`,
  'TV INTEGRACAO': `${TV_LOGO_BR}globo-br.png`,
  'TV INTEGRAÇÃO JUIZ DE FORA': `${TV_LOGO_BR}globo-br.png`,
  'SBT': `${TV_LOGO_BR}sbt-br.png`,
  'SBT SP': `${TV_LOGO_BR}sbt-br.png`,
  'SBT RJ': `${TV_LOGO_BR}sbt-br.png`,
  'BAND': `${TV_LOGO_BR}band-br.png`,
  'BAND SP': `${TV_LOGO_BR}band-br.png`,
  'BAND RJ': `${TV_LOGO_BR}band-br.png`,
  'RECORD': `${TV_LOGO_BR}record-br.png`,
  'RECORD SP': `${TV_LOGO_BR}record-br.png`,
  'RECORD RJ': `${TV_LOGO_BR}record-br.png`,
  'RECORD MG': `${TV_LOGO_BR}record-br.png`,
  'RECORD MINAS': `${TV_LOGO_BR}record-br.png`,
  'RECORD TV': `${TV_LOGO_BR}record-br.png`,
  'RECORD TV MINAS': `${TV_LOGO_BR}record-br.png`,
  'REDE TV': `${TV_LOGO_BR}rede-tv-br.png`,
  'REDETV': `${TV_LOGO_BR}rede-tv-br.png`,
  'TV CULTURA': `${TV_LOGO_BR}tv-cultura-br.png`,
  'CULTURA': `${TV_LOGO_BR}tv-cultura-br.png`,
  'TV BRASIL': `${TV_LOGO_BR}tv-brasil-br.png`,
  'TV GAZETA': `${TV_LOGO_BR}tv-gazeta-br.png`,
  'GAZETA': `${TV_LOGO_BR}tv-gazeta-br.png`,
  'FUTURA': `${TV_LOGO_BR}futura-br.png`,
  'TV CÂMARA': `${TV_LOGO_BR}tv-camara-br.png`,
  'TV CAMARA': `${TV_LOGO_BR}tv-camara-br.png`,
  'TV SENADO': `${TV_LOGO_BR}tv-senado-br.png`,
  'TV RÁ TIM BUM': `${TV_LOGO_BR}tv-ra-tim-bum-br.png`,
  'TV RA TIM BUM': `${TV_LOGO_BR}tv-ra-tim-bum-br.png`,
  'CANAL DO BOI': CANAL_DO_BOI_SVG,
  'CANAL RURAL': `${TV_LOGO_BR}canal-rural-br.png`,
  'AGRO+': `${TV_LOGO_BR}agro-mais-br.png`,
  'AGRO MAIS': `${TV_LOGO_BR}agro-mais-br.png`,
  'TV DIÁRIO': TV_DIARIO_SVG,
  'TV DIARIO': TV_DIARIO_SVG,
  'TV JUSTIÇA': TV_JUSTICA_SVG,
  'TV JUSTICA': TV_JUSTICA_SVG,

  // ESPORTES & PPV
  'SPORTV': `${TV_LOGO_BR}sportv-br.png`,
  'SPORTTV': `${TV_LOGO_BR}sportv-br.png`,
  'SPORTV 2': `${TV_LOGO_BR}sportv2-br.png`,
  'SPORTTV 2': `${TV_LOGO_BR}sportv2-br.png`,
  'SPORTV 3': `${TV_LOGO_BR}sportv3-br.png`,
  'SPORTTV 3': `${TV_LOGO_BR}sportv3-br.png`,
  'BAND SPORTS': `${TV_LOGO_BR}band-sports-br.png`,
  'BANDSPORTS': `${TV_LOGO_BR}band-sports-br.png`,
  'ESPN': `${TV_LOGO_US}espn-us.png`,
  'ESPN 2': `${TV_LOGO_US}espn-2-us.png`,
  'ESPN 3': `${TV_LOGO_US}espn-3-us.png`,
  'ESPN 4': `${TV_LOGO_BR}espn-4-br.png`,
  'ESPN 5': `${TV_LOGO_BR}espn-5-br.png`,
  'ESPN 6': `${TV_LOGO_BR}espn-extra-br.png`,
  'ESPN EXTRA': `${TV_LOGO_BR}espn-extra-br.png`,
  'FOX SPORTS': `${TV_LOGO_BR}fox-sports-2-br.png`,
  'FOX SPORTS 2': `${TV_LOGO_BR}fox-sports-2-br.png`,
  'COMBATE': COMBATE_SVG,
  'PREMIERE': `${TV_LOGO_BR}premiere-br.png`,
  'PREMIERE CLUBES': `${TV_LOGO_BR}premiere-br.png`,
  'PREMIERE 2': `${TV_LOGO_BR}premiere-br.png`,
  'PREMIERE 3': `${TV_LOGO_BR}premiere-br.png`,
  'PREMIERE 4': `${TV_LOGO_BR}premiere-br.png`,
  'PREMIERE 5': `${TV_LOGO_BR}premiere-br.png`,
  'PREMIERE 6': `${TV_LOGO_BR}premiere-br.png`,
  'PREMIERE 7': `${TV_LOGO_BR}premiere-br.png`,
  'PREMIERE 8': `${TV_LOGO_BR}premiere-br.png`,
  'PREMIERE 8 MOSAICO': `${TV_LOGO_BR}premiere-br.png`,
  'DAZN': `${TV_LOGO_US}dazn-us.png`,
  'DAZN 2': `${TV_LOGO_US}dazn-us.png`,
  'DAZN 3': `${TV_LOGO_US}dazn-us.png`,
  'DAZN 4': `${TV_LOGO_US}dazn-us.png`,
  'DAZN 6': `${TV_LOGO_US}dazn-us.png`,
  'DAZN 7': `${TV_LOGO_US}dazn-us.png`,
  'DAZN 8': `${TV_LOGO_US}dazn-us.png`,
  'DAZN 9': `${TV_LOGO_US}dazn-us.png`,
  'DAZN 10': `${TV_LOGO_US}dazn-us.png`,
  'CAZÉ TV': CAZE_TV_SVG,
  'CAZE TV': CAZE_TV_SVG,
  'CAZETV': CAZE_TV_SVG,
  'UFC FIGHT PASS': `${TV_LOGO_US}ufc-fight-pass-us.png`,
  'UFC': `${TV_LOGO_US}ufc-fight-pass-us.png`,
  'PLUTO TV ESPORTES': PLUTO_TV_SVG,
  'PLUTO TV': PLUTO_TV_SVG,

  // FILMES & SÉRIES
  'TELECINE ACTION': `${TV_LOGO_BR}tele-cine-action-br.png`,
  'TELECINE CULT': `${TV_LOGO_BR}tele-cine-cult-br.png`,
  'TELECINE FUN': `${TV_LOGO_BR}tele-cine-fun-br.png`,
  'TELECINE PIPOCA': `${TV_LOGO_BR}tele-cine-pipoca-br.png`,
  'TELECINE PREMIUM': `${TV_LOGO_BR}tele-cine-premium-br.png`,
  'TELECINE TOUCH': `${TV_LOGO_BR}tele-cine-touch-br.png`,
  'HBO': `${TV_LOGO_BR}hbo-br.png`,
  'HBO 2': `${TV_LOGO_BR}hbo-2-br.png`,
  'HBO FAMILY': `${TV_LOGO_BR}hbo-family-br.png`,
  'HBO MUNDI': `${TV_LOGO_BR}hbo-mundi-br.png`,
  'HBO PLUS': `${TV_LOGO_BR}hbo-plus-br.png`,
  'HBO POP': `${TV_LOGO_BR}hbo-pop-br.png`,
  'HBO SIGNATURE': `${TV_LOGO_BR}hbo-signature-br.png`,
  'HBO XTREME': `${TV_LOGO_BR}hbo-xtreme-br.png`,
  'HBO MAX': `${TV_LOGO_BR}hbo-br.png`,
  'HBO MAX 2': `${TV_LOGO_BR}hbo-2-br.png`,
  'HBO MAX 3': `${TV_LOGO_BR}hbo-plus-br.png`,
  'HBO MAX 4': `${TV_LOGO_BR}hbo-signature-br.png`,
  'HBO MAX 5': `${TV_LOGO_BR}hbo-family-br.png`,
  'MEGAPIX': `${TV_LOGO_BR}megapix-br.png`,
  'SPACE': `${TV_LOGO_BR}space-br.png`,
  'TNT': `${TV_LOGO_BR}tnt-br.png`,
  'TNT SERIES': `${TV_LOGO_BR}tnt-series-br.png`,
  'TNT SÉRIES': `${TV_LOGO_BR}tnt-series-br.png`,
  'TNT NOVELAS': `${TV_LOGO_BR}tnt-br.png`,
  'WARNER': `${TV_LOGO_BR}warner-channel-br.png`,
  'WARNER CHANNEL': `${TV_LOGO_BR}warner-channel-br.png`,
  'UNIVERSAL': `${TV_LOGO_BR}universal-tv-br.png`,
  'UNIVERSAL TV': `${TV_LOGO_BR}universal-tv-br.png`,
  'UNIVERSAL CHANNEL': `${TV_LOGO_BR}universal-tv-br.png`,
  'STUDIO UNIVERSAL': `${TV_LOGO_BR}studio-universal-br.png`,
  'SONY': `${TV_LOGO_BR}sony-channel-br.png`,
  'SONY CHANNEL': `${TV_LOGO_BR}sony-channel-br.png`,
  'SONY MOVIES': `${TV_LOGO_BR}sony-movies-br.png`,
  'AXN': `${TV_LOGO_BR}axn-br.png`,
  'A&E': `${TV_LOGO_BR}a-and-e-br.png`,
  'AMC': `${TV_LOGO_US}amc-us.png`,
  'CINEMAX': `${TV_LOGO_BR}cinemax-br.png`,
  'CINECANAL': `${TV_LOGO_BR}cine-canal-br.png`,
  'TCM': `${TV_LOGO_BR}tcm-br.png`,
  'STAR CHANNEL': `${TV_LOGO_BR}star-channel-br.png`,
  'STAR HITS': `${TV_LOGO_BR}star-channel-br.png`,
  'STAR LIFE': `${TV_LOGO_BR}star-channel-br.png`,
  'PARAMOUNT': `${TV_LOGO_BR}paramount-network-br.png`,
  'PARAMOUNT NETWORK': `${TV_LOGO_BR}paramount-network-br.png`,
  'PARAMOUNT CHANNEL': `${TV_LOGO_BR}paramount-network-br.png`,
  'CANAL BRASIL': `${TV_LOGO_BR}canal-brasil-br.png`,
  'ARTE 1': `${TV_LOGO_BR}arte1-br.png`,
  'ART 1': `${TV_LOGO_BR}arte1-br.png`,
  'FX': `${TV_LOGO_BR}star-channel-br.png`,
  'FXM': `${TV_LOGO_BR}star-channel-br.png`,
  'SYFY': `${TV_LOGO_US}syfy-us.png`,
  'COMEDY CENTRAL': `${TV_LOGO_US}comedy-central-us.png`,

  // INFANTIS
  'CARTOON NETWORK': `${TV_LOGO_BR}cartoon-network-br.png`,
  'CARTOONITO': `${TV_LOGO_BR}cartoonito-br.png`,
  'DISCOVERY KIDS': `${TV_LOGO_BR}discovery-kids-br.png`,
  'GLOOB': `${TV_LOGO_BR}gloob-br.png`,
  'GLOOBINHO': `${TV_LOGO_BR}gloobinho-br.png`,
  'NICKELODEON': `${TV_LOGO_US}nickelodeon-us.png`,
  'NICK JR': `${TV_LOGO_US}nick-jr-us.png`,
  'DISNEY CHANNEL': `${TV_LOGO_US}disney-channel-us.png`,
  'DISNEY JUNIOR': `${TV_LOGO_US}disney-jr-us.png`,
  'DISNEY JR': `${TV_LOGO_US}disney-jr-us.png`,
  'TOONCAST': `${TV_LOGO_BR}tooncast-br.png`,
  'WOOHOO': `${TV_LOGO_BR}woohoo-br.png`,
  'ZOOMOO': `${TV_LOGO_BR}zoomoo-br.png`,
  'BABY TV': `${TV_LOGO_BR}box-kids-tv-br.png`,

  // NOTÍCIAS
  'GLOBONEWS': `${TV_LOGO_BR}globo-news-br.png`,
  'GLOBO NEWS': `${TV_LOGO_BR}globo-news-br.png`,
  'CNN BRASIL': `${TV_LOGO_BR}cnn-brasil-br.png`,
  'BAND NEWS': `${TV_LOGO_BR}band-news-br.png`,
  'BANDNEWS': `${TV_LOGO_BR}band-news-br.png`,
  'JOVEM PAN NEWS': `${TV_LOGO_BR}jovem-pan-news-br.png`,
  'RECORD NEWS': `${TV_LOGO_BR}record-news-br.png`,
  'UOL': UOL_SVG,

  // DOCUMENTÁRIOS
  'DISCOVERY CHANNEL': `${TV_LOGO_US}discovery-channel-us.png`,
  'DISCOVERY': `${TV_LOGO_US}discovery-channel-us.png`,
  'DISCOVERY TURBO': `${TV_LOGO_BR}discovery-turbo-br.png`,
  'DISCOVERY SCIENCE': `${TV_LOGO_US}discovery-science-us.png`,
  'DISCOVERY THEATER': `${TV_LOGO_LAM}discovery-theater-hd-lam.png`,
  'DISCOVERY WORLD': `${TV_LOGO_AR}discovery-world-hd-ar.png`,
  'DISCOVERY H&H': `${TV_LOGO_LAM}discovery-home-and-health-lam.png`,
  'DISCOVERY HOME & HEALTH': `${TV_LOGO_LAM}discovery-home-and-health-lam.png`,
  'ANIMAL PLANET': `${TV_LOGO_US}animal-planet-us.png`,
  'ANIMAL PLANE': `${TV_LOGO_US}animal-planet-us.png`,
  'HISTORY': `${TV_LOGO_US}history-channel-us.png`,
  'HISTORY CHANNEL': `${TV_LOGO_US}history-channel-us.png`,
  'HISTORY 2': `${TV_LOGO_US}history-channel-us.png`,
  'NATIONAL GEOGRAPHIC': `${TV_LOGO_US}national-geographic-us.png`,
  'NATGEO WILD': `${TV_LOGO_US}national-geographic-us.png`,
  'TLC': `${TV_LOGO_US}tlc-us.png`,
  'HGTV': `${TV_LOGO_US}hgtv-us.png`,
  'INVESTIGAÇÃO DISCOVERY': `${TV_LOGO_US}investigation-discovery-us.png`,
  'CURTA!': CURTA_SVG,
  'CURTA': CURTA_SVG,
  'DOG TV': `${TV_LOGO_US}dog-tv-us.png`,
  'FISH TV': `${TV_LOGO_BR}fish-tv-br.png`,
  'FOOD NETWORK': `${TV_LOGO_US}food-network-us.png`,
  'LOVE NATURE': `${TV_LOGO_CA}love-nature-ca.png`,
  'NHK': NHK_SVG,
  'RED BULL TV': `${TV_LOGO_INT}red-bull-tv-int.png`,
  'RED BULL': `${TV_LOGO_INT}red-bull-tv-int.png`,
  'TRAVEL BOX BRASIL': TRAVEL_BOX_SVG,

  // MÚSICA & VARIEDADES
  'MULTISHOW': `${TV_LOGO_BR}multishow-br.png`,
  'GNT': `${TV_LOGO_BR}gnt-br.png`,
  'BIS': `${TV_LOGO_BR}bis-br.png`,
  'OFF': `${TV_LOGO_BR}canal-off-br.png`,
  'VIVA': VIVA_SVG,
  'MTV': `${TV_LOGO_US}mtv-us.png`,
  'MTV LIVE': `${TV_LOGO_US}mtv-live-us.png`,
  'VH1': `${TV_LOGO_US}vh1-us.png`,
  'MUSIC BOX BRASIL': `${TV_LOGO_BR}prime-box-brazil-br.png`,
  'E!': `${TV_LOGO_US}e-entertainment-us.png`,
  'E! ENTERTAINMENT': `${TV_LOGO_US}e-entertainment-us.png`,

  // RELIGIOSOS
  'TV APARECIDA': `${TV_LOGO_BR}tv-aparecida-br.png`,
  'APARECIDA': `${TV_LOGO_BR}tv-aparecida-br.png`,
  'CANÇÃO NOVA': `${TV_LOGO_BR}cancao-nova-tv-br.png`,
  'CANCAO NOVA': `${TV_LOGO_BR}cancao-nova-tv-br.png`,
  'NOVO TEMPO': `${TV_LOGO_BR}novo-tempo-br.png`,
  'TV PAI ETERNO': `${TV_LOGO_BR}tv-pai-eterno-br.png`,
  'PAI ETERNO': `${TV_LOGO_BR}tv-pai-eterno-br.png`,
  'REDE VIDA': `${TV_LOGO_BR}rede-vida-br.png`,
  'RIT': `${TV_LOGO_BR}rit-br.png`,
  'REDE GOSPEL': `${TV_LOGO_BR}rede-gospel-br.png`,
  'REDE SÉCULO 21': `${TV_LOGO_BR}rede-21-br.png`,
  'REDE SECULO 21': `${TV_LOGO_BR}rede-21-br.png`,
  'REDE SUPER': REDE_SUPER_SVG,
  'GOSPEL MOVIES': GOSPEL_MOVIES_SVG,
  'BOAS NOVAS': `${TV_LOGO_BR}rede-vida-br.png`,
  'EVANGELIZAR': `${TV_LOGO_BR}tv-aparecida-br.png`,
  'TV EVANGELIZAR': `${TV_LOGO_BR}tv-aparecida-br.png`,
};

/**
 * Retorna o logo correspondente ao canal.
 * 1. Verifica se o usuário salvou uma URL personalizada
 * 2. Procura no dicionário padrão exato
 * 3. Procura por correspondência parcial inteligente
 */
export const getChannelLogo = (
  channelName: string,
  customLogos?: CustomLogosMap
): string => {
  const trimmed = channelName.trim();
  const upper = trimmed.toUpperCase();

  // 1. Personalizado
  if (customLogos && customLogos[trimmed]) {
    return customLogos[trimmed];
  }
  if (customLogos && customLogos[upper]) {
    return customLogos[upper];
  }

  // 2. Dicionário exato
  if (DEFAULT_LOGOS_MAP[upper]) {
    return DEFAULT_LOGOS_MAP[upper];
  }

  // 3. Correspondências parciais inteligentes
  if (upper.includes('CURTA')) return CURTA_SVG;
  if (upper.includes('RED BULL')) return `${TV_LOGO_INT}red-bull-tv-int.png`;
  if (upper.includes('NHK')) return NHK_SVG;
  if (upper.includes('PLUTO')) return PLUTO_TV_SVG;
  if (upper.includes('TRAVEL BOX')) return TRAVEL_BOX_SVG;
  if (upper.includes('E!') || upper === 'E' || upper.includes('ENTERTAINMENT')) return `${TV_LOGO_US}e-entertainment-us.png`;
  if (upper.includes('GOSPEL MOVIES')) return GOSPEL_MOVIES_SVG;
  if (upper.includes('SUPER') && upper.includes('REDE')) return REDE_SUPER_SVG;
  if (upper.includes('DOG')) return `${TV_LOGO_US}dog-tv-us.png`;
  if (upper.includes('FISH')) return `${TV_LOGO_BR}fish-tv-br.png`;
  if (upper.includes('FOOD NETWORK')) return `${TV_LOGO_US}food-network-us.png`;
  if (upper.includes('LOVE NATURE')) return `${TV_LOGO_CA}love-nature-ca.png`;
  if (upper.includes('ANIMAL PLAN')) return `${TV_LOGO_US}animal-planet-us.png`;
  if (upper === 'ART 1' || upper === 'ARTE 1') return `${TV_LOGO_BR}arte1-br.png`;
  if (upper === 'VIVA') return VIVA_SVG;

  // Discovery (todos os canais da família)
  if (upper.includes('DISCOVERY')) {
    if (upper.includes('THEATER')) return `${TV_LOGO_LAM}discovery-theater-hd-lam.png`;
    if (upper.includes('WORLD')) return `${TV_LOGO_AR}discovery-world-hd-ar.png`;
    if (upper.includes('H&H') || upper.includes('HOME') || upper.includes('HEALTH')) {
      return `${TV_LOGO_LAM}discovery-home-and-health-lam.png`;
    }
    if (upper.includes('SCIENCE')) return `${TV_LOGO_US}discovery-science-us.png`;
    if (upper.includes('TURBO')) return `${TV_LOGO_BR}discovery-turbo-br.png`;
    if (upper.includes('KIDS')) return `${TV_LOGO_BR}discovery-kids-br.png`;
    return `${TV_LOGO_US}discovery-channel-us.png`;
  }

  // Disney
  if (upper.includes('DISNEY')) {
    if (upper.includes('JR') || upper.includes('JUNIOR')) return `${TV_LOGO_US}disney-jr-us.png`;
    return `${TV_LOGO_US}disney-channel-us.png`;
  }

  // ESPN
  if (upper.startsWith('ESPN 2')) return `${TV_LOGO_US}espn-2-us.png`;
  if (upper.startsWith('ESPN 3')) return `${TV_LOGO_US}espn-3-us.png`;
  if (upper.startsWith('ESPN 4')) return `${TV_LOGO_BR}espn-4-br.png`;
  if (upper.startsWith('ESPN 5')) return `${TV_LOGO_BR}espn-5-br.png`;
  if (upper.startsWith('ESPN 6') || upper.includes('EXTRA')) return `${TV_LOGO_BR}espn-extra-br.png`;
  if (upper.startsWith('ESPN')) return `${TV_LOGO_US}espn-us.png`;

  // SporTV
  if (upper.includes('SPORTV 2') || upper.includes('SPORTTV 2')) return `${TV_LOGO_BR}sportv2-br.png`;
  if (upper.includes('SPORTV 3') || upper.includes('SPORTTV 3')) return `${TV_LOGO_BR}sportv3-br.png`;
  if (upper.includes('SPORTV') || upper.includes('SPORTTV')) return `${TV_LOGO_BR}sportv-br.png`;

  // Premiere
  if (upper.includes('PREMIERE')) return `${TV_LOGO_BR}premiere-br.png`;

  // DAZN
  if (upper.includes('DAZN')) return `${TV_LOGO_US}dazn-us.png`;

  // Cazé TV
  if (upper.includes('CAZE') || upper.includes('CAZÉ')) return CAZE_TV_SVG;

  // Combate
  if (upper.includes('COMBATE')) return COMBATE_SVG;

  // HBO
  if (upper.includes('HBO 2')) return `${TV_LOGO_BR}hbo-2-br.png`;
  if (upper.includes('FAMILY')) return `${TV_LOGO_BR}hbo-family-br.png`;
  if (upper.includes('MUNDI')) return `${TV_LOGO_BR}hbo-mundi-br.png`;
  if (upper.includes('PLUS')) return `${TV_LOGO_BR}hbo-plus-br.png`;
  if (upper.includes('POP')) return `${TV_LOGO_BR}hbo-pop-br.png`;
  if (upper.includes('SIGNATURE')) return `${TV_LOGO_BR}hbo-signature-br.png`;
  if (upper.includes('XTREME')) return `${TV_LOGO_BR}hbo-xtreme-br.png`;
  if (upper.includes('HBO')) return `${TV_LOGO_BR}hbo-br.png`;

  // Telecine
  if (upper.includes('ACTION')) return `${TV_LOGO_BR}tele-cine-action-br.png`;
  if (upper.includes('CULT')) return `${TV_LOGO_BR}tele-cine-cult-br.png`;
  if (upper.includes('FUN') || upper.includes('FUM')) return `${TV_LOGO_BR}tele-cine-fun-br.png`;
  if (upper.includes('PIPOCA')) return `${TV_LOGO_BR}tele-cine-pipoca-br.png`;
  if (upper.includes('PREMIUM')) return `${TV_LOGO_BR}tele-cine-premium-br.png`;
  if (upper.includes('TOUCH')) return `${TV_LOGO_BR}tele-cine-touch-br.png`;

  // TV Aberta & Regionais
  if (
    (upper.includes('GLOBO') && !upper.includes('NEWS') && !upper.includes('GLOOB')) ||
    upper.includes('INTEGRA')
  ) {
    return `${TV_LOGO_BR}globo-br.png`;
  }
  if (upper.includes('SBT')) return `${TV_LOGO_BR}sbt-br.png`;
  if (upper.includes('BAND') && !upper.includes('NEWS') && !upper.includes('SPORTS')) return `${TV_LOGO_BR}band-br.png`;
  if (upper.includes('RECORD') && !upper.includes('NEWS')) return `${TV_LOGO_BR}record-br.png`;
  if (upper.includes('REDE TV') || upper.includes('REDETV')) return `${TV_LOGO_BR}rede-tv-br.png`;

  // Outros
  if (upper.includes('UOL')) return UOL_SVG;

  // Fallback escuro limpo estilizado em SVG sem depender de rede externa
  const safeText = channelName.slice(0, 10).toUpperCase();
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" width="100%" height="100%"><rect width="160" height="90" rx="12" fill="%23131b2c"/><rect x="8" y="8" width="144" height="74" rx="8" fill="%231a2438" stroke="%23334155" stroke-width="2"/><text x="80" y="52" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="%23e2e8f0" text-anchor="middle" letter-spacing="1">${encodeURIComponent(safeText)}</text></svg>`;
};

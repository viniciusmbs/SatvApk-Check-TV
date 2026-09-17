import { AnalyticsSummary, ClickEventLog } from '../types';

// Chave do localStorage para persistência da ID de medição GA4
const GA_STORAGE_KEY = 'satv_ga4_measurement_id';
const DEFAULT_GA_ID = 'G-SATVIPTV01';
const GEO_STORAGE_KEY = 'satv_user_geo_cache_v2';

export interface UserGeoInfo {
  ip?: string;
  city: string;
  state: string;
  region: string;
  country: string;
}

export interface TrackLinkParams {
  linkId?: string;
  linkName: string;
  linkUrl: string;
  category?: string;
  ip?: string;
  city?: string;
  state?: string;
  region?: string;
  country?: string;
}

// Histórico em memória dos eventos mais recentes para atualização instantânea na UI
let recentEventsCache: ClickEventLog[] = [];
let eventsFiredCounter = 0;
let isGlobalTrackerInitialized = false;

/**
 * Obtém a ID de Medição atual configurada
 */
export function getStoredMeasurementId(): string {
  if (typeof window === 'undefined') return DEFAULT_GA_ID;
  return localStorage.getItem(GA_STORAGE_KEY) || DEFAULT_GA_ID;
}

/**
 * Salva e atualiza a ID de Medição do GA4
 */
export function setStoredMeasurementId(id: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = id.trim();
  localStorage.setItem(GA_STORAGE_KEY, cleanId);
  initGoogleAnalytics(cleanId);
}

/**
 * Inicializa a biblioteca gtag.js do Google Analytics 4
 */
export function initGoogleAnalytics(measurementId?: string): void {
  if (typeof window === 'undefined') return;

  const gaId = measurementId || getStoredMeasurementId();

  // Garante dataLayer e função gtag global
  const win = window as any;
  win.dataLayer = win.dataLayer || [];
  if (!win.gtag) {
    win.gtag = function () {
      win.dataLayer.push(arguments);
    };
  }

  // Se for ID válida e não carregou ainda o script do Google
  if (gaId && gaId.startsWith('G-')) {
    const existingScript = document.getElementById('ga4-script-tag');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'ga4-script-tag';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);
    }
    
    // Configuração inicial do GA4
    win.gtag('js', new Date());
    win.gtag('config', gaId, {
      send_page_view: false,
      anonymize_ip: true,
    });
    console.log(`[GA4] Inicializado com ID: ${gaId}`);
  }
}

/**
 * Detecta a localização e IP real do usuário
 * Utiliza cache no sessionStorage para agilidade e privacidade
 */
export async function detectUserLocation(): Promise<UserGeoInfo> {
  const fallback: UserGeoInfo = {
    ip: '',
    city: 'São Paulo',
    state: 'SP',
    region: 'Sudeste',
    country: 'Brasil',
  };

  if (typeof window === 'undefined') return fallback;

  // 1. Tenta recuperar do cache local do navegador
  try {
    const cached = sessionStorage.getItem(GEO_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.city) {
        return parsed;
      }
    }
  } catch {
    // Ignora erro de storage
  }

  // 2. Tenta obter dados reais através de serviço público de geolocalização de IP
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://ipwho.is/?fields=ip,city,region_code,region,country', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && (data.city || data.ip)) {
        const state = data.region_code || 'SP';
        let region = 'Sudeste';
        const south = ['RS', 'SC', 'PR'];
        const northeast = ['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'];
        const center = ['DF', 'GO', 'MT', 'MS'];
        const north = ['AM', 'PA', 'RO', 'AC', 'RR', 'AP', 'TO'];

        if (south.includes(state)) region = 'Sul';
        else if (northeast.includes(state)) region = 'Nordeste';
        else if (center.includes(state)) region = 'Centro-Oeste';
        else if (north.includes(state)) region = 'Norte';

        const geo: UserGeoInfo = {
          ip: data.ip || '',
          city: data.city || 'São Paulo',
          state,
          region,
          country: data.country || 'Brasil',
        };

        try {
          sessionStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(geo));
        } catch {}

        return geo;
      }
    }
  } catch {
    // Fallback se serviço externo estiver indisponível
  }

  // 3. Consulta o IP direto no backend se não conseguiu obter externamente
  try {
    const ipRes = await fetch('/api/client-ip');
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData.ip) {
        fallback.ip = ipData.ip;
      }
    }
  } catch {}

  // Inferência aproximada de cidade via Timezone do navegador
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Fortaleza') || tz.includes('Recife') || tz.includes('Bahia')) {
      fallback.city = 'Salvador';
      fallback.state = 'BA';
      fallback.region = 'Nordeste';
    } else if (tz.includes('Manaus') || tz.includes('Belem') || tz.includes('Porto_Velho')) {
      fallback.city = 'Manaus';
      fallback.state = 'AM';
      fallback.region = 'Norte';
    } else if (tz.includes('Cuiaba') || tz.includes('Campo_Grande')) {
      fallback.city = 'Brasília';
      fallback.state = 'DF';
      fallback.region = 'Centro-Oeste';
    } else if (tz.includes('Sao_Paulo')) {
      fallback.city = 'São Paulo';
      fallback.state = 'SP';
      fallback.region = 'Sudeste';
    }
  } catch {}

  return fallback;
}

/**
 * Função Central de Rastreamento de Cliques:
 * 1. Dispara o evento oficial para o Google Analytics (GA4): gtag('event', 'link_click', ...)
 * 2. Envia para a API local (/api/track-click) para persistir e atualizar contadores dinamicamente
 * 3. Dispara evento CustomEvent na janela para atualização instantânea da UI
 */
export async function trackLinkClick(params: TrackLinkParams): Promise<ClickEventLog> {
  const geo = await detectUserLocation();
  const ip = params.ip || geo.ip || '';
  const city = params.city || geo.city || 'Desconhecida';
  const state = params.state || geo.state || '';
  const region = params.region || geo.region || 'Brasil';
  const country = params.country || geo.country || 'Brasil';
  const linkId = params.linkId || `link-${params.linkName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const eventLog: ClickEventLog = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    linkId,
    linkName: params.linkName,
    linkUrl: params.linkUrl,
    category: params.category || 'Geral',
    ip,
    city,
    state,
    region,
    country,
    device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile' : 'Smart TV / Desktop',
    gaEventSent: false,
  };

  // 1. Disparo no Google Analytics 4 via gtag('event', 'link_click', ...)
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (typeof win.gtag === 'function') {
      try {
        win.gtag('event', 'link_click', {
          link_id: linkId,
          link_name: params.linkName,
          link_url: params.linkUrl,
          destination_url: params.linkUrl,
          link_category: params.category || 'Geral',
          user_ip: ip,
          user_city: city,
          user_state: state,
          user_region: region,
          user_country: country,
          event_category: 'engagement',
          event_label: params.linkName,
          value: 1,
        });
        eventLog.gaEventSent = true;
        eventsFiredCounter++;
      } catch (err) {
        console.warn('[GA4 Event Error]', err);
      }
    }
  }

  // 2. Atualiza cache recente em memória
  recentEventsCache = [eventLog, ...recentEventsCache.slice(0, 99)];

  // 3. Notifica a UI do aplicativo com CustomEvent para atualização dinâmica
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('satv:link_click', {
        detail: eventLog,
      })
    );
  }

  // 4. Envia para o backend para salvar no disco com IP e localização real
  try {
    const response = await fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...eventLog,
        ip,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.ip && !eventLog.ip) {
        eventLog.ip = result.ip;
      }
      // Se o backend retornou summary atualizado, avisa a UI para atualizar na hora
      if (result.summary && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('satv:analytics_updated', {
            detail: result.summary,
          })
        );
      }
    }
  } catch (err) {
    console.error('Erro ao salvar clique no backend:', err);
  }

  return eventLog;
}

/**
 * Busca dados reais de Analytics do backend (sem mock ou dados fictícios)
 */
export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const res = await fetch(`/api/analytics?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data: AnalyticsSummary = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Erro ao buscar resumo de analytics:', err);
  }

  // Estado real limpo se o backend não tiver registros ou falhar
  return {
    totalClicks: recentEventsCache.length,
    uniqueCities: new Set(recentEventsCache.map(e => e.city).filter(c => c && c !== 'Desconhecida')).size,
    uniqueLinks: new Set(recentEventsCache.map(e => e.linkUrl).filter(Boolean)).size,
    lastUpdate: new Date().toISOString(),
    clicksByCity: [],
    clicksByLink: [],
    clicksByRegion: [],
    recentClicks: recentEventsCache,
    ga4MeasurementId: getStoredMeasurementId(),
    ga4EventsFired: eventsFiredCounter,
  };
}

/**
 * Limpa e reseta os dados de Analytics para 0
 */
export async function resetAnalyticsData(): Promise<boolean> {
  try {
    const res = await fetch('/api/analytics-reset', { method: 'POST' });
    if (res.ok) {
      recentEventsCache = [];
      eventsFiredCounter = 0;
      return true;
    }
  } catch (err) {
    console.error('Erro ao resetar analytics:', err);
  }
  return false;
}

/**
 * Rastreador Global de Cliques:
 * Intercepta cliques em canais, botões e links de forma não intrusiva,
 * registrando o horário, nome e localização/IP do usuário.
 */
export function initGlobalClickTracker(): void {
  if (typeof window === 'undefined' || isGlobalTrackerInitialized) return;
  isGlobalTrackerInitialized = true;

  document.addEventListener(
    'click',
    (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        // Se o evento já foi processado ou marcado
        if ((e as any).__satv_tracked) return;

        // Identifica se clicou em um link, botão ou elemento com role button / card de canal
        const clickable = target.closest('a, button, [role="button"], [data-tv-card="true"]') as HTMLElement | null;
        if (!clickable) return;

        // Ignora campos de texto, inputs de busca e selects
        const tagName = clickable.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return;

        // Ignora ações internas marcadas com data-no-track
        if (clickable.getAttribute('data-no-track') === 'true' || clickable.closest('[data-no-track="true"]')) {
          return;
        }

        // Extrai o nome do canal, link ou botão
        let linkName = '';
        let linkUrl = '';
        let category = 'Botão / Ação';
        let linkId = '';

        if (clickable.dataset.channelName) {
          linkName = clickable.dataset.channelName;
          category = 'Canais IPTV';
          linkUrl = (clickable as HTMLAnchorElement).href || `#channel-${linkName}`;
          linkId = `channel-${linkName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        } else if (tagName === 'a') {
          const anchor = clickable as HTMLAnchorElement;
          linkUrl = anchor.href || '#';
          linkName = (anchor.innerText || anchor.getAttribute('aria-label') || anchor.getAttribute('title') || 'Link').trim();
          category = linkUrl.includes('.m3u8') ? 'Canal de TV' : 'Link';
          linkId = anchor.id || `link-${linkName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        } else {
          // Botão
          linkName = (clickable.innerText || clickable.getAttribute('aria-label') || clickable.getAttribute('title') || clickable.id || 'Botão').trim();
          if (linkName.length > 35) {
            linkName = linkName.substring(0, 32) + '...';
          }
          linkUrl = clickable.getAttribute('data-action') || (clickable.id ? `#btn-${clickable.id}` : `#btn-${linkName.replace(/\s+/g, '-').toLowerCase()}`);
          category = clickable.getAttribute('data-category') || 'Botão / Ação';
          linkId = clickable.id || `btn-${linkName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        }

        if (!linkName || linkName.length < 2) return;

        // Marca para evitar duplicação no mesmo clique
        (e as any).__satv_tracked = true;

        trackLinkClick({
          linkId,
          linkName,
          linkUrl,
          category,
        });
      } catch {
        // Ignora silenciosamente
      }
    },
    true
  );
}

export interface Channel {
  id?: string;
  name: string;
  logo?: string;
  group?: string;
  url: string;
  originalUrl?: string;
}

export interface GroupedChannels {
  [groupName: string]: Channel[];
}

export type ProxyMode = 'corsproxy' | 'direct' | 'server';

export type ClickAction = 'fullscreen' | 'new_tab' | 'popup';

export type CustomLogosMap = Record<string, string>;

export interface EpgProgram {
  title: string;
  desc?: string;
  category?: string;
  start: string; // HH:mm
  stop: string;  // HH:mm
  startTime: number; // timestamp in ms
  stopTime: number;  // timestamp in ms
  progressPercent?: number; // 0 to 100
}

export interface ChannelEpg {
  channelName: string;
  epgChannelId: string;
  currentProgram: EpgProgram | null;
  nextProgram: EpgProgram | null;
  upcoming: EpgProgram[];
}

export type ViewMode = 'grid' | 'rows' | 'epg';

export type UiDensity = 'compact' | 'normal' | 'large';

export interface ChannelItem {
  id: string;
  name: string;
  url: string;
  group?: string;
  logo?: string;
  status?: 'online' | 'offline' | 'checking';
  latency?: number;
  statusCode?: number;
}

export interface ChannelStatusResult {
  lastUpdate: string;
  total: number;
  online: number;
  offline: number;
  statuses: Record<string, 'online' | 'offline'>;
  latencies?: Record<string, number>;
}

export type ActiveTab = 'guide' | 'code-script' | 'code-workflow' | 'status-json' | 'tester' | 'analytics';

export interface CityClickMetric {
  city: string;
  state: string;
  region: string;
  country: string;
  count: number;
  percentage: number;
}

export interface LinkClickMetric {
  linkId: string;
  linkName: string;
  linkUrl: string;
  category: string;
  count: number;
  lastClicked: string;
}

export interface RegionClickMetric {
  region: string;
  count: number;
  percentage: number;
}

export interface ClickEventLog {
  id: string;
  timestamp: string;
  linkId: string;
  linkName: string;
  linkUrl: string;
  category: string;
  ip?: string;
  city: string;
  state?: string;
  region?: string;
  country?: string;
  device?: string;
  gaEventSent?: boolean;
}

export interface AnalyticsSummary {
  totalClicks: number;
  uniqueCities: number;
  uniqueLinks: number;
  lastUpdate: string;
  clicksByCity: CityClickMetric[];
  clicksByLink: LinkClickMetric[];
  clicksByRegion: RegionClickMetric[];
  recentClicks: ClickEventLog[];
  ga4MeasurementId?: string;
  ga4EventsFired?: number;
}


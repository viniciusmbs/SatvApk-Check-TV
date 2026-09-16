export interface Channel {
  id?: string;
  name: string;
  logo: string;
  group: string;
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

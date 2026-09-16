export interface Channel {
  id: string;
  name: string;
  url: string;
  group?: string;
  logo?: string;
}

export interface ChannelCheckResult {
  online: boolean;
  status: number;
  statusText?: string;
  latency: number;
  contentType?: string;
  error?: string;
  checkedAt?: string;
}

export interface StatusJsonOutput {
  lastUpdate: string;
  total: number;
  online: number;
  offline: number;
  executionTimeMs?: number;
  statuses: Record<string, 'online' | 'offline' | { status: 'online' | 'offline'; latency?: number; code?: number }>;
}

export type CronPreset = 'hourly' | 'every-2h' | 'every-6h' | 'every-12h' | 'daily' | 'custom';

export type SourceType = 'json' | 'm3u-url' | 'm3u-file' | 'static-list';

export interface RepoConfig {
  githubUser: string;
  repoName: string;
  branch: string;
  cronPreset: CronPreset;
  customCron: string;
  sourceType: SourceType;
  m3uUrl: string;
  timeoutSeconds: number;
  concurrency: number;
  userAgent: string;
  statusFilePath: string; // e.g., 'channels-status.json' or 'public/channels-status.json'
  commitMessage: string;
  fallbackToGet: boolean;
}

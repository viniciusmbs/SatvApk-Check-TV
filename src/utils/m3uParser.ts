import { Channel } from '../types/iptv';

export function parseChannelsFromM3U(rawM3U: string): Channel[] {
  if (!rawM3U) return [];

  const parts = rawM3U.split(/#EXTINF:/i);
  const channels: Channel[] = [];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const httpIdx = part.search(/https?:\/\//i);
    if (httpIdx === -1) continue;

    const header = part.substring(0, httpIdx).trim();
    const rest = part.substring(httpIdx).trim();

    const urlMatch = rest.match(/^(https?:\/\/[^\r\n#`"\s]+)/i);
    if (!urlMatch) continue;
    const cleanUrl = urlMatch[1].replace(/[`'";]+$/, '').trim();

    const commaIdx = header.lastIndexOf(',');
    let name = commaIdx !== -1 ? header.substring(commaIdx + 1).trim() : header;
    name = name.replace(/[`'"\r\n]+$/, '').trim();

    const groupMatch = header.match(/group-title="([^"]+)"/i);
    const group = groupMatch ? groupMatch[1] : 'Geral';

    const logoMatch = header.match(/tvg-logo="([^"]+)"/i);
    const logo = logoMatch ? logoMatch[1] : undefined;

    if (name && cleanUrl) {
      channels.push({
        id: `ch-${channels.length + 1}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name,
        url: cleanUrl,
        group,
        logo,
      });
    }
  }

  return channels;
}

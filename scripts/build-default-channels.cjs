const fs = require('fs');
const path = require('path');

const playlistPath = path.resolve(__dirname, '../src/data/playlist.ts');
const statusJsonPath = path.resolve(__dirname, '../channels-status.json');
const outputPath = path.resolve(__dirname, '../src/data/defaultChannels.ts');

const playlistRaw = fs.readFileSync(playlistPath, 'utf-8');
let statusJson = { statuses: {} };
try {
  statusJson = JSON.parse(fs.readFileSync(statusJsonPath, 'utf-8'));
} catch (e) {}

const parts = playlistRaw.split(/#EXTINF:/i);
const channels = [];

for (let i = 1; i < parts.length; i++) {
  const part = parts[i];
  const httpIdx = part.search(/https?:\/\//i);
  if (httpIdx === -1) continue;

  const header = part.substring(0, httpIdx).trim();
  const rest = part.substring(httpIdx).trim();

  const urlMatch = rest.match(/^(https?:\/\/[^\r\n#`"\s]+)/i);
  if (!urlMatch) continue;
  const cleanUrl = urlMatch[1].replace(/[`'";,]+$/, '').trim();

  const commaIdx = header.lastIndexOf(',');
  let name = commaIdx !== -1 ? header.substring(commaIdx + 1).trim() : header;
  name = name.replace(/[`'"\r\n]+$/, '').trim();

  const groupMatch = header.match(/group-title="([^"]+)"/i);
  const group = groupMatch ? groupMatch[1] : 'Geral';

  const logoMatch = header.match(/tvg-logo="([^"]+)"/i);
  const logo = logoMatch ? logoMatch[1] : '';

  if (name && cleanUrl) {
    channels.push({
      id: `ch-${String(channels.length + 1).padStart(3, '0')}`,
      name,
      url: cleanUrl,
      group,
      logo: logo || undefined,
    });
  }
}

console.log('Channels parsed count:', channels.length);

const fileContent = `import { Channel } from '../types/iptv';

// 131 Canais Reais da Playlist IPTV Brasileira Oficial
export const DEFAULT_CHANNELS: Channel[] = ${JSON.stringify(channels, null, 2)};
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log('Wrote successfully to:', outputPath);

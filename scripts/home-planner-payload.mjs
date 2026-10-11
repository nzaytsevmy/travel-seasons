import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function externalizeHomePayload(directory = 'dist') {
  const file = path.join(directory, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const match = /(<script\b[^>]*\bid="homeData"[^>]*>)([\s\S]*?)(<\/script>)/.exec(html);
  if (!match) throw new Error('Homepage planner data is missing');
  const data = JSON.parse(match[2]);
  if (data.dataUrl) return { unchanged: true };
  if (!Array.isArray(data.rows) || !data.pools || !Array.isArray(data.reserved) || !Number.isInteger(data.month))
    throw new Error('Invalid homepage planner payload');
  const payload = JSON.stringify(data);
  const hash = createHash('sha256').update(payload).digest('hex').slice(0, 16);
  const name = `home-planner-data-${hash}.json`;
  fs.mkdirSync(path.join(directory, '_astro'), { recursive: true });
  fs.writeFileSync(path.join(directory, '_astro', name), payload);
  const bootstrap = JSON.stringify({ month: data.month, dataUrl: `/_astro/${name}` });
  fs.writeFileSync(file, html.replace(match[0], match[1] + bootstrap + match[3]));
  return { payloadBytes: Buffer.byteLength(payload), bootstrapBytes: Buffer.byteLength(bootstrap), dataUrl: `/_astro/${name}` };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log('Homepage payload:', externalizeHomePayload());

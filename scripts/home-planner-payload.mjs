import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';

export function preloadHomeModules(html, directory) {
  const sources = [];
  const existing = new Set();
  function visit(node) {
    const attrs = Object.fromEntries((node.attrs || []).map(a => [a.name, a.value]));
    if (node.tagName === 'script' && attrs.type === 'module' && attrs.src?.startsWith('/_astro/')) sources.push(attrs.src);
    if (node.tagName === 'link' && attrs.rel?.split(/\s+/).includes('modulepreload')) existing.add(attrs.href);
    for (const child of node.childNodes || []) visit(child);
  }
  visit(parse(html));
  const dependencies = new Set();
  for (const source of sources) {
    if (!/^\/_astro\/[\w.-]+\.js$/.test(source)) throw new Error('Invalid homepage module path');
    let code = fs.readFileSync(path.join(directory, source.slice(1)), 'utf8').trimStart();
    // Vite places its static named imports at the beginning of these chunks.
    // Stop at executable code: strings and dynamic imports are not preload hints.
    for (;;) {
      const match = /^import\s*\{[^}]*\}\s*from\s*["'](\.\/[\w.-]+\.js)["'];?\s*/.exec(code);
      if (!match) break;
      const url = `/_astro/${match[1].slice(2)}`;
      if (/^\.\/(?:destination-selection|affiliate)\.[\w-]+\.js$/.test(match[1])) {
        fs.accessSync(path.join(directory, url.slice(1)));
        dependencies.add(url);
      }
      code = code.slice(match[0].length);
    }
  }
  const missing = [...dependencies].filter(url => !existing.has(url));
  if (missing.length) {
    if (!html.includes('</head>')) throw new Error('Homepage head is missing');
    html = html.replace('</head>', missing.map(url => `<link rel="modulepreload" href="${url}" crossorigin="anonymous">`).join('') + '</head>');
  }
  return { html, modulePreloads: [...dependencies] };
}

export function externalizeHomePayload(directory = 'dist') {
  const file = path.join(directory, 'index.html');
  const originalHtml = fs.readFileSync(file, 'utf8');
  const { html, modulePreloads } = preloadHomeModules(originalHtml, directory);
  const match = /(<script\b[^>]*\bid="homeData"[^>]*>)([\s\S]*?)(<\/script>)/.exec(html);
  if (!match) throw new Error('Homepage planner data is missing');
  const data = JSON.parse(match[2]);
  if (data.dataUrl) {
    if (html !== originalHtml) fs.writeFileSync(file, html);
    return { unchanged: html === originalHtml, modulePreloads };
  }
  if (!Array.isArray(data.rows) || !data.pools || !Array.isArray(data.reserved) || !Number.isInteger(data.month))
    throw new Error('Invalid homepage planner payload');
  const payload = JSON.stringify(data);
  const hash = createHash('sha256').update(payload).digest('hex').slice(0, 16);
  const name = `home-planner-data-${hash}.json`;
  fs.mkdirSync(path.join(directory, '_astro'), { recursive: true });
  fs.writeFileSync(path.join(directory, '_astro', name), payload);
  const bootstrap = JSON.stringify({ month: data.month, dataUrl: `/_astro/${name}` });
  fs.writeFileSync(file, html.replace(match[0], match[1] + bootstrap + match[3]));
  return { payloadBytes: Buffer.byteLength(payload), bootstrapBytes: Buffer.byteLength(bootstrap), dataUrl: `/_astro/${name}`, modulePreloads };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log('Homepage payload:', externalizeHomePayload());

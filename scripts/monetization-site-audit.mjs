#!/usr/bin/env node

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { classifyPage, classifyPartner, isGenericAffiliateUrl } from '../src/data/monetization.js';
import { destinationAffiliateUrl } from '../src/data/affiliate.js';

const DEEP_LINK_REQUIRED = new Set(['aviasales', 'cherehapa', 'ostrovok', 'airalo', 'youtravel']);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.html') ? [path] : [];
  });
}

function pagePath(dist, file) {
  const rel = relative(dist, file).replaceAll('\\', '/');
  if (rel === 'index.html') return '/';
  return rel.endsWith('/index.html') ? `/${rel.slice(0, -'index.html'.length)}` : `/${rel}`;
}

function htmlDecode(value) {
  return value
    .replace(/&amp;|&#x26;|&#38;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return htmlDecode(match?.[1] ?? match?.[2] ?? '');
}

function hasAttribution(href, partner) {
  const url = new URL(href);
  if (partner === 'airalo') return /^546042_[a-z0-9_]+$/i.test(url.searchParams.get('sharedID') || '');
  if (partner === 'youtravel') return !!url.searchParams.get('sub1');
  if (partner === 'platipomiru') return url.searchParams.get('utm_source') === 'traveltribe';
  return !!url.searchParams.get('sub_id');
}

export function auditMonetization(dist) {
  const pages = [];
  const links = [];
  const errors = [];
  const warnings = [];

  for (const file of walk(dist)) {
    const path = pagePath(dist, file);
    const info = classifyPage(path);
    const html = readFileSync(file, 'utf8');
    const body = html.match(/<body\b[^>]*>/i)?.[0] || '';
    const destination = attr(body, 'data-destination') || info.destination;
    const pageLinks = [];

    for (const match of html.matchAll(/<a\b[^>]*\bhref=(?:"[^"]*"|'[^']*')[^>]*>/gi)) {
      const tag = match[0];
      const href = attr(tag, 'href');
      const partner = classifyPartner(href);
      if (!partner) continue;
      const relValue = attr(tag, 'rel').split(/\s+/).filter(Boolean);
      const record = { path, ...partner, href, destination, generic: isGenericAffiliateUrl(href, partner.partner) };
      pageLinks.push(record);
      links.push(record);

      if (!relValue.includes('sponsored')) errors.push(`${path}: ${partner.partner} без rel=sponsored`);
      if (!hasAttribution(href, partner.partner)) errors.push(`${path}: ${partner.partner} без постраничной метки`);
      if (destination && DEEP_LINK_REQUIRED.has(partner.partner) && record.generic) {
        const clientDeepLink = destinationAffiliateUrl(partner.partner, destination, 'audit');
        if (clientDeepLink && !isGenericAffiliateUrl(clientDeepLink, partner.partner)) {
          record.deepenedByContract = true;
        } else if (info.type === 'blog_article') {
          warnings.push(`${path}: у ${partner.partner} нет проверенного диплинка для ${destination}; оставлен общий fallback`);
        } else {
          errors.push(`${path}: ${partner.partner} ведёт в общий каталог при известном направлении ${destination}`);
        }
      }
    }

    if (info.intent === 'none' && pageLinks.length) errors.push(`${path}: intent=none, но партнёрских ссылок ${pageLinks.length}`);
    if (info.intent === 'high' && !pageLinks.length) warnings.push(`${path}: высокий intent без партнёрского следующего шага`);
    pages.push({ path, ...info, destination, affiliateLinks: pageLinks.length });
  }
  return { pages, links, errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

export function renderAudit(result) {
  const counts = result.pages.reduce((map, page) => map.set(page.type, (map.get(page.type) || 0) + 1), new Map());
  const linkCounts = result.links.reduce((map, link) => map.set(link.partner, (map.get(link.partner) || 0) + 1), new Map());
  return `# Sitewide-аудит монетизации TravelTribe\n\n`
    + `- HTML-страниц: **${result.pages.length}**\n`
    + `- Партнёрских ссылок: **${result.links.length}**\n`
    + `- Блокирующих нарушений: **${result.errors.length}**\n`
    + `- Страниц высокого intent без следующего шага: **${result.warnings.length}**\n\n`
    + `## Покрытие типов\n\n${[...counts].sort((a, b) => b[1] - a[1]).map(([name, value]) => `- ${name}: ${value}`).join('\n')}\n\n`
    + `## Партнёры\n\n${[...linkCounts].sort((a, b) => b[1] - a[1]).map(([name, value]) => `- ${name}: ${value}`).join('\n')}\n\n`
    + `## Блокирующие нарушения\n\n${result.errors.length ? result.errors.map((item) => `- ${item}`).join('\n') : 'Не найдены.'}\n\n`
    + `## Очередь высокого intent\n\n${result.warnings.length ? result.warnings.map((item) => `- ${item}`).join('\n') : 'Пусто.'}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const dist = resolve(process.argv[2] || 'dist');
  const outputIndex = process.argv.indexOf('--output');
  const result = auditMonetization(dist);
  const report = renderAudit(result);
  if (outputIndex !== -1 && process.argv[outputIndex + 1]) writeFileSync(resolve(process.argv[outputIndex + 1]), report);
  console.log(`монетизация: страниц ${result.pages.length}, ссылок ${result.links.length}, ошибок ${result.errors.length}, предупреждений ${result.warnings.length}`);
  if (result.errors.length) {
    console.error(result.errors.slice(0, 30).map((item) => `- ${item}`).join('\n'));
    process.exitCode = 1;
  }
}

#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  classifyPage,
  computeRevenueMetrics,
  isRevenueRowMature,
  joinRevenueRowsToClicks,
} from '../src/data/monetization.js';

function argsOf(argv) {
  const args = { traffic: 'seo-pulse/traffic.json', revenue: '', clicks: '', maturity: '', output: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--traffic' || key === '--revenue' || key === '--output') args[key.slice(2)] = argv[++i] ?? '';
    if (key === '--click-events') args.clicks = argv[++i] ?? '';
    if (key === '--maturity-config') args.maturity = argv[++i] ?? '';
  }
  return args;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { field += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { row.push(field); field = ''; continue; }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header = [], ...body] = rows;
  return body.map((values) => Object.fromEntries(header.map((name, index) => [name.trim(), values[index] ?? ''])));
}

function flattenTraffic(snapshot) {
  const rows = [];
  const add = (path, value) => rows.push({
    path,
    ...classifyPage(path),
    visits: Number(value.visits || 0),
    organic: Number(value.live || 0),
    clicks: Number(value.partner || 0),
  });
  for (const [slug, value] of Object.entries(snapshot.posts ?? {})) add(`/blog/${slug}/`, value);
  for (const [slug, value] of Object.entries(snapshot.packing ?? {})) add(`/packing/${slug}/`, value);
  for (const [slug, value] of Object.entries(snapshot.guides ?? {})) add(`/${slug}/`, value);
  return rows;
}

function sumBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const name = row[key] || 'unknown';
    const current = groups.get(name) ?? { pages: 0, visits: 0, organic: 0, clicks: 0 };
    current.pages += 1;
    current.visits += row.visits;
    current.organic += row.organic;
    current.clicks += row.clicks;
    groups.set(name, current);
  }
  return groups;
}

function money(value) {
  const formatted = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  return `${formatted.replace(/^-/, '−')} ₽`;
}

function percent(numerator, denominator) {
  return denominator ? `${(numerator / denominator * 100).toFixed(2).replace('.', ',')}%` : '—';
}

function renderTable(groups) {
  const lines = [
    '| сегмент | страниц | органических визитов | человеческих кликов | CTR |',
    '|---|---:|---:|---:|---:|',
  ];
  for (const [name, value] of [...groups].sort((a, b) => b[1].organic - a[1].organic)) {
    lines.push(`| ${name} | ${value.pages} | ${value.organic} | ${value.clicks} | ${percent(value.clicks, value.organic)} |`);
  }
  return lines.join('\n');
}

export function buildReport({
  trafficSnapshot,
  revenueRows = [],
  clickRows = [],
  asOfDate = trafficSnapshot.updated || new Date().toISOString().slice(0, 10),
  maturityDaysByPartner = {},
}) {
  const traffic = flattenTraffic(trafficSnapshot);
  const joined = joinRevenueRowsToClicks(revenueRows, clickRows);
  const normalized = joined.rows;
  const maturityConfigured = normalized.length > 0 && normalized.every((row) => {
    const days = Number(maturityDaysByPartner[row.partner] ?? maturityDaysByPartner.default);
    return Number.isFinite(days) && days >= 0;
  });
  const validClickDates = normalized.every((row) => Number.isFinite(Date.parse(row.clickDate)));
  const mature = maturityConfigured && validClickDates
    ? normalized.filter((row) => isRevenueRowMature(row, asOfDate, maturityDaysByPartner))
    : [];
  const decisionRows = mature.filter((row) => row.orderId && row.monetaryValueKnown);
  const approvedRevenue = decisionRows.reduce((sum, row) => sum + row.approvedRevenue, 0);
  const reversedRevenue = decisionRows.reduce((sum, row) => sum + row.reversedRevenue, 0);
  const approvedOrders = decisionRows.filter((row) => row.approvedRevenue > 0).length;
  const organicSessions = traffic.reduce((sum, row) => sum + row.organic, 0);
  const clicks = traffic.reduce((sum, row) => sum + row.clicks, 0);
  const metrics = computeRevenueMetrics({ organicSessions, approvedRevenue, reversedRevenue, approvedOrders });
  const dated = trafficSnapshot.updated || new Date().toISOString().slice(0, 10);
  const missingOrderIds = normalized.filter((row) => !row.orderId).length;
  const unknownMoney = normalized.filter((row) => !row.monetaryValueKnown).length;
  const attributed = normalized.filter((row) => row.ctaId).length;
  let status = 'Партнёрская выгрузка ещё не подана: финансовый результат считать доказанным нельзя.';
  if (revenueRows.length && !maturityConfigured) {
    status = 'Окно зрелости не задано для всех партнёров: финансовое решение запрещено.';
  } else if (revenueRows.length && !validClickDates) {
    status = 'Есть строки без корректной click_date: финансовое решение запрещено.';
  } else if (missingOrderIds || unknownMoney) {
    status = `Неполный денежный контракт: без order_id — ${missingOrderIds}, без рублёвой суммы — ${unknownMoney}; финансовое решение запрещено.`;
  } else if (normalized.length && (joined.stats.coverage !== 1 || joined.stats.ambiguous || joined.stats.mismatched)) {
    status = `Точного action→click join нет у всех действий: сопоставлено ${joined.stats.matched} из ${joined.stats.total}; финансовое решение запрещено.`;
  } else if (approvedOrders > 0) {
    status = 'Есть зрелые одобрения; решения принимаются по чистому доходу после проверки экспериментальных guardrails.';
  } else if (revenueRows.length) {
    status = 'Выгрузка подключена, но зрелых одобрений пока нет.';
  }

  return `# Монетизация TravelTribe — денежный baseline\n\n`
    + `Срез Метрики: **${dated}**. Главная метрика — одобренная комиссия после отмен на 1 000 органических визитов.\n\n`
    + `## Итог\n\n`
    + `- Органических визитов: **${organicSessions}**\n`
    + `- Человеческих переходов к партнёрам: **${clicks}** (${percent(clicks, organicSessions)})\n`
    + `- Заказов после сведения статусов: **${normalized.length}** (сырых строк: ${revenueRows.length})\n`
    + `- Зрелых заказов: **${mature.length} из ${normalized.length}**\n`
    + `- Покрытие CTA-level атрибуцией: **${percent(attributed, normalized.length)}**\n`
    + `- Точный action→click join: **${percent(joined.stats.matched, joined.stats.total)} (${joined.stats.matched} из ${joined.stats.total})**\n`
    + `- Одобренных действий: **${metrics.approvedOrders}**\n`
    + `- Чистая одобренная комиссия: **${money(metrics.netApprovedRevenue)}**\n`
    + `- Доход на 1 000 органических визитов: **${metrics.revenuePerThousand == null ? 'недостаточно данных' : money(metrics.revenuePerThousand)}**\n`
    + `- Статус: **${status}**\n\n`
    + `## По типам страниц\n\n${renderTable(sumBy(traffic, 'type'))}\n\n`
    + `## По намерению\n\n${renderTable(sumBy(traffic, 'intent'))}\n\n`
    + `## Правило решения\n\n`
    + `CTR используется для диагностики. Вариант остаётся на сайте постоянно только после созревшего роста чистого дохода; pending, отмены и сырые клики партнёра победой не считаются.\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const args = argsOf(process.argv.slice(2));
  const trafficSnapshot = JSON.parse(readFileSync(resolve(args.traffic), 'utf8'));
  const revenueRows = args.revenue ? parseCsv(readFileSync(resolve(args.revenue), 'utf8')) : [];
  const clickRows = args.clicks ? parseCsv(readFileSync(resolve(args.clicks), 'utf8')) : [];
  const maturityDaysByPartner = args.maturity ? JSON.parse(readFileSync(resolve(args.maturity), 'utf8')) : {};
  const report = buildReport({
    trafficSnapshot,
    revenueRows,
    clickRows,
    asOfDate: trafficSnapshot.updated,
    maturityDaysByPartner,
  });
  if (args.output) {
    writeFileSync(resolve(args.output), report);
    console.log(`денежный отчёт: ${args.output}`);
  } else {
    process.stdout.write(report);
  }
}

export { flattenTraffic, parseCsv };

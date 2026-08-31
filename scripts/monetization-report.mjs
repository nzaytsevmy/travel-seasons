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
  const args = { traffic: 'seo-pulse/traffic.json', revenue: '', clicks: '', maturity: '', input: '', output: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--traffic' || key === '--revenue' || key === '--output') args[key.slice(2)] = argv[++i] ?? '';
    if (key === '--click-events') args.clicks = argv[++i] ?? '';
    if (key === '--maturity-config') args.maturity = argv[++i] ?? '';
    if (key === '--input') args.input = argv[++i] ?? '';
  }
  return args;
}

const READER_COHORT_ORDER = ['new', 'returning_1_27', 'returning_28_89', 'returning_90_plus', 'unknown'];
const AUDIENCE_SOURCE_ORDER = ['telegram_current', 'telegram_assisted_1_27', 'telegram_assisted_28_89', 'unattributed', 'unknown'];

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

function renderValueTable({ counts = {}, clickRows = [], decisionRows = [], field, order }) {
  const bucketOf = (row) => String(row[field] || 'unknown');
  const keys = [...new Set([...order, ...Object.keys(counts)])]
    .filter((key) => counts[key] || clickRows.some((row) => bucketOf(row) === key) || decisionRows.some((row) => bucketOf(row) === key));
  if (!keys.length) return 'Данных для когорт ещё нет.';
  const lines = [
    '| когорта | пользователей | сессий | кликов | зрелых заказов | чистый доход | доход / 1 000 сессий |',
    '|---|---:|---:|---:|---:|---:|---:|',
  ];
  for (const key of keys) {
    const users = Number(counts[key]?.users ?? 0);
    const sessions = Number(counts[key]?.sessions ?? 0);
    const clicks = clickRows
      .filter((row) => bucketOf(row) === key)
      .reduce((sum, row) => sum + Math.max(1, Number(row.event_count ?? 1)), 0);
    const cohortOrders = decisionRows.filter((row) => bucketOf(row) === key);
    const net = cohortOrders.reduce((sum, row) => sum + row.approvedRevenue - row.reversedRevenue, 0);
    const rpm = sessions > 0 ? net / sessions * 1000 : null;
    lines.push(`| ${key} | ${users} | ${sessions} | ${clicks} | ${cohortOrders.length} | ${money(net)} | ${rpm == null ? '—' : money(rpm)} |`);
  }
  return lines.join('\n');
}

export function buildReport({
  trafficSnapshot,
  revenueRows = [],
  clickRows = [],
  asOfDate = trafficSnapshot.updated || new Date().toISOString().slice(0, 10),
  maturityDaysByPartner = {},
  readerCohortCounts = {},
  audienceSourceCounts = {},
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
  const readerValueTable = renderValueTable({
    counts: readerCohortCounts,
    clickRows,
    decisionRows,
    field: 'reader_cohort',
    order: READER_COHORT_ORDER,
  });
  const telegramValueTable = renderValueTable({
    counts: audienceSourceCounts,
    clickRows,
    decisionRows,
    field: 'audience_source',
    order: AUDIENCE_SOURCE_ORDER,
  });
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
    + `## Ценность читательских когорт\n\n${readerValueTable}\n\n`
    + `## Telegram-assisted — наблюдательная атрибуция\n\n`
    + `Вход по UTM и последующие возвраты показывают связанную цепочку, но без рандомизации не доказывают причинный вклад Telegram.\n\n`
    + `${telegramValueTable}\n\n`
    + `## Правило решения\n\n`
    + `CTR используется для диагностики. Вариант остаётся на сайте постоянно только после созревшего роста чистого дохода; pending, отмены и сырые клики партнёра победой не считаются.\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const args = argsOf(process.argv.slice(2));
  const trafficSnapshot = JSON.parse(readFileSync(resolve(args.traffic), 'utf8'));
  const privateExport = args.input ? JSON.parse(readFileSync(resolve(args.input), 'utf8')) : {};
  const revenueRows = args.revenue ? parseCsv(readFileSync(resolve(args.revenue), 'utf8')) : (privateExport.actions ?? []);
  const clickRows = args.clicks ? parseCsv(readFileSync(resolve(args.clicks), 'utf8')) : (privateExport.clickEvents ?? []);
  const maturityDaysByPartner = args.maturity ? JSON.parse(readFileSync(resolve(args.maturity), 'utf8')) : {};
  const report = buildReport({
    trafficSnapshot,
    revenueRows,
    clickRows,
    asOfDate: privateExport.asOfDate || trafficSnapshot.updated,
    maturityDaysByPartner,
    readerCohortCounts: privateExport.readerCohortCounts ?? {},
    audienceSourceCounts: privateExport.audienceSourceCounts ?? {},
  });
  if (args.output) {
    writeFileSync(resolve(args.output), report);
    console.log(`денежный отчёт: ${args.output}`);
  } else {
    process.stdout.write(report);
  }
}

export { flattenTraffic, parseCsv };

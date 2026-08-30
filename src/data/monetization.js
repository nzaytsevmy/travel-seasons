// Единый денежный контракт TravelTribe.
// Здесь нет токенов, cookie и идентификаторов посетителя: только свойства
// страницы и CTA, которые одинаково читают Метрика и отчёт партнёра.

const PARTNERS = [
  { host: 'aviasales.tpk.mx', partner: 'aviasales', offer: 'flight', attribution: 'sub_id' },
  { host: 'ostrovok.tpk.mx', partner: 'ostrovok', offer: 'stay', attribution: 'sub_id' },
  { host: 'cherehapa.tpk.mx', partner: 'cherehapa', offer: 'insurance', attribution: 'sub_id' },
  { host: 'airalo.pxf.io', partner: 'airalo', offer: 'esim', attribution: 'sharedID' },
  { host: 'drimsim.tpk.mx', partner: 'drimsim', offer: 'esim', attribution: 'sub_id' },
  { host: 'platipomiru.com', partner: 'platipomiru', offer: 'card', attribution: 'utm_content' },
  { host: 'travelata.tpk.mx', partner: 'travelata', offer: 'package_tour', attribution: 'sub_id' },
  { host: 'economybookings.tpk.mx', partner: 'economybookings', offer: 'car', attribution: 'sub_id' },
  { host: 'travelme.g2afse.com', partner: 'youtravel', offer: 'author_tour', attribution: 'sub1' },
  { host: 'sutochno.tpk.mx', partner: 'sutochno', offer: 'stay', attribution: 'sub_id' },
  { host: 'tutu.tpk.mx', partner: 'tutu', offer: 'transport', attribution: 'sub_id' },
  { host: 'yandex.tpk.mx', partner: 'yandex_travel', offer: 'stay', attribution: 'sub_id' },
  { host: 'otello.tpk.mx', partner: 'otello', offer: 'stay', attribution: 'sub_id' },
  { host: 'level.tpk.mx', partner: 'level', offer: 'package_tour', attribution: 'sub_id' },
  { host: 'tripster.tpk.mx', partner: 'tripster', offer: 'excursion', attribution: 'sub_id' },
  { host: 'sputnik8.tpk.mx', partner: 'sputnik8', offer: 'excursion', attribution: 'sub_id' },
  { host: 'tiqets.tpk.mx', partner: 'tiqets', offer: 'attraction', attribution: 'sub_id' },
];

const HIGH_INTENT_BLOG = /(?:strahov|insurance|(?:^|-)visa(?:-|$)|pay-|aviasales|ostrovok|travelata|sutochno|tutu-|yandex-puteshestviya|biblio-globus|skolko-stoit|esim)/;
// Подтверждённый справочный интент: 1 409 органических визитов, 2 партнёрских
// клика и 12 переходов в Telegram. Aurora-гайды и документы сюда не входят:
// в них есть конкретная поездка или страховой следующий шаг.
const NO_COMMERCIAL_BLOG = /(?:perseidy)/;
const COUNTRY_GUIDE = /^(.+?)-(?:guide|insurance|visa)-20\d\d$/;
const RESERVED_ROOTS = new Set([
  '404', 'about', 'bezviz', 'blog', 'calculator', 'cards', 'compare', 'countries',
  'events', 'izmeneniya', 'legal', 'my', 'novosti', 'packing', 'seasons', 'trips', 'visa',
]);
const NON_CONTENT_ROOTS = new Set(['404.html', 'japan-momiji', 'japan_momiji', 'mexico_old', 'status']);

const clean = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const hash32 = (value) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, '0').slice(-7);
};

export function classifyPage(pathname = '/') {
  const parts = String(pathname).split('?')[0].split('#')[0].split('/').filter(Boolean);
  if (!parts.length) return { type: 'home', intent: 'low', destination: '' };

  const [top, second = '', third = ''] = parts;
  if (NON_CONTENT_ROOTS.has(top) || /^yandex_[a-z0-9]+\.html$/i.test(top) || /^zen_[a-z0-9]+\.html$/i.test(top)) {
    return { type: 'non_content', intent: 'none', destination: '' };
  }
  if (top === 'packing') {
    if (parts.length >= 3) return { type: 'packing_month', intent: 'high', destination: second };
    if (parts.length === 2) return { type: 'packing_country', intent: 'medium', destination: second };
    return { type: 'packing_index', intent: 'low', destination: '' };
  }
  if (top === 'trips') {
    if (parts.length >= 3) return { type: 'trips_country_month', intent: 'high', destination: third };
    return { type: parts.length === 2 ? 'trips_month' : 'trips_index', intent: 'low', destination: '' };
  }
  if (top === 'visa') {
    if (parts.length >= 2) return { type: 'visa_country', intent: 'high', destination: second };
    return { type: 'visa_index', intent: 'low', destination: '' };
  }
  if (top === 'compare') {
    return { type: parts.length >= 2 ? 'compare_page' : 'compare_index', intent: parts.length >= 2 ? 'medium' : 'low', destination: '' };
  }
  if (top === 'blog') {
    if (second === 'tag' || !second) return { type: second === 'tag' ? 'blog_tag' : 'blog_index', intent: 'none', destination: '' };
    const slug = second;
    const match = slug.match(COUNTRY_GUIDE);
    return {
      type: 'blog_article',
      intent: NO_COMMERCIAL_BLOG.test(slug) ? 'none' : HIGH_INTENT_BLOG.test(slug) ? 'high' : 'medium',
      destination: match?.[1] ?? '',
    };
  }
  if (top === 'novosti') return { type: parts.length >= 2 ? 'news_article' : 'news_index', intent: 'none', destination: '' };
  if (top === 'legal' || ['404', 'about', 'izmeneniya', 'my'].includes(top)) return { type: top === 'legal' ? 'legal' : top, intent: 'none', destination: '' };
  if (top === 'events') return { type: parts.length >= 2 ? 'events_month' : 'events_index', intent: 'low', destination: '' };
  if (top === 'seasons') return { type: parts.length >= 2 ? 'seasons_detail' : 'seasons_index', intent: 'low', destination: parts.length >= 3 ? third : '' };
  if (top === 'calculator' || top === 'cards') return { type: top, intent: 'high', destination: '' };
  if (top === 'countries' || top === 'bezviz') return { type: top, intent: 'low', destination: '' };
  if (!RESERVED_ROOTS.has(top) && parts.length === 1) return { type: 'country_hub', intent: 'medium', destination: top };
  return { type: 'static', intent: 'low', destination: '' };
}

export function classifyPartner(href) {
  let host;
  try { host = new URL(href).hostname.toLowerCase(); } catch { return null; }
  const match = PARTNERS.find((item) => host === item.host || host.endsWith(`.${item.host}`));
  if (!match) return null;
  return { partner: match.partner, offer: match.offer, attribution: match.attribution };
}

export function isGenericAffiliateUrl(href, partnerName) {
  let url;
  try { url = new URL(href); } catch { return true; }
  const target = url.searchParams.get('u') || url.searchParams.get('redirect') || '';
  let targetUrl = null;
  try { targetUrl = target ? new URL(target) : null; } catch { return true; }
  const path = targetUrl?.pathname.replace(/\/+$/, '') ?? '';
  if (partnerName === 'aviasales') return !targetUrl || !targetUrl.pathname.includes('/search/');
  if (partnerName === 'cherehapa') return !targetUrl || !(targetUrl.searchParams.get('countries[0]') || targetUrl.searchParams.get('countryGroups[0]'));
  if (partnerName === 'ostrovok') return !targetUrl || path === '' || path === '/hotel';
  if (partnerName === 'airalo') return !targetUrl || !/\/ru\/[a-z0-9-]+-esim$/i.test(path);
  if (partnerName === 'youtravel') return !targetUrl || !/\/tours\/(?:country|region)\//.test(path);
  return false;
}

export function buildCtaId(pathname, partner, placement, ordinal = 1) {
  const page = clean(String(pathname).replace(/^\/+|\/+$/g, '')) || 'home';
  const raw = clean(`${page}_${partner}_${placement}_${ordinal}`) || 'cta';
  if (raw.length <= 64) return raw;
  return `${raw.slice(0, 56)}_${hash32(raw)}`;
}

export function addCtaAttribution(href, ctaId) {
  const partner = classifyPartner(href);
  if (!partner) return href;
  const url = new URL(href);
  const value = clean(ctaId).slice(0, 64);
  if (!value) return href;

  if (partner.attribution === 'sharedID') {
    const current = url.searchParams.get('sharedID') || '546042_';
    const marker = current.split('_')[0] || '546042';
    url.searchParams.set('sharedID', `${marker}_${value}`);
  } else {
    url.searchParams.set(partner.attribution, value);
  }
  return url.toString();
}

const numberFrom = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};

export function normalizeRevenueRow(row) {
  const status = clean(row.status);
  const hasRubAmount = row.commission_rub != null && String(row.commission_rub).trim() !== '';
  const currency = clean(row.currency || (hasRubAmount ? 'rub' : '')).toUpperCase() || 'RUB';
  const monetaryValueKnown = hasRubAmount || currency === 'RUB';
  const commission = monetaryValueKnown
    ? Math.abs(numberFrom(hasRubAmount ? row.commission_rub : (row.commission ?? row.revenue)))
    : 0;
  const approved = ['approved', 'confirmed', 'paid'].includes(status);
  const reversed = ['cancelled', 'canceled', 'rejected', 'reversed', 'declined'].includes(status);
  const clickDate = String(row.click_date ?? row.date ?? row.created_at ?? '');
  const decisionDate = String(row.decision_date ?? row.updated_at ?? row.status_date ?? '');
  return {
    date: clickDate,
    clickDate,
    decisionDate,
    partner: clean(row.partner),
    ctaId: clean(row.sub_id ?? row.sub1 ?? row.shared_id ?? row.utm_content),
    currency,
    status,
    approvedRevenue: approved ? commission : 0,
    reversedRevenue: reversed ? commission : 0,
    orderId: String(row.order_id ?? row.booking_id ?? row.action_id ?? ''),
    monetaryValueKnown,
  };
}

export function deduplicateRevenueRows(rows) {
  const result = [];
  const byOrder = new Map();
  const timestamp = (row) => {
    const value = Date.parse(row.decisionDate || row.date || row.clickDate || '');
    return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
  };

  for (const row of rows) {
    if (!row.orderId) {
      result.push(row);
      continue;
    }
    const orderKey = `${row.partner}\0${row.orderId}`;
    const currentIndex = byOrder.get(orderKey);
    if (currentIndex == null) {
      byOrder.set(orderKey, result.length);
      result.push(row);
      continue;
    }
    if (timestamp(row) >= timestamp(result[currentIndex])) result[currentIndex] = row;
  }
  return result;
}

export function isRevenueRowMature(row, asOfDate, maturityDaysByPartner = {}) {
  const configured = maturityDaysByPartner[row.partner] ?? maturityDaysByPartner.default;
  const days = Number(configured);
  if (!Number.isFinite(days) || days < 0) return false;
  const clickedAt = Date.parse(row.clickDate || row.date || '');
  const asOf = Date.parse(asOfDate || '');
  if (!Number.isFinite(clickedAt) || !Number.isFinite(asOf)) return false;
  return asOf - clickedAt >= days * 86_400_000;
}

export function computeRevenueMetrics({ organicSessions = 0, approvedRevenue = 0, reversedRevenue = 0, approvedOrders = 0 }) {
  const sessions = Math.max(0, numberFrom(organicSessions));
  const net = numberFrom(approvedRevenue) - numberFrom(reversedRevenue);
  return {
    organicSessions: sessions,
    approvedOrders: Math.max(0, numberFrom(approvedOrders)),
    netApprovedRevenue: Math.round(net * 100) / 100,
    revenuePerThousand: sessions > 0 ? Math.round((net / sessions) * 100000) / 100 : null,
  };
}

export { PARTNERS };

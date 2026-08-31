// Единый денежный контракт TravelTribe.
// Здесь нет cookie и идентификаторов посетителя. Click ID — случайный одноразовый
// ключ конкретного перехода: он не позволяет узнать человека и нужен только для
// точного join Метрики с действием партнёра.

export const MONETIZATION_EXPERIMENT = Object.freeze({
  id: 'monetization_aa_click_join_v1',
  kind: 'aa',
  variants: ['a', 'b'],
  assignmentUnit: 'browser_device',
  expectedAllocation: { a: 0.5, b: 0.5 },
  srmAlpha: 0.01,
  minimumSampleSize: 4000,
  aaEquivalenceMargin: 0.2,
  power: 0.8,
  attributionThreshold: 0.95,
  startedAt: '2026-08-31',
  fixedEndAt: '2026-09-27',
  requiredGuardrails: ['seo', 'cwv', 'errors'],
});

const ATTRIBUTION_CONTRACT = 'tt2';
const CLICK_ID_RE = /^c[a-f0-9]{20}$/;
const READER_STATE_KEY = 'tt_reader_lifecycle_v1';
const AUDIENCE_STATE_KEY = 'tt_audience_attribution_v1';
const DAY_MS = 86_400_000;

function utcDay(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
}

function daysBetween(first, last) {
  const start = Date.parse(`${first}T00:00:00Z`);
  const end = Date.parse(`${last}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.floor((end - start) / DAY_MS);
}

function storedJson(storage, key) {
  try {
    const value = JSON.parse(storage?.getItem?.(key) || 'null');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function storeJson(storage, key, value) {
  try { storage?.setItem?.(key, JSON.stringify(value)); } catch { /* storage is optional */ }
}

// Анонимная долговечность читателя: в браузере остаются только календарные дни
// первого/последнего визита и локальный счётчик. Уникального ID нет, наружу
// передаётся только крупный бакет возраста аудитории.
export function updateReaderLifecycle(storage, now = new Date()) {
  const today = utcDay(now) || utcDay(new Date());
  const stored = storedJson(storage, READER_STATE_KEY);
  const storedAge = daysBetween(stored.firstSeen, today);
  const firstSeen = storedAge != null && storedAge >= 0 ? stored.firstSeen : today;
  const readerAgeDays = Math.max(0, daysBetween(firstSeen, today) ?? 0);
  const visits = Math.max(0, Math.min(1_000_000, Number(stored.visits) || 0)) + 1;
  storeJson(storage, READER_STATE_KEY, { firstSeen, lastSeen: today, visits });

  let cohort = 'new';
  if (readerAgeDays >= 90) cohort = 'returning_90_plus';
  else if (readerAgeDays >= 28) cohort = 'returning_28_89';
  else if (readerAgeDays >= 1) cohort = 'returning_1_27';
  return { cohort, readerAgeDays };
}

// Telegram assist — наблюдательная, не причинная атрибуция. Сохраняем только
// день последнего входа по utm_source=telegram и автоматически забываем его
// после 90 дней. Ни Telegram ID, ни cookie, ни адрес пользователя не нужны.
export function updateAudienceAttribution(storage, href, now = new Date()) {
  const today = utcDay(now) || utcDay(new Date());
  let isTelegramArrival = false;
  try {
    const url = new URL(String(href || ''), 'https://traveltribe.ru/');
    isTelegramArrival = url.searchParams.get('utm_source')?.toLowerCase() === 'telegram';
  } catch { /* malformed URL is unattributed */ }

  const stored = storedJson(storage, AUDIENCE_STATE_KEY);
  const lastTelegramAt = isTelegramArrival ? today : String(stored.lastTelegramAt || '');
  const telegramAgeDays = daysBetween(lastTelegramAt, today);
  if (isTelegramArrival) {
    storeJson(storage, AUDIENCE_STATE_KEY, { lastTelegramAt: today });
    return { source: 'telegram_current', telegramAgeDays: 0 };
  }
  if (telegramAgeDays != null && telegramAgeDays >= 0 && telegramAgeDays < 28) {
    return { source: 'telegram_assisted_1_27', telegramAgeDays };
  }
  if (telegramAgeDays != null && telegramAgeDays >= 28 && telegramAgeDays < 90) {
    return { source: 'telegram_assisted_28_89', telegramAgeDays };
  }
  if (lastTelegramAt) storeJson(storage, AUDIENCE_STATE_KEY, { lastTelegramAt: '' });
  return { source: 'unattributed', telegramAgeDays: Math.max(0, telegramAgeDays ?? 0) };
}

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

export function createClickId(cryptoObject = globalThis.crypto) {
  const bytes = new Uint8Array(10);
  if (!cryptoObject || typeof cryptoObject.getRandomValues !== 'function') {
    throw new Error('Secure random source is required for click attribution');
  }
  cryptoObject.getRandomValues(bytes);
  return `c${[...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

export function buildClickAttribution({ ctaId, experimentId, variant, clickId }) {
  const fields = [clean(ctaId).slice(0, 64), clean(experimentId).slice(0, 64), clean(variant).slice(0, 8), clean(clickId)];
  if (!fields[0] || !fields[1] || !fields[2] || !CLICK_ID_RE.test(fields[3])) {
    throw new Error('Incomplete click attribution contract');
  }
  return `${ATTRIBUTION_CONTRACT}__${fields.join('__')}`;
}

export function parseClickAttribution(value) {
  const raw = String(value ?? '');
  const parts = raw.split('__');
  if (parts.length === 5 && parts[0] === ATTRIBUTION_CONTRACT) {
    const [, ctaId, experimentId, variant, clickId] = parts;
    const valid = Boolean(clean(ctaId) && clean(experimentId) && clean(variant) && CLICK_ID_RE.test(clickId));
    if (valid) {
      return {
        contract: ATTRIBUTION_CONTRACT,
        ctaId: clean(ctaId).slice(0, 64),
        experimentId: clean(experimentId).slice(0, 64),
        variant: clean(variant).slice(0, 8),
        clickId,
        joinSupported: true,
      };
    }
  }
  return {
    contract: 'legacy',
    ctaId: clean(raw).slice(0, 128),
    experimentId: '',
    variant: '',
    clickId: '',
    joinSupported: false,
  };
}

export function addClickAttribution(href, attribution) {
  const partner = classifyPartner(href);
  // Точный action→click join сейчас документирован только у Travelpayouts:
  // все его ссылки идут через tpk.mx и принимают sub_id. Другие сети сохраняют
  // CTA-level метку; их нельзя молча объявлять click-level совместимыми.
  if (!partner || partner.attribution !== 'sub_id') return href;
  const url = new URL(href);
  url.searchParams.set('sub_id', buildClickAttribution(attribution));
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
  const status = clean(row.status ?? row.state);
  const rubAmount = [row.commission_rub, row.profit_rub, row.paid_profit_rub, row.processing_profit_rub]
    .find((value) => value != null && String(value).trim() !== '');
  const genericAmount = [row.commission, row.revenue, row.profit]
    .find((value) => value != null && String(value).trim() !== '');
  const hasRubAmount = rubAmount != null;
  const currency = clean(row.currency || (hasRubAmount ? 'rub' : '')).toUpperCase() || 'RUB';
  const monetaryValueKnown = hasRubAmount || (currency === 'RUB' && genericAmount != null);
  const commission = monetaryValueKnown
    ? Math.abs(numberFrom(hasRubAmount ? rubAmount : genericAmount))
    : 0;
  const approved = ['approved', 'confirmed', 'paid'].includes(status);
  const reversed = ['cancelled', 'canceled', 'rejected', 'reversed', 'declined'].includes(status);
  // Travelpayouts `date` / `created_at` — дата действия, не клика. Подменять ею
  // click_date запрещено: зрелость когорты иначе считается от неверной точки.
  const clickDate = String(row.click_date ?? row.clickDate ?? '');
  const actionDate = String(row.action_date ?? row.booked_at ?? row.date ?? row.created_at_day ?? row.created_at ?? '');
  const decisionDate = String(row.decision_date ?? row.decisionDate ?? row.state_updated_at ?? row.updated_at ?? row.status_date ?? '');
  const rawAttribution = row.sub_id ?? row.subId ?? row.sub1 ?? row.shared_id ?? row.utm_content ?? '';
  const attribution = parseClickAttribution(rawAttribution);
  return {
    date: clickDate,
    clickDate,
    actionDate,
    decisionDate,
    partner: clean(row.partner ?? row.campaign_name_en ?? row.campaign_name ?? 'travelpayouts'),
    ctaId: attribution.ctaId,
    experimentId: attribution.experimentId,
    variant: attribution.variant,
    clickId: attribution.clickId,
    attributionContract: attribution.contract,
    currency,
    status,
    approvedRevenue: approved ? commission : 0,
    reversedRevenue: reversed ? commission : 0,
    orderId: String(row.order_id ?? row.action_id ?? row.internal_action_id ?? row.booking_id ?? ''),
    internalOrderId: String(row.internal_action_id ?? row.booking_id ?? ''),
    monetaryValueKnown,
  };
}

const clickEventId = (row) => clean(row.click_id ?? row.clickId);
const clickEventTime = (row) => String(row.event_time ?? row.eventTime ?? row.date_time ?? row.datetime ?? '');

export function joinRevenueRowsToClicks(revenueRows, clickRows) {
  const normalized = deduplicateRevenueRows(revenueRows.map((row) => (
    Object.prototype.hasOwnProperty.call(row, 'attributionContract') ? row : normalizeRevenueRow(row)
  )));
  const byClick = new Map();
  for (const click of clickRows) {
    const clickId = clickEventId(click);
    if (!CLICK_ID_RE.test(clickId)) continue;
    const existing = byClick.get(clickId) ?? [];
    const repeats = Math.max(1, Math.min(2, Number(click.event_count ?? 1)));
    for (let i = 0; i < repeats; i += 1) existing.push(click);
    byClick.set(clickId, existing);
  }

  let matched = 0;
  let missing = 0;
  let ambiguous = 0;
  let mismatched = 0;
  const rows = normalized.map((row) => {
    if (!CLICK_ID_RE.test(row.clickId || '')) {
      missing += 1;
      return row;
    }
    const candidates = byClick.get(row.clickId) ?? [];
    if (candidates.length === 0) {
      missing += 1;
      return row;
    }
    if (candidates.length !== 1) {
      ambiguous += 1;
      return row;
    }
    const click = candidates[0];
    const eventExperiment = clean(click.experiment_id ?? click.experimentId);
    const eventVariant = clean(click.variant);
    if ((eventExperiment && eventExperiment !== row.experimentId) || (eventVariant && eventVariant !== row.variant)) {
      mismatched += 1;
      return row;
    }
    const eventTime = clickEventTime(click);
    if (!Number.isFinite(Date.parse(eventTime))) {
      missing += 1;
      return row;
    }
    matched += 1;
    return {
      ...row,
      date: eventTime,
      clickDate: eventTime,
      pagePath: String(click.page_path ?? click.pagePath ?? ''),
      readerCohort: clean(click.reader_cohort ?? click.readerCohort),
      audienceSource: clean(click.audience_source ?? click.audienceSource),
      reader_cohort: clean(click.reader_cohort ?? click.readerCohort),
      audience_source: clean(click.audience_source ?? click.audienceSource),
      metrikaClick: true,
    };
  });
  const total = rows.length;
  return {
    rows,
    stats: {
      total,
      matched,
      missing,
      ambiguous,
      mismatched,
      coverage: total > 0 ? matched / total : null,
    },
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

function erfc(value) {
  // Abramowitz & Stegun 7.1.26: достаточная точность для SRM-гейта.
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const polynomial = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const erf = 1 - polynomial * Math.exp(-x * x);
  return value >= 0 ? 1 - erf : 1 + erf;
}

function srmPValue(assignmentCounts, expectedAllocation, variants) {
  const total = variants.reduce((sum, variant) => sum + numberFrom(assignmentCounts[variant]), 0);
  if (!total || variants.length !== 2) return null;
  let chiSquare = 0;
  for (const variant of variants) {
    const expected = total * numberFrom(expectedAllocation[variant]);
    if (expected <= 0) return null;
    chiSquare += ((numberFrom(assignmentCounts[variant]) - expected) ** 2) / expected;
  }
  return erfc(Math.sqrt(chiSquare / 2));
}

export function evaluateExperimentDecision({
  experiment = {},
  assignmentCounts = {},
  joinStats = {},
  revenueRows = [],
  asOfDate = '',
  maturityDaysByPartner = {},
  guardrails = {},
  effectInterval = null,
}) {
  const blockers = [];
  const block = (code, message) => blockers.push({ code, message });
  const variants = Array.isArray(experiment.variants) ? experiment.variants : [];
  const totalAssigned = variants.reduce((sum, variant) => sum + numberFrom(assignmentCounts[variant]), 0);

  if (!experiment.id || !['aa', 'ab'].includes(experiment.kind) || variants.length !== 2) {
    block('experiment_config', 'Нужен предзарегистрированный двухвариантный A/A или A/B контракт.');
  }
  const effectPlan = experiment.kind === 'aa' ? experiment.aaEquivalenceMargin : experiment.minimumDetectableEffect;
  if (!Number.isFinite(Number(experiment.minimumSampleSize)) || Number(experiment.minimumSampleSize) <= 0
      || !Number.isFinite(Number(effectPlan)) || Number(effectPlan) <= 0
      || Number(experiment.power) < 0.8 || !experiment.startedAt || !experiment.fixedEndAt) {
    block('power_plan', 'До запуска нужны MDE или A/A margin, мощность не ниже 80%, размер выборки и фиксированные даты.');
  } else if (totalAssigned < Number(experiment.minimumSampleSize)) {
    block('insufficient_sample', `Назначено ${totalAssigned}, требуется ${Number(experiment.minimumSampleSize)}.`);
  }

  const srmAlpha = Number(experiment.srmAlpha);
  const srmP = srmPValue(assignmentCounts, experiment.expectedAllocation ?? {}, variants);
  if (!Number.isFinite(srmP) || !Number.isFinite(srmAlpha) || srmAlpha <= 0) {
    block('srm_config', 'Нельзя проверить SRM без ожидаемого распределения и порога.');
  } else if (srmP < srmAlpha) {
    block('srm', `Необъяснённый SRM: p=${srmP.toFixed(6)}.`);
  }

  const attributionThreshold = Number(experiment.attributionThreshold);
  if (!Number.isFinite(attributionThreshold) || attributionThreshold <= 0 || attributionThreshold > 1) {
    block('attribution_config', 'Порог action→click join должен быть задан до запуска.');
  } else if (!Number.isFinite(Number(joinStats.coverage)) || Number(joinStats.coverage) < attributionThreshold) {
    block('attribution_coverage', `Покрытие join ниже ${(attributionThreshold * 100).toFixed(1)}%.`);
  }
  if (Number(joinStats.ambiguous) > 0 || Number(joinStats.mismatched) > 0) {
    block('ambiguous_join', 'Есть неоднозначные или противоречивые action→click связи.');
  }
  if (Number(joinStats.total) === 0) block('no_actions', 'A/A ещё не проверил денежный action→click путь.');

  const finalStatuses = new Set(['approved', 'confirmed', 'paid', 'cancelled', 'canceled', 'rejected', 'reversed', 'declined']);
  for (const row of revenueRows) {
    if (!row.orderId) block('missing_order_id', 'Есть действие без стабильного action/order ID.');
    if (!row.clickId || !row.clickDate) block('missing_click_join', 'Есть действие без точного click ID или даты клика Метрики.');
    if (!row.monetaryValueKnown) block('unknown_money', 'Есть действие без известной рублёвой суммы.');
    const maturityDays = Number(maturityDaysByPartner[row.partner] ?? maturityDaysByPartner.default);
    if (!Number.isFinite(maturityDays) || maturityDays < 0) {
      block('maturity_config', `Не задано окно зрелости для ${row.partner || 'партнёра'}.`);
    } else if (!isRevenueRowMature(row, asOfDate, maturityDaysByPartner) || !finalStatuses.has(row.status)) {
      block('immature_revenue', 'Когорта ещё не созрела или содержит нефинальный статус.');
    }
  }

  const requiredGuardrails = Array.isArray(experiment.requiredGuardrails) ? experiment.requiredGuardrails : [];
  if (!requiredGuardrails.length) block('guardrail_config', 'Охранные метрики должны быть заданы до запуска.');
  for (const name of requiredGuardrails) {
    if (guardrails[name] !== true) block('guardrail', `Не пройден guardrail: ${name}.`);
  }

  if (Number.isFinite(Date.parse(experiment.fixedEndAt || '')) && Number.isFinite(Date.parse(asOfDate || ''))
      && Date.parse(asOfDate) < Date.parse(experiment.fixedEndAt)) {
    block('fixed_horizon', 'Фиксированный горизонт эксперимента ещё не завершён.');
  }

  let winnerAllowed = false;
  if (experiment.kind === 'aa') {
    const margin = Number(experiment.aaEquivalenceMargin);
    if (!effectInterval || !Number.isFinite(Number(effectInterval.lower)) || !Number.isFinite(Number(effectInterval.upper))) {
      block('aa_equivalence', 'A/A требует заранее заданного интервала разницы диагностической метрики.');
    } else if (Number(effectInterval.lower) < -margin || Number(effectInterval.upper) > margin) {
      block('aa_equivalence', 'A/A не подтвердил эквивалентность вариантов в заданном margin.');
    }
  } else if (experiment.kind === 'ab') {
    if (!effectInterval || !Number.isFinite(Number(effectInterval.lower)) || !Number.isFinite(Number(effectInterval.upper))) {
      block('effect_interval', 'A/B-решение требует доверительного интервала OEC.');
    } else {
      winnerAllowed = Number(effectInterval.lower) >= Number(experiment.minimumDetectableEffect);
    }
  }

  const uniqueBlockers = [...new Map(blockers.map((item) => [`${item.code}\0${item.message}`, item])).values()];
  const ready = uniqueBlockers.length === 0;
  return {
    ready,
    status: ready ? (experiment.kind === 'aa' ? 'aa_validated' : 'decision_ready') : 'blocked',
    winnerAllowed: ready && experiment.kind === 'ab' && winnerAllowed,
    blockers: uniqueBlockers,
    metrics: { totalAssigned, srmPValue: srmP, attributionCoverage: joinStats.coverage ?? null },
  };
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

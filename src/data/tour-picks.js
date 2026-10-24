import picks from './tour-picks.json' with { type: 'json' };
import { tpkDeep, youtravelSub } from './affiliate.js';
import { buildCtaId } from './monetization.js';

export const TOUR_PARTNERS = Object.freeze({
  tripster: { name: 'Tripster', host: 'experience.tripster.ru', path: /^\/experience\/\d+\/$/, network: 'Travelpayouts' },
  sputnik8: { name: 'Sputnik8', host: 'www.sputnik8.com', path: /^\/ru\/[^/]+\/activities\/\d+[^/]*\/?$/, network: 'Travelpayouts' },
  tiqets: { name: 'Tiqets', host: 'www.tiqets.com', path: /-p\d+\/?$/, network: 'Travelpayouts' },
  youtravel: { name: 'YouTravel.me', host: 'youtravel.me', path: /^\/tours\/\d+\/[^/]+\/?$/, network: 'Affise' },
});
export const TOUR_PICKS = picks;
const day = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export function isTourTarget(partner, target) {
  try {
    const url = new URL(target);
    const config = TOUR_PARTNERS[partner];
    return Boolean(config && url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.search && !url.hash && url.hostname === config.host && config.path.test(url.pathname));
  } catch { return false; }
}

const validRating = (rating, minimum = 4.7) => Number.isFinite(rating) && rating >= minimum && rating <= 5;
const positiveCount = count => Number.isInteger(count) && count > 0;
const evidenceUrl = value => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

// Sparse-review programmes need explicit corroboration and an honest rating scope.
// They never inherit an organizer's statistics under a tour-review label.
export function qualityErrors(tour) {
  const quality = tour.quality;
  if (!quality || quality.mode === 'tour-reviews') {
    return validRating(tour.rating) && positiveCount(tour.reviewCount) && tour.reviewCount >= 30 && tour.ratingScope === 'tour' ? [] : ['tour-reviews'];
  }
  const errors = [];
  const sources = quality.sources;
  if (!Array.isArray(sources) || sources.length < 2 || new Set(sources.map(s => s?.url)).size < 2 || sources.some(s => !s || !evidenceUrl(s.url) || !day(s.checkedAt) || s.checkedAt > tour.checks?.checkedAt || typeof s.finding !== 'string' || !s.finding.trim())) errors.push('quality-sources');
  if (typeof quality.reason !== 'string' || quality.reason.trim().length < 40) errors.push('quality-reason');
  if (!Array.isArray(sources) || !sources.some(s => s?.kind === 'traveler-reviews')) errors.push('independent-reviews');
  if (quality.mode === 'combined') {
    const historyVerified = day(quality.organizerSince) && day(tour.checks?.checkedAt)
      && new Date(tour.checks.checkedAt) - new Date(quality.organizerSince) >= 730 * 86400000
      && Array.isArray(sources) && sources.some(s => s?.kind === 'platform-history');
    const identityVerified = quality.identityVerified === true && Array.isArray(sources)
      && sources.some(s => s?.kind === 'platform-verification');
    const reviewedProgramme = tour.tourReviewCount >= 1 && tour.ratingScope === 'tour' && tour.rating >= 4.8;
    const minimumReviews = historyVerified || (identityVerified && reviewedProgramme) ? 1 : identityVerified ? 3 : 10;
    if (!validRating(quality.organizerRating, tour.ratingScope === 'tour' && tour.reviewCount >= 3 && tour.rating >= 4.8 ? 4.7 : 4.8) || !Number.isInteger(quality.organizerReviewCount) || quality.organizerReviewCount < minimumReviews || !evidenceUrl(quality.organizerUrl)) errors.push('organizer-reputation');
    if (!['tour','organizer'].includes(tour.ratingScope) || !validRating(tour.rating) || !positiveCount(tour.reviewCount)) errors.push('rating-scope');
    if (tour.ratingScope === 'organizer' && (tour.rating !== quality.organizerRating || tour.reviewCount !== quality.organizerReviewCount)) errors.push('organizer-statistics');
    if (!Number.isInteger(tour.tourReviewCount) || tour.tourReviewCount < 0 || (tour.ratingScope === 'tour' && tour.tourReviewCount !== tour.reviewCount)) errors.push('tour-review-count');
  } else if (quality.mode === 'official-supplier') {
    if (!evidenceUrl(quality.officialUrl) || (!Array.isArray(sources) || !sources.some(s => s?.kind === 'official-supplier' && s.url === quality.officialUrl))) errors.push('official-supplier');
    if (!['tour','venue','organizer'].includes(tour.ratingScope) || !validRating(tour.rating,4.5) || !positiveCount(tour.reviewCount)) errors.push('supplier-reviews');
  } else errors.push('quality-mode');
  return errors;
}

export function tourErrors(tour) {
  const errors = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tour.id || '')) errors.push('id');
  if (!isTourTarget(tour.partner, tour.url)) errors.push('target');
  for (const key of ['destination', 'title', 'city', 'duration', 'language', 'reason', 'experienceKey']) {
    if (typeof tour[key] !== 'string' || !tour[key].trim()) errors.push(key);
  }
  if (!['excursion', 'ticket', 'multiday'].includes(tour.kind)) errors.push('kind');
  errors.push(...qualityErrors(tour));
  const evidence = tour.checks;
  if (!evidence || evidence.source !== tour.url || evidence.method !== 'primary-page' || !day(evidence.checkedAt) || !day(evidence.reviewAfter) || evidence.reviewAfter <= evidence.checkedAt) errors.push('evidence');
  for (const key of ['program', 'positiveReviews', 'criticalReviews', 'organizer', 'payment', 'cancellation', 'geography']) {
    if (typeof evidence?.[key] !== 'string' || !evidence[key].trim()) errors.push(`checks.${key}`);
  }
  if (tour.price && (!Number.isFinite(tour.price.rub) || tour.price.rub <= 0 || !['person', 'group'].includes(tour.price.unit) || !day(tour.price.checkedAt) || !day(tour.price.reviewAfter) || tour.price.reviewAfter <= tour.price.checkedAt)) errors.push('price');
  return errors;
}

export function tourRatingLabel(tour) {
  return tour.ratingScope === 'organizer' ? `Организатор${tour.ratingSource ? ` (${tour.ratingSource})` : ''}` : tour.ratingScope === 'venue' ? 'Достопримечательность' : 'Предложение';
}

export function tourCollection(destination, { now = new Date(), records = picks } = {}) {
  const today = now.toISOString().slice(0, 10);
  const seen = new Set();
  return records.filter(tour => {
    if (tour.destination !== destination || tour.status !== 'approved' || tourErrors(tour).length || tour.checks.checkedAt > today || tour.checks.reviewAfter <= today || seen.has(tour.experienceKey)) return false;
    seen.add(tour.experienceKey);
    return true;
  }).slice(0, 10);
}

export function tourAffiliateUrl(tour, pathname) {
  if (!isTourTarget(tour.partner, tour.url)) throw new Error('Invalid tour target');
  const ctaId = buildCtaId(pathname, tour.partner, `tour_${tour.id}`);
  const href = tour.partner === 'youtravel'
    ? `${youtravelSub(ctaId)}&redirect=${encodeURIComponent(tour.url)}`
    : tpkDeep(tour.partner, tour.url, ctaId);
  return { href, ctaId };
}

export function tourPrice(tour, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const price = tour.price;
  if (!price || price.checkedAt > today || price.reviewAfter <= today) return 'Уточнить стоимость';
  const unit = price.unit === 'group'
    ? `за группу${Number.isInteger(price.maxPersons) && price.maxPersons > 0 ? ` до ${price.maxPersons} чел.` : ''}`
    : 'за человека';
  return `от ${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(price.rub)} ₽ ${unit}`;
}

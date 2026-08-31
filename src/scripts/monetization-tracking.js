import {
  addCtaAttribution,
  addClickAttribution,
  buildCtaId,
  classifyPage,
  classifyPartner,
  createClickId,
  isGenericAffiliateUrl,
  updateAudienceAttribution,
  updateReaderLifecycle,
} from '../data/monetization.js';
import { destinationAffiliateUrl } from '../data/affiliate.js';

const OWN_HOSTS = new Set(['t.me']);

function placementOf(anchor) {
  if (anchor.dataset.placement) return anchor.dataset.placement;
  if (anchor.closest('.sticky-cta')) return 'sticky';
  if (anchor.closest('.pricing-cards, table')) return 'comparison';
  if (anchor.closest('.flight-routes')) return 'route';
  if (anchor.closest('[class*="answer"], [class*="capsule"], [class*="hero"], blockquote')) return 'answer';
  if (anchor.closest('footer')) return 'footer';
  if (anchor.closest('header, nav')) return 'navigation';
  if (anchor.closest('[class*="faq"]')) return 'faq';
  return 'body';
}

function hostOf(anchor) {
  try { return new URL(anchor.href).hostname.toLowerCase(); } catch { return ''; }
}

function cleanText(value, limit = 120) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function isSponsored(anchor) {
  return anchor.relList?.contains('sponsored') || anchor.classList.contains('aff-cta');
}

export function prepareAffiliateLinks(doc = document, pathname = window.location.pathname) {
  const inferred = classifyPage(pathname);
  const page = {
    type: doc.body.dataset.pageType || inferred.type,
    intent: doc.body.dataset.monetizationIntent || inferred.intent,
    destination: doc.body.dataset.destination || inferred.destination,
  };
  doc.body.dataset.pageType = page.type;
  doc.body.dataset.monetizationIntent = page.intent;
  doc.body.dataset.destination = page.destination;

  const counters = new Map();
  const links = [...doc.querySelectorAll('a[href^="http"]')];
  for (const anchor of links) {
    if (anchor.dataset.ctaPrepared === '1') continue;
    const known = classifyPartner(anchor.href);
    if (!known && !isSponsored(anchor)) continue;

    const partner = (known?.partner ?? hostOf(anchor).replace(/^www\./, '').split('.')[0]) || 'other';
    const offer = known?.offer ?? 'other';
    const placement = placementOf(anchor);
    const counterKey = `${partner}:${placement}`;
    const ordinal = (counters.get(counterKey) ?? 0) + 1;
    counters.set(counterKey, ordinal);
    const ctaId = buildCtaId(pathname, partner, placement, ordinal);

    if (known && page.destination && isGenericAffiliateUrl(anchor.href, partner)) {
      const destinationUrl = destinationAffiliateUrl(partner, page.destination, ctaId);
      if (destinationUrl) {
        anchor.href = destinationUrl;
        anchor.dataset.deepLink = 'destination';
      } else {
        anchor.dataset.deepLink = 'unavailable';
      }
    }
    if (known) anchor.href = addCtaAttribution(anchor.href, ctaId);
    anchor.dataset.attributionHref = anchor.href;
    anchor.dataset.ctaPrepared = '1';
    anchor.dataset.ctaId = ctaId;
    anchor.dataset.partner = partner;
    anchor.dataset.offer = offer;
    anchor.dataset.placement = placement;
    anchor.dataset.linkPosition = String(ordinal);
    anchor.dataset.pageType = page.type;
    anchor.dataset.intent = page.intent;
    anchor.dataset.destination = page.destination;
    anchor.dataset.experimentId ||= doc.body.dataset.experimentId || '';
    anchor.dataset.variant ||= doc.body.dataset.experimentVariant || '';

    anchor.target = '_blank';
    anchor.relList.add('noopener');
    anchor.relList.add('sponsored');
  }
  return links.filter((anchor) => anchor.dataset.ctaPrepared === '1');
}

export function prepareOwnChannelLinks(doc = document, pathname = window.location.pathname) {
  const inferred = classifyPage(pathname);
  const page = {
    type: doc.body.dataset.pageType || inferred.type,
    intent: doc.body.dataset.monetizationIntent || inferred.intent,
  };
  const counters = new Map();
  const links = [...doc.querySelectorAll('a[href^="http"]')].filter(isOwnChannel);
  for (const anchor of links) {
    if (anchor.dataset.channelPrepared === '1') continue;
    const placement = placementOf(anchor);
    const ordinal = (counters.get(placement) ?? 0) + 1;
    counters.set(placement, ordinal);
    anchor.dataset.channelPrepared = '1';
    anchor.dataset.channelCtaId = buildCtaId(pathname, 'telegram', placement, ordinal);
    anchor.dataset.placement = placement;
    anchor.dataset.linkPosition = String(ordinal);
    anchor.dataset.pageType = page.type;
    anchor.dataset.intent = page.intent;
    anchor.target = '_blank';
    anchor.relList.add('noopener');
    anchor.relList.remove('sponsored');
  }
  return links;
}

export function monetizationPayload(anchor, pathname = window.location.pathname, clickId = '') {
  const readerCohort = anchor.ownerDocument?.body?.dataset.readerCohort || 'unknown';
  const audienceSource = anchor.ownerDocument?.body?.dataset.audienceSource || 'unattributed';
  return {
    page_path: pathname,
    page_type: anchor.dataset.pageType || 'unknown',
    intent: anchor.dataset.intent || 'unknown',
    destination: anchor.dataset.destination || '',
    partner: anchor.dataset.partner || 'unknown',
    offer: anchor.dataset.offer || 'other',
    placement: anchor.dataset.placement || 'body',
    cta_id: anchor.dataset.ctaId || '',
    link_position: Number(anchor.dataset.linkPosition || 0),
    experiment_id: anchor.dataset.experimentId || '',
    variant: anchor.dataset.variant || '',
    assignment_unit: anchor.ownerDocument?.body?.dataset.assignmentUnit || '',
    click_id: clickId,
    click_context: `${clickId}__${readerCohort}__${audienceSource}`,
    reader_cohort: readerCohort,
    audience_source: audienceSource,
    partner_join: classifyPartner(anchor.dataset.attributionHref || anchor.href)?.attribution === 'sub_id'
      ? 'click_id'
      : 'metrika_only',
    anchor: cleanText(anchor.textContent),
    contract: 'revenue_v2',
  };
}

export function audiencePayload(anchor, pathname = window.location.pathname) {
  const body = anchor.ownerDocument?.body;
  return {
    from: pathname,
    page_path: pathname,
    page_type: anchor.dataset.pageType || body?.dataset.pageType || 'unknown',
    intent: anchor.dataset.intent || body?.dataset.monetizationIntent || 'unknown',
    channel: 'telegram',
    placement: anchor.dataset.placement || 'body',
    channel_cta_id: anchor.dataset.channelCtaId || '',
    link_position: Number(anchor.dataset.linkPosition || 0),
    reader_cohort: body?.dataset.readerCohort || 'unknown',
    audience_source: body?.dataset.audienceSource || 'unattributed',
    anchor: cleanText(anchor.textContent),
    contract: 'audience_v1',
  };
}

export function initMonetizationTracking(doc = document, win = window) {
  if (win.__ttMonetizationTracking) {
    prepareAffiliateLinks(doc, win.location.pathname);
    prepareOwnChannelLinks(doc, win.location.pathname);
    return;
  }
  win.__ttMonetizationTracking = true;

  const lifecycle = updateReaderLifecycle(win.localStorage, new Date());
  const audience = updateAudienceAttribution(win.localStorage, win.location.href, new Date());
  doc.body.dataset.readerCohort = lifecycle.cohort;
  doc.body.dataset.readerAgeDays = String(lifecycle.readerAgeDays);
  doc.body.dataset.audienceSource = audience.source;
  if (typeof win.ym === 'function') {
    win.ym(95832375, 'params', {
      reader_lifecycle: { cohort: lifecycle.cohort },
      audience_source: { bucket: audience.source },
    });
  }
  prepareAffiliateLinks(doc, win.location.pathname);
  prepareOwnChannelLinks(doc, win.location.pathname);

  doc.addEventListener('astro:page-load', () => {
    const nextAudience = updateAudienceAttribution(win.localStorage, win.location.href, new Date());
    doc.body.dataset.audienceSource = nextAudience.source;
    prepareAffiliateLinks(doc, win.location.pathname);
    prepareOwnChannelLinks(doc, win.location.pathname);
    if (typeof win.ym === 'function') {
      win.ym(95832375, 'params', {
        reader_lifecycle: { cohort: doc.body.dataset.readerCohort || 'unknown' },
        audience_source: { bucket: nextAudience.source },
      });
    }
  });
  function recordAffiliateClick(event) {
    const anchor = event.target?.closest?.('a[data-cta-id]');
    if (!anchor) return;
    const clickId = createClickId(win.crypto);
    const ctaId = anchor.dataset.ctaId || '';
    const experimentId = anchor.dataset.experimentId || 'baseline';
    const variant = anchor.dataset.variant || 'na';
    const baseHref = anchor.dataset.attributionHref || anchor.href;
    anchor.href = addClickAttribution(baseHref, { ctaId, experimentId, variant, clickId });
    const payload = monetizationPayload(anchor, win.location.pathname, clickId);
    doc.dispatchEvent(new CustomEvent('tt:affiliate-click', { detail: payload }));
    if (typeof win.ym === 'function') win.ym(95832375, 'reachGoal', 'outbound_link', payload);
  }
  doc.addEventListener('click', recordAffiliateClick, true);
  doc.addEventListener('auxclick', (event) => {
    if (event.button === 1) recordAffiliateClick(event);
  }, true);

  function recordOwnChannelClick(event) {
    const anchor = event.target?.closest?.('a[data-channel-cta-id]');
    if (!anchor) return;
    const payload = audiencePayload(anchor, win.location.pathname);
    doc.dispatchEvent(new CustomEvent('tt:channel-click', { detail: payload }));
    if (typeof win.ym === 'function') win.ym(95832375, 'reachGoal', 'telegram_click', payload);
  }
  doc.addEventListener('click', recordOwnChannelClick, true);
  doc.addEventListener('auxclick', (event) => {
    if (event.button === 1) recordOwnChannelClick(event);
  }, true);
}

export function isOwnChannel(anchor) {
  return OWN_HOSTS.has(hostOf(anchor));
}

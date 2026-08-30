import {
  addCtaAttribution,
  buildCtaId,
  classifyPage,
  classifyPartner,
  isGenericAffiliateUrl,
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

export function monetizationPayload(anchor, pathname = window.location.pathname) {
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
    anchor: cleanText(anchor.textContent),
    contract: 'revenue_v1',
  };
}

export function initMonetizationTracking(doc = document, win = window) {
  if (win.__ttMonetizationTracking) {
    prepareAffiliateLinks(doc, win.location.pathname);
    return;
  }
  win.__ttMonetizationTracking = true;
  prepareAffiliateLinks(doc, win.location.pathname);

  doc.addEventListener('astro:page-load', () => prepareAffiliateLinks(doc, win.location.pathname));
  doc.addEventListener('click', (event) => {
    const anchor = event.target?.closest?.('a[data-cta-id]');
    if (!anchor) return;
    const payload = monetizationPayload(anchor, win.location.pathname);
    doc.dispatchEvent(new CustomEvent('tt:affiliate-click', { detail: payload }));
    if (typeof win.ym === 'function') win.ym(95832375, 'reachGoal', 'outbound_link', payload);
  }, true);
}

export function isOwnChannel(anchor) {
  return OWN_HOSTS.has(hostOf(anchor));
}
